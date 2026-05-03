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
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load metrics'
    } finally {
      loading.value = false
    }
  }

  return {
    summary, events, skills, agents, models, dailyTokens, sessions,
    loading, error,
    loadAll, loadSummary, loadEvents, loadSkills, loadAgents,
    loadModels, loadDailyTokens, loadSessions,
  }
})
