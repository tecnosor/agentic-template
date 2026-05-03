import { Router } from 'express'
import { randomUUID } from 'crypto'
import {
  createSession,
  updateSession,
  listSessions,
  getSession,
  insertEvent,
  listEvents,
  getSkillStats,
  getAgentStats,
  getModelStats,
  getDailyTokenStats,
  getSummary,
  exportAll,
} from '../services/metricsService.js'
import { addClient, removeClient, clientCount } from '../services/sseService.js'
import type { MetricEvent, Session } from '../types/metrics.js'

const router = Router()

// ─── Sessions ────────────────────────────────────────────────────────────────

// POST /api/metrics/sessions  → start a new session
router.post('/metrics/sessions', (req, res) => {
  try {
    const body = req.body as Partial<Session>
    const session = createSession({
      id: body.id ?? randomUUID(),
      started_at: body.started_at ?? new Date().toISOString(),
      ended_at: body.ended_at,
      workspace: body.workspace,
      model: body.model,
    })
    res.status(201).json(session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// PATCH /api/metrics/sessions/:id  → update / end session
router.patch('/metrics/sessions/:id', (req, res) => {
  try {
    const { id } = req.params
    const body = req.body as Partial<Session>
    updateSession(id, body)
    const updated = getSession(id)
    if (!updated) return res.status(404).json({ error: 'Session not found' })
    return res.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/sessions
router.get('/metrics/sessions', (req, res) => {
  try {
    const limit  = parseInt(String(req.query.limit  ?? 50), 10)
    const offset = parseInt(String(req.query.offset ?? 0),  10)
    res.json(listSessions(limit, offset))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/sessions/:id
router.get('/metrics/sessions/:id', (req, res) => {
  try {
    const session = getSession(req.params.id)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    return res.json(session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// ─── Events ──────────────────────────────────────────────────────────────────

// POST /api/metrics/events  → record a single event
router.post('/metrics/events', (req, res) => {
  try {
    const body = req.body as Omit<MetricEvent, 'id'>
    if (!body.event_type) return res.status(400).json({ error: 'event_type is required' })
    const event = insertEvent({
      ...body,
      session_id: body.session_id ?? 'untracked',
      timestamp: body.timestamp ?? new Date().toISOString(),
    })
    return res.status(201).json(event)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// POST /api/metrics/events/batch  → record multiple events at once
router.post('/metrics/events/batch', (req, res) => {
  try {
    const events = req.body as Omit<MetricEvent, 'id'>[]
    if (!Array.isArray(events)) return res.status(400).json({ error: 'Body must be an array' })
    const results = events.map(e =>
      insertEvent({
        ...e,
        session_id: e.session_id ?? 'untracked',
        timestamp: e.timestamp ?? new Date().toISOString(),
      })
    )
    return res.status(201).json(results)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/events
router.get('/metrics/events', (req, res) => {
  try {
    const events = listEvents({
      session_id:  String(req.query.session_id  ?? ''),
      event_type:  String(req.query.event_type  ?? ''),
      workspace:   String(req.query.workspace   ?? ''),
      skill_name:  String(req.query.skill_name  ?? ''),
      agent_name:  String(req.query.agent_name  ?? ''),
      limit:  parseInt(String(req.query.limit  ?? 100), 10),
      offset: parseInt(String(req.query.offset ?? 0),   10),
    })
    res.json(events)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// ─── Aggregated Queries ───────────────────────────────────────────────────────

// GET /api/metrics/summary
router.get('/metrics/summary', (_req, res) => {
  try {
    res.json(getSummary())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/skills
router.get('/metrics/skills', (_req, res) => {
  try {
    res.json(getSkillStats())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/agents
router.get('/metrics/agents', (_req, res) => {
  try {
    res.json(getAgentStats())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/models
router.get('/metrics/models', (_req, res) => {
  try {
    res.json(getModelStats())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/tokens/daily?days=30
router.get('/metrics/tokens/daily', (req, res) => {
  try {
    const days = parseInt(String(req.query.days ?? 30), 10)
    res.json(getDailyTokenStats(days))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/export  → full JSON export
router.get('/metrics/export', (_req, res) => {
  try {
    res.json(exportAll())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/metrics/stream — Server-Sent Events for live dashboard updates
router.get('/metrics/stream', (req, res) => {
  const clientId = randomUUID()
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  res.write(`event: connected\ndata: ${JSON.stringify({ id: clientId, clients: clientCount() + 1 })}\n\n`)

  addClient(clientId, res)
  req.on('close', () => removeClient(clientId))
})

export default router
