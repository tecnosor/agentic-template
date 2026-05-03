import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  MetricsSummary,
  MetricEvent,
  SkillStat,
  AgentStat,
  ModelStat,
  DailyTokenStat,
  Session,
} from '../types/metrics'

const BASE = '/api/metrics'

export const useMetricsStore = defineStore('metrics', () => {
  const summary = ref<MetricsSummary | null>(null)
  const events = ref<MetricEvent[]>([])
  const skills = ref<SkillStat[]>([])
  const agents = ref<AgentStat[]>([])
  const models = ref<ModelStat[]>([])
  const dailyTokens = ref<DailyTokenStat[]>([])
  const sessions = ref<Session[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Live update state
  const isLive = ref(false)
  const lastUpdated = ref<string | null>(null)
  const hasNewData = ref(false)

  let _pollTimer: ReturnType<typeof setInterval> | null = null
  let _sseRetryTimer: ReturnType<typeof setTimeout> | null = null
  let _es: EventSource | null = null

  async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`)
    return res.json() as Promise<T>
  }

  async function loadSummary() {
    summary.value = await fetchJson<MetricsSummary>('/summary')
  }

  async function loadEvents(limit = 20) {
    events.value = await fetchJson<MetricEvent[]>(`/events?limit=${limit}`)
  }

  async function loadSkills() {
    skills.value = await fetchJson<SkillStat[]>('/skills')
  }

  async function loadAgents() {
    agents.value = await fetchJson<AgentStat[]>('/agents')
  }

  async function loadModels() {
    models.value = await fetchJson<ModelStat[]>('/models')
  }

  async function loadDailyTokens(days = 30) {
    dailyTokens.value = await fetchJson<DailyTokenStat[]>(`/tokens/daily?days=${days}`)
  }

  async function loadSessions(limit = 20) {
    sessions.value = await fetchJson<Session[]>(`/sessions?limit=${limit}`)
  }

  async function loadAll() {
    loading.value = true
    error.value = null
    try {
      await Promise.all([
        loadSummary(),
        loadEvents(),
        loadSkills(),
        loadAgents(),
        loadModels(),
        loadDailyTokens(),
        loadSessions(),
      ])
      lastUpdated.value = new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load metrics'
    } finally {
      loading.value = false
    }
  }

  function _flashNew(): void {
    hasNewData.value = true
    setTimeout(() => { hasNewData.value = false }, 2500)
  }

  function startPolling(intervalMs = 5000): void {
    if (_pollTimer) clearInterval(_pollTimer)
    _pollTimer = setInterval(async () => {
      await loadAll()
    }, intervalMs)
  }

  function stopPolling(): void {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null }
  }

  function connectSSE(): void {
    if (_es) return
    try {
      _es = new EventSource(`${BASE}/stream`)

      _es.addEventListener('connected', () => {
        isLive.value = true
        stopPolling()
      })

      _es.addEventListener('metric', async () => {
        _flashNew()
        // Quick partial refresh first, then full reload
        await Promise.all([loadSummary(), loadEvents()])
        await loadAll()
      })

      // Keep-alive ping — no action needed
      _es.addEventListener('ping', () => {/* noop */})

      _es.onerror = () => {
        isLive.value = false
        _es?.close()
        _es = null
        startPolling()
        if (_sseRetryTimer) clearTimeout(_sseRetryTimer)
        _sseRetryTimer = setTimeout(() => {
          _sseRetryTimer = null
          connectSSE()
        }, 15_000)
      }
    } catch {
      startPolling()
    }
  }

  function disconnectSSE(): void {
    _es?.close()
    _es = null
    isLive.value = false
    stopPolling()
    if (_sseRetryTimer) { clearTimeout(_sseRetryTimer); _sseRetryTimer = null }
  }

  return {
    summary, events, skills, agents, models, dailyTokens, sessions,
    loading, error, isLive, lastUpdated, hasNewData,
    loadAll, loadSummary, loadEvents, loadSkills, loadAgents,
    loadModels, loadDailyTokens, loadSessions,
    connectSSE, disconnectSSE, startPolling, stopPolling,
  }
})
