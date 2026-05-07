/**
 * Metrics service — in-memory store + Langfuse bridge.
 *
 * Replaces the previous SQLite-based implementation.
 * All data is forwarded to Langfuse for persistent storage and rich analytics.
 * The in-memory state provides a fast summary for the Mission Control UI
 * without requiring a Langfuse API round-trip on every page load.
 *
 * On server restart the in-memory state is empty (Langfuse holds the history).
 */
import { randomUUID } from 'crypto'
import { broadcast } from './sseService.js'
import { upsertTrace, endTrace, recordEvent as lf_recordEvent } from './langfuseService.js'
import type {
  Session,
  MetricEvent,
  SkillStat,
  AgentStat,
  ModelStat,
  DailyTokenStat,
  MetricsSummary,
} from '../types/metrics.js'

// ─── In-memory state ─────────────────────────────────────────────────────────

const sessions = new Map<string, Session>()
const events: MetricEvent[] = []
const MAX_EVENTS = 500 // keep a rolling window in memory

// Aggregation counters (reset on restart — Langfuse holds the full history)
const skillStats   = new Map<string, SkillStat>()
const agentStats   = new Map<string, AgentStat>()
const modelStats   = new Map<string, ModelStat>()
const dailyTokens  = new Map<string, DailyTokenStat>() // key = YYYY-MM-DD

// ─── Sessions ────────────────────────────────────────────────────────────────

export function createSession(
  session: Omit<Session, 'total_tokens_input' | 'total_tokens_output' | 'event_count'>,
): Session {
  const full: Session = {
    ...session,
    id:         session.id ?? randomUUID(),
    started_at: session.started_at ?? new Date().toISOString(),
    total_tokens_input:  0,
    total_tokens_output: 0,
    event_count: 0,
  }
  sessions.set(full.id, full)
  upsertTrace(full)
  return full
}

export function updateSession(id: string, patch: Partial<Session>): void {
  const existing = sessions.get(id)
  if (!existing) {
    sessions.set(id, {
      id,
      started_at: new Date().toISOString(),
      total_tokens_input:  0,
      total_tokens_output: 0,
      event_count: 0,
      ...patch,
    })
  } else {
    Object.assign(existing, patch)
  }
  if (patch.ended_at) endTrace(id, patch.ended_at)
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id)
}

export function listSessions(limit = 50, offset = 0): Session[] {
  return [...sessions.values()].reverse().slice(offset, offset + limit)
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function insertEvent(event: Omit<MetricEvent, 'id'>): MetricEvent {
  const full: MetricEvent = {
    ...event,
    id:         events.length + 1,
    session_id: event.session_id ?? 'untracked',
    timestamp:  event.timestamp  ?? new Date().toISOString(),
  }

  if (full.session_id !== 'untracked' && !sessions.has(full.session_id)) {
    createSession({
      id:        full.session_id,
      started_at: full.timestamp,
      workspace: full.workspace,
      model:     full.model,
    })
  }

  const sess = sessions.get(full.session_id)
  if (sess) {
    sess.total_tokens_input  += full.tokens_input  ?? 0
    sess.total_tokens_output += full.tokens_output ?? 0
    sess.event_count         += 1
  }

  events.push(full)
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS)

  _updateSkillStats(full)
  _updateAgentStats(full)
  _updateModelStats(full)
  _updateDailyTokens(full)

  lf_recordEvent(full)
  broadcast('metric_event', full)

  return full
}

export function insertEventBatch(eventList: Array<Omit<MetricEvent, 'id'>>): MetricEvent[] {
  return eventList.map(e => insertEvent(e))
}

export function listEvents(limit = 50, offset = 0): MetricEvent[] {
  return [...events].reverse().slice(offset, offset + limit)
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

function _updateSkillStats(event: MetricEvent): void {
  if (!event.skill_name) return
  const key = event.skill_name
  const s = skillStats.get(key) ?? { skill_name: key, invocations: 0, total_tokens_input: 0, total_tokens_output: 0, avg_duration_ms: null, last_used: event.timestamp }
  s.invocations++
  s.total_tokens_input  += event.tokens_input  ?? 0
  s.total_tokens_output += event.tokens_output ?? 0
  s.last_used = event.timestamp
  if (event.duration_ms) s.avg_duration_ms = s.avg_duration_ms ? Math.round((s.avg_duration_ms + event.duration_ms) / 2) : event.duration_ms
  skillStats.set(key, s)
}

function _updateAgentStats(event: MetricEvent): void {
  if (!event.agent_name) return
  const key = event.agent_name
  const s = agentStats.get(key) ?? { agent_name: key, invocations: 0, total_tokens_input: 0, total_tokens_output: 0, avg_duration_ms: null, last_used: event.timestamp }
  s.invocations++
  s.total_tokens_input  += event.tokens_input  ?? 0
  s.total_tokens_output += event.tokens_output ?? 0
  s.last_used = event.timestamp
  if (event.duration_ms) s.avg_duration_ms = s.avg_duration_ms ? Math.round((s.avg_duration_ms + event.duration_ms) / 2) : event.duration_ms
  agentStats.set(key, s)
}

function _updateModelStats(event: MetricEvent): void {
  if (!event.model) return
  const s = modelStats.get(event.model) ?? { model: event.model, sessions: 0, total_tokens_input: 0, total_tokens_output: 0 }
  if (event.event_type === 'session_start') s.sessions++
  s.total_tokens_input  += event.tokens_input  ?? 0
  s.total_tokens_output += event.tokens_output ?? 0
  modelStats.set(event.model, s)
}

function _updateDailyTokens(event: MetricEvent): void {
  const date = event.timestamp.slice(0, 10)
  const s = dailyTokens.get(date) ?? { date, tokens_input: 0, tokens_output: 0, events: 0 }
  s.tokens_input  += event.tokens_input  ?? 0
  s.tokens_output += event.tokens_output ?? 0
  s.events++
  dailyTokens.set(date, s)
}

// ─── Query helpers ───────────────────────────────────────────────────────────

export function getSkillStats(): SkillStat[] {
  return [...skillStats.values()].sort((a, b) => b.invocations - a.invocations)
}

export function getAgentStats(): AgentStat[] {
  return [...agentStats.values()].sort((a, b) => b.invocations - a.invocations)
}

export function getModelStats(): ModelStat[] {
  return [...modelStats.values()].sort((a, b) => b.total_tokens_input - a.total_tokens_input)
}

export function getDailyTokenStats(days = 30): DailyTokenStat[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return [...dailyTokens.values()].filter(d => d.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date))
}

export function getSummary(): MetricsSummary {
  const totalIn  = events.reduce((s, e) => s + (e.tokens_input  ?? 0), 0)
  const totalOut = events.reduce((s, e) => s + (e.tokens_output ?? 0), 0)
  const topSkill = skillStats.size ? [...skillStats.values()].sort((a, b) => b.invocations - a.invocations)[0]?.skill_name ?? null : null
  const topAgent = agentStats.size ? [...agentStats.values()].sort((a, b) => b.invocations - a.invocations)[0]?.agent_name ?? null : null
  const topModel = modelStats.size ? [...modelStats.values()].sort((a, b) => b.total_tokens_input - a.total_tokens_input)[0]?.model ?? null : null
  return {
    total_sessions:         sessions.size,
    total_events:           events.length,
    total_tokens_input:     totalIn,
    total_tokens_output:    totalOut,
    total_skills_invoked:   events.filter(e => e.event_type === 'skill_invoked').length,
    total_agents_invoked:   events.filter(e => e.event_type === 'agent_invoked').length,
    unique_skills:          skillStats.size,
    unique_agents:          agentStats.size,
    unique_workspaces:      new Set(events.map(e => e.workspace).filter(Boolean)).size,
    unique_models:          modelStats.size,
    top_skill:              topSkill,
    top_agent:              topAgent,
    most_used_model:        topModel,
  }
}

export function exportAll() {
  return {
    sessions: [...sessions.values()],
    events,
    skills:  getSkillStats(),
    agents:  getAgentStats(),
    models:  getModelStats(),
    summary: getSummary(),
  }
}
