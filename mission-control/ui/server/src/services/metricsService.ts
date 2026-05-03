// Use Node.js built-in sqlite (available since Node.js 22.5 / 24)
// @ts-ignore — node:sqlite typings may not be in @types/node yet
import { DatabaseSync } from 'node:sqlite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { broadcast } from './sseService.js'
import type {
  Session,
  MetricEvent,
  SkillStat,
  AgentStat,
  ModelStat,
  DailyTokenStat,
  MetricsSummary,
} from '../types/metrics.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
// server/src/services → server/src → server → ui → mission-control → metrics
const METRICS_DIR = resolve(__dirname, '../../../../metrics')
const DB_PATH = resolve(METRICS_DIR, 'workspace-metrics.db')

function ensureMetricsDir(): void {
  mkdirSync(METRICS_DIR, { recursive: true })
}

let _db: InstanceType<typeof DatabaseSync> | null = null

type SqlParam = string | number | bigint | Uint8Array | null

function getDb(): InstanceType<typeof DatabaseSync> {
  if (_db) return _db
  ensureMetricsDir()
  _db = new DatabaseSync(DB_PATH)
  _db.exec('PRAGMA journal_mode = WAL')
  _db.exec('PRAGMA foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: InstanceType<typeof DatabaseSync>): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      started_at    TEXT NOT NULL,
      ended_at      TEXT,
      workspace     TEXT,
      model         TEXT,
      total_tokens_input  INTEGER DEFAULT 0,
      total_tokens_output INTEGER DEFAULT 0,
      event_count   INTEGER DEFAULT 0
    );

    -- System sessions for automatic collectors
    INSERT OR IGNORE INTO sessions (id, started_at, workspace, model) VALUES
      ('kanban-watcher', datetime('now'), 'system', 'none'),
      ('git-poller',     datetime('now'), 'system', 'none'),
      ('git-hook',       datetime('now'), 'system', 'none'),
      ('opencode-hook',  datetime('now'), 'system', 'none');

    CREATE TABLE IF NOT EXISTS events (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id          TEXT,
      timestamp           TEXT NOT NULL,
      event_type          TEXT NOT NULL,
      workspace           TEXT,
      model               TEXT,
      skill_name          TEXT,
      agent_name          TEXT,
      task_id             TEXT,
      tokens_input        INTEGER DEFAULT 0,
      tokens_output       INTEGER DEFAULT 0,
      context_files_count INTEGER DEFAULT 0,
      duration_ms         INTEGER,
      status              TEXT DEFAULT 'success',
      metadata            TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_events_session   ON events(session_id);
    CREATE INDEX IF NOT EXISTS idx_events_type      ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_skill     ON events(skill_name);
    CREATE INDEX IF NOT EXISTS idx_events_agent     ON events(agent_name);
    CREATE INDEX IF NOT EXISTS idx_events_workspace ON events(workspace);
  `)
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function createSession(session: Omit<Session, 'total_tokens_input' | 'total_tokens_output' | 'event_count'>): Session {
  const db = getDb()
  const now = new Date().toISOString()
  const row: Session = {
    id: session.id,
    started_at: session.started_at ?? now,
    ended_at: session.ended_at,
    workspace: session.workspace,
    model: session.model,
    total_tokens_input: 0,
    total_tokens_output: 0,
    event_count: 0,
  }
  db.prepare(`
    INSERT OR REPLACE INTO sessions (id, started_at, ended_at, workspace, model, total_tokens_input, total_tokens_output, event_count)
    VALUES (?, ?, ?, ?, ?, 0, 0, 0)
  `).run(row.id, row.started_at, row.ended_at ?? null, row.workspace ?? null, row.model ?? null)
  return row
}

export function updateSession(id: string, patch: Partial<Omit<Session, 'id'>>): void {
  const db = getDb()
  const fields: string[] = []
  const values: SqlParam[] = []
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) {
      fields.push(`${k} = ?`)
      values.push(v as SqlParam)
    }
  }
  if (fields.length === 0) return
  values.push(id)
  db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export function listSessions(limit = 50, offset = 0): Session[] {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM sessions ORDER BY started_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as unknown as Session[]
}

export function getSession(id: string): Session | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function insertEvent(event: Omit<MetricEvent, 'id'>): MetricEvent {
  const db = getDb()
  const timestamp = event.timestamp ?? new Date().toISOString()
  const row = { ...event, timestamp }

  const ti = row.tokens_input ?? 0
  const to = row.tokens_output ?? 0

  // Auto-create session if not exists (handles ad-hoc / external callers)
  if (row.session_id) {
    db.prepare(`
      INSERT OR IGNORE INTO sessions (id, started_at, workspace, model)
      VALUES (?, ?, ?, ?)
    `).run(row.session_id, timestamp, row.workspace ?? null, row.model ?? null)
  }

  const info = db.prepare(`
    INSERT INTO events (session_id, timestamp, event_type, workspace, model, skill_name, agent_name,
      task_id, tokens_input, tokens_output, context_files_count, duration_ms, status, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.session_id ?? null,
    row.timestamp,
    row.event_type,
    row.workspace ?? null,
    row.model ?? null,
    row.skill_name ?? null,
    row.agent_name ?? null,
    row.task_id ?? null,
    ti,
    to,
    row.context_files_count ?? 0,
    row.duration_ms ?? null,
    row.status ?? 'success',
    row.metadata ?? null,
  )

  // Update session aggregates
  if (row.session_id) {
    db.prepare(`
      UPDATE sessions
      SET total_tokens_input  = total_tokens_input  + ?,
          total_tokens_output = total_tokens_output + ?,
          event_count         = event_count + 1
      WHERE id = ?
    `).run(ti, to, row.session_id)
  }

  // Broadcast to SSE clients and return
  const inserted: MetricEvent = { ...row, id: Number((info as { lastInsertRowid: number | bigint }).lastInsertRowid) }
  broadcast('metric', inserted)
  return inserted
}

export function listEvents(filters: {
  session_id?: string
  event_type?: string
  workspace?: string
  skill_name?: string
  agent_name?: string
  limit?: number
  offset?: number
} = {}): MetricEvent[] {
  const db = getDb()
  const conds: string[] = []
  const vals: SqlParam[] = []

  if (filters.session_id) { conds.push('session_id = ?'); vals.push(filters.session_id) }
  if (filters.event_type) { conds.push('event_type = ?'); vals.push(filters.event_type) }
  if (filters.workspace)  { conds.push('workspace = ?');  vals.push(filters.workspace) }
  if (filters.skill_name) { conds.push('skill_name = ?'); vals.push(filters.skill_name) }
  if (filters.agent_name) { conds.push('agent_name = ?'); vals.push(filters.agent_name) }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const limit  = filters.limit  ?? 100
  const offset = filters.offset ?? 0

  return db.prepare(`
    SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?
  `).all(...vals, limit, offset) as unknown as MetricEvent[]
}

// ─── Aggregated Stats ─────────────────────────────────────────────────────────

export function getSkillStats(): SkillStat[] {
  const db = getDb()
  return db.prepare(`
    SELECT
      skill_name,
      COUNT(*)                   AS invocations,
      SUM(tokens_input)          AS total_tokens_input,
      SUM(tokens_output)         AS total_tokens_output,
      AVG(duration_ms)           AS avg_duration_ms,
      MAX(timestamp)             AS last_used
    FROM events
    WHERE skill_name IS NOT NULL AND event_type = 'skill_invoked'
    GROUP BY skill_name
    ORDER BY invocations DESC
  `).all() as unknown as SkillStat[]
}

export function getAgentStats(): AgentStat[] {
  const db = getDb()
  return db.prepare(`
    SELECT
      agent_name,
      COUNT(*)                   AS invocations,
      SUM(tokens_input)          AS total_tokens_input,
      SUM(tokens_output)         AS total_tokens_output,
      AVG(duration_ms)           AS avg_duration_ms,
      MAX(timestamp)             AS last_used
    FROM events
    WHERE agent_name IS NOT NULL AND event_type = 'agent_invoked'
    GROUP BY agent_name
    ORDER BY invocations DESC
  `).all() as unknown as AgentStat[]
}

export function getModelStats(): ModelStat[] {
  const db = getDb()
  return db.prepare(`
    SELECT
      COALESCE(model, 'unknown')          AS model,
      COUNT(DISTINCT session_id)          AS sessions,
      SUM(tokens_input)                   AS total_tokens_input,
      SUM(tokens_output)                  AS total_tokens_output
    FROM events
    WHERE model IS NOT NULL
    GROUP BY model
    ORDER BY total_tokens_input + total_tokens_output DESC
  `).all() as unknown as ModelStat[]
}

export function getDailyTokenStats(days = 30): DailyTokenStat[] {
  const db = getDb()
  return db.prepare(`
    SELECT
      substr(timestamp, 1, 10)   AS date,
      SUM(tokens_input)          AS tokens_input,
      SUM(tokens_output)         AS tokens_output,
      COUNT(*)                   AS events
    FROM events
    WHERE timestamp >= datetime('now', '-${days} days')
    GROUP BY date
    ORDER BY date ASC
  `).all() as unknown as DailyTokenStat[]
}

export function getSummary(): MetricsSummary {
  const db = getDb()

  const totals = db.prepare(`
    SELECT
      COUNT(DISTINCT s.id)           AS total_sessions,
      COUNT(e.id)                    AS total_events,
      SUM(e.tokens_input)            AS total_tokens_input,
      SUM(e.tokens_output)           AS total_tokens_output,
      SUM(CASE WHEN e.event_type='skill_invoked' THEN 1 ELSE 0 END)  AS total_skills_invoked,
      SUM(CASE WHEN e.event_type='agent_invoked' THEN 1 ELSE 0 END)  AS total_agents_invoked,
      COUNT(DISTINCT e.skill_name)   AS unique_skills,
      COUNT(DISTINCT e.agent_name)   AS unique_agents,
      COUNT(DISTINCT e.workspace)    AS unique_workspaces,
      COUNT(DISTINCT e.model)        AS unique_models
    FROM sessions s
    LEFT JOIN events e ON e.session_id = s.id
  `).get() as Record<string, number | null>

  const topSkill = db.prepare(`
    SELECT skill_name FROM events
    WHERE event_type='skill_invoked' AND skill_name IS NOT NULL
    GROUP BY skill_name ORDER BY COUNT(*) DESC LIMIT 1
  `).get() as { skill_name: string } | undefined

  const topAgent = db.prepare(`
    SELECT agent_name FROM events
    WHERE event_type='agent_invoked' AND agent_name IS NOT NULL
    GROUP BY agent_name ORDER BY COUNT(*) DESC LIMIT 1
  `).get() as { agent_name: string } | undefined

  const topModel = db.prepare(`
    SELECT model FROM events WHERE model IS NOT NULL
    GROUP BY model ORDER BY COUNT(*) DESC LIMIT 1
  `).get() as { model: string } | undefined

  return {
    total_sessions:      totals.total_sessions      ?? 0,
    total_events:        totals.total_events         ?? 0,
    total_tokens_input:  totals.total_tokens_input   ?? 0,
    total_tokens_output: totals.total_tokens_output  ?? 0,
    total_skills_invoked:totals.total_skills_invoked ?? 0,
    total_agents_invoked:totals.total_agents_invoked ?? 0,
    unique_skills:       totals.unique_skills        ?? 0,
    unique_agents:       totals.unique_agents        ?? 0,
    unique_workspaces:   totals.unique_workspaces    ?? 0,
    unique_models:       totals.unique_models        ?? 0,
    top_skill:           topSkill?.skill_name        ?? null,
    top_agent:           topAgent?.agent_name        ?? null,
    most_used_model:     topModel?.model             ?? null,
  }
}

export function exportAll(): { sessions: Session[]; events: MetricEvent[] } {
  const db = getDb()
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY started_at').all() as unknown as Session[]
  const events   = db.prepare('SELECT * FROM events ORDER BY timestamp').all() as unknown as MetricEvent[]
  return { sessions, events }
}
