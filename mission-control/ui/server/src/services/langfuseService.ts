/**
 * Langfuse observability bridge.
 *
 * Translates Mission Control's flat metrics events into Langfuse traces/spans.
 * Every agent "session" becomes a Langfuse Trace.
 * Every event (skill_invoked, agent_invoked, tool_call, etc.) becomes a Span
 * or Generation inside that trace.
 *
 * If Langfuse is not configured (no keys), all calls are no-ops — metrics
 * collection is always non-blocking.
 */
import Langfuse from 'langfuse'
import { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST, LANGFUSE_ENABLED } from '../config.js'
import type { MetricEvent, Session } from '../types/metrics.js'

// ─── Client ──────────────────────────────────────────────────────────────────

let _client: Langfuse | null = null

export function getLangfuseClient(): Langfuse | null {
  if (!LANGFUSE_ENABLED) return null
  if (_client) return _client
  _client = new Langfuse({
    publicKey:  LANGFUSE_PUBLIC_KEY,
    secretKey:  LANGFUSE_SECRET_KEY,
    baseUrl:    LANGFUSE_HOST,
    // Flush events immediately so we don't lose data on shutdown
    flushAt:    1,
    flushInterval: 500,
  })
  _client.on('error', (err) => {
    // Non-blocking — log but never throw
    console.warn('[langfuse] SDK error:', err instanceof Error ? err.message : err)
  })
  console.info(`[langfuse] Client initialised → ${LANGFUSE_HOST}`)
  return _client
}

// ─── Trace (Session) ─────────────────────────────────────────────────────────

/**
 * Create or upsert a Langfuse Trace that represents an agent session.
 * Langfuse de-dupes on `id`, so calling this twice with the same id is safe.
 */
export function upsertTrace(session: Pick<Session, 'id' | 'started_at' | 'workspace' | 'model'>): void {
  const lf = getLangfuseClient()
  if (!lf) return
  try {
    lf.trace({
      id:        session.id,
      name:      'agent-session',
      timestamp: session.started_at ? new Date(session.started_at) : new Date(),
      userId:    session.workspace ?? 'unknown',
      metadata:  {
        workspace: session.workspace,
        model:     session.model,
        source:    'mission-control',
      },
      tags: ['mission-control', session.workspace ?? 'workspace'].filter(Boolean),
    })
  } catch (err) {
    console.warn('[langfuse] upsertTrace error:', err instanceof Error ? err.message : err)
  }
}

/**
 * Mark a trace as complete (session ended).
 */
export function endTrace(sessionId: string, endedAt: string): void {
  const lf = getLangfuseClient()
  if (!lf) return
  try {
    // Langfuse traces don't have an explicit "end" call in the SDK,
    // but we can update metadata to record the end time.
    lf.trace({
      id:       sessionId,
      metadata: { ended_at: endedAt, status: 'complete' },
    })
  } catch (err) {
    console.warn('[langfuse] endTrace error:', err instanceof Error ? err.message : err)
  }
}

// ─── Span / Generation (Event) ───────────────────────────────────────────────

const LLM_EVENT_TYPES = new Set(['skill_invoked', 'agent_invoked', 'agent_response', 'user_message'])

/**
 * Record a metric event as a Langfuse Span (or Generation for LLM events).
 */
export function recordEvent(event: MetricEvent): void {
  const lf = getLangfuseClient()
  if (!lf) return
  try {
    const traceId   = event.session_id && event.session_id !== 'untracked' ? event.session_id : undefined
    const startTime = new Date(event.timestamp)
    const endTime   = event.duration_ms
      ? new Date(startTime.getTime() + event.duration_ms)
      : undefined

    const name = event.skill_name
      ?? event.agent_name
      ?? event.task_id
      ?? event.event_type

    const level = event.status === 'error' ? 'ERROR' : 'DEFAULT'

    const meta: Record<string, unknown> = {
      event_type:          event.event_type,
      workspace:           event.workspace,
      status:              event.status,
      context_files_count: event.context_files_count,
    }
    if (event.metadata) {
      try { Object.assign(meta, JSON.parse(event.metadata)) } catch { /* not JSON */ }
    }

    // LLM events → Generation (shows token usage in Langfuse)
    if (LLM_EVENT_TYPES.has(event.event_type) && (event.tokens_input || event.tokens_output)) {
      const trace = traceId ? lf.trace({ id: traceId }) : lf.trace({ name: 'untracked-session' })
      trace.generation({
        name,
        startTime,
        endTime,
        model:  event.model ?? 'unknown',
        level,
        usage: {
          input:       event.tokens_input  ?? 0,
          output:      event.tokens_output ?? 0,
          totalCost:   0, // We don't have cost info from the agent side
        },
        metadata: meta,
        statusMessage: event.status === 'error' ? 'error' : undefined,
      })
    } else {
      // Non-LLM events → Span
      const trace = traceId ? lf.trace({ id: traceId }) : lf.trace({ name: 'untracked-session' })
      trace.span({
        name,
        startTime,
        endTime,
        level,
        metadata: meta,
        statusMessage: event.status === 'error' ? 'error' : undefined,
      })
    }
  } catch (err) {
    console.warn('[langfuse] recordEvent error:', err instanceof Error ? err.message : err)
  }
}

// ─── Flush on shutdown ───────────────────────────────────────────────────────

export async function flushLangfuse(): Promise<void> {
  const lf = getLangfuseClient()
  if (!lf) return
  try {
    await lf.flushAsync()
  } catch {
    // best-effort
  }
}
