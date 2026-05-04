<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useMetricsStore } from '../stores/metricsStore'

const store = useMetricsStore()

onMounted(() => {
  store.loadAll()
  store.connectSSE()
})

onUnmounted(() => {
  store.disconnectSSE()
})

function fmt(n: number | undefined | null): string {
  if (n == null) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function fmtDate(iso: string): string {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '-'
}

const maxDailyTokens = computed(() => {
  const vals = store.dailyTokens.map(d => d.tokens_input + d.tokens_output)
  return vals.length ? Math.max(...vals) : 1
})

const lastUpdatedAgo = computed(() => {
  if (!store.lastUpdated) return null
  const diff = Date.now() - new Date(store.lastUpdated).getTime()
  if (diff < 5000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  return `${Math.floor(diff / 60000)}m ago`
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header row -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-white">📊 Metrics Dashboard</h2>
        <span
          v-if="store.isLive"
          class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/60 text-emerald-400 border border-emerald-800/50"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          LIVE
        </span>
        <span
          v-else
          class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700"
        >
          OFFLINE
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="lastUpdatedAgo" class="text-xs text-slate-500">
          Updated {{ lastUpdatedAgo }}
        </span>
        <button
          class="px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          :disabled="store.loading"
          @click="store.loadAll()"
        >
          {{ store.loading ? 'Refreshing…' : '↻ Refresh' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="store.error" class="bg-red-950 border border-red-800 rounded px-4 py-2 text-sm text-red-300">
      ⚠️ {{ store.error }} — Is the server running on port 3099?
    </div>

    <!-- Empty state — no data yet -->
    <div
      v-else-if="!store.loading && !store.summary"
      class="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center space-y-4"
    >
      <p class="text-4xl">📭</p>
      <p class="text-slate-300 font-medium">No metrics recorded yet</p>
      <p class="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
        Metrics are collected as agents work. They populate automatically when skills run,
        tasks change, or sessions start. Nothing to do — just start using the workspace.
      </p>
      <div class="bg-slate-800 rounded p-3 text-xs text-slate-400 text-left font-mono max-w-sm mx-auto">
        <p class="text-slate-500 mb-1"># Record an event manually:</p>
        <p>node .opencode/hooks/metrics-reporter.js \</p>
        <p>&nbsp;&nbsp;session_start '&#123;"model":"claude-sonnet-4"&#125;'</p>
      </div>
    </div>

    <!-- Summary cards -->
    <div
      v-if="store.summary"
      class="grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-500"
      :class="{ 'opacity-75': store.hasNewData }"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4" :class="{ 'border-emerald-800/60': store.hasNewData }">
        <p class="text-xs text-slate-500 mb-1">Total Tokens</p>
        <p class="text-2xl font-bold text-emerald-400">
          {{ fmt((store.summary.total_tokens_input ?? 0) + (store.summary.total_tokens_output ?? 0)) }}
        </p>
        <p class="text-xs text-slate-600 mt-1">
          ↑ {{ fmt(store.summary.total_tokens_input) }} in · {{ fmt(store.summary.total_tokens_output) }} out
        </p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4" :class="{ 'border-emerald-800/60': store.hasNewData }">
        <p class="text-xs text-slate-500 mb-1">Sessions</p>
        <p class="text-2xl font-bold text-blue-400">{{ store.summary.total_sessions ?? 0 }}</p>
        <p class="text-xs text-slate-600 mt-1">{{ store.summary.total_events ?? 0 }} events total</p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4" :class="{ 'border-emerald-800/60': store.hasNewData }">
        <p class="text-xs text-slate-500 mb-1">Skills Used</p>
        <p class="text-2xl font-bold text-violet-400">{{ store.summary.total_skills_invoked ?? 0 }}</p>
        <p class="text-xs text-slate-600 mt-1">{{ store.summary.unique_skills ?? 0 }} unique · top: {{ store.summary.top_skill || '-' }}</p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4" :class="{ 'border-emerald-800/60': store.hasNewData }">
        <p class="text-xs text-slate-500 mb-1">Agents Used</p>
        <p class="text-2xl font-bold text-amber-400">{{ store.summary.total_agents_invoked ?? 0 }}</p>
        <p class="text-xs text-slate-600 mt-1">{{ store.summary.unique_agents ?? 0 }} unique · top: {{ store.summary.top_agent || '-' }}</p>
      </div>
    </div>

    <!-- Daily token trend -->
    <div v-if="store.dailyTokens.length" class="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <p class="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Daily Tokens (last 30 days)</p>
      <div class="flex items-end gap-1 h-20">
        <div
          v-for="day in store.dailyTokens"
          :key="day.date"
          class="flex-1 min-w-[4px] bg-emerald-600/70 rounded-t hover:bg-emerald-500 transition"
          :style="{ height: `${Math.round(((day.tokens_input + day.tokens_output) / maxDailyTokens) * 100)}%` }"
          :title="`${day.date}\n↑ ${fmt(day.tokens_input)} in\n↓ ${fmt(day.tokens_output)} out\n${day.events} events`"
        />
      </div>
      <div class="flex justify-between text-xs text-slate-600 mt-1">
        <span>{{ store.dailyTokens[0]?.date ?? '' }}</span>
        <span>{{ store.dailyTokens[store.dailyTokens.length - 1]?.date ?? '' }}</span>
      </div>
    </div>

    <!-- Skills + Agents tables side by side -->
    <div class="grid md:grid-cols-2 gap-4">
      <!-- Skills -->
      <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wide px-4 py-3 border-b border-slate-800">
          Skills
        </p>
        <div v-if="!store.skills.length" class="px-4 py-6 text-xs text-slate-600 text-center">No skill data yet</div>
        <table v-else class="w-full text-xs">
          <thead>
            <tr class="text-slate-500 border-b border-slate-800">
              <th class="text-left px-4 py-2">Skill</th>
              <th class="text-right px-4 py-2">Calls</th>
              <th class="text-right px-4 py-2">Tokens</th>
              <th class="text-right px-4 py-2">Avg ms</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in store.skills"
              :key="s.skill_name"
              class="border-b border-slate-800/50 hover:bg-slate-800/30"
            >
              <td class="px-4 py-2 text-violet-300 font-mono">{{ s.skill_name }}</td>
              <td class="px-4 py-2 text-right text-slate-300">{{ s.invocations }}</td>
              <td class="px-4 py-2 text-right text-emerald-400">{{ fmt(s.total_tokens_input + s.total_tokens_output) }}</td>
              <td class="px-4 py-2 text-right text-slate-400">{{ s.avg_duration_ms ? Math.round(s.avg_duration_ms) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Agents -->
      <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wide px-4 py-3 border-b border-slate-800">
          Agents
        </p>
        <div v-if="!store.agents.length" class="px-4 py-6 text-xs text-slate-600 text-center">No agent data yet</div>
        <table v-else class="w-full text-xs">
          <thead>
            <tr class="text-slate-500 border-b border-slate-800">
              <th class="text-left px-4 py-2">Agent</th>
              <th class="text-right px-4 py-2">Calls</th>
              <th class="text-right px-4 py-2">Tokens</th>
              <th class="text-right px-4 py-2">Avg ms</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="a in store.agents"
              :key="a.agent_name"
              class="border-b border-slate-800/50 hover:bg-slate-800/30"
            >
              <td class="px-4 py-2 text-amber-300 font-mono">{{ a.agent_name }}</td>
              <td class="px-4 py-2 text-right text-slate-300">{{ a.invocations }}</td>
              <td class="px-4 py-2 text-right text-emerald-400">{{ fmt(a.total_tokens_input + a.total_tokens_output) }}</td>
              <td class="px-4 py-2 text-right text-slate-400">{{ a.avg_duration_ms ? Math.round(a.avg_duration_ms) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Models table -->
    <div v-if="store.models.length" class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <p class="text-xs text-slate-500 font-medium uppercase tracking-wide px-4 py-3 border-b border-slate-800">Models</p>
      <table class="w-full text-xs">
        <thead>
          <tr class="text-slate-500 border-b border-slate-800">
            <th class="text-left px-4 py-2">Model</th>
            <th class="text-right px-4 py-2">Sessions</th>
            <th class="text-right px-4 py-2">Tokens In</th>
            <th class="text-right px-4 py-2">Tokens Out</th>
            <th class="text-right px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in store.models"
            :key="m.model"
            class="border-b border-slate-800/50 hover:bg-slate-800/30"
          >
            <td class="px-4 py-2 text-blue-300 font-mono">{{ m.model }}</td>
            <td class="px-4 py-2 text-right text-slate-300">{{ m.sessions }}</td>
            <td class="px-4 py-2 text-right text-slate-400">{{ fmt(m.total_tokens_input) }}</td>
            <td class="px-4 py-2 text-right text-slate-400">{{ fmt(m.total_tokens_output) }}</td>
            <td class="px-4 py-2 text-right text-emerald-400">{{ fmt(m.total_tokens_input + m.total_tokens_output) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recent sessions -->
    <div v-if="store.sessions.length" class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <p class="text-xs text-slate-500 font-medium uppercase tracking-wide px-4 py-3 border-b border-slate-800">
        Recent Sessions
      </p>
      <table class="w-full text-xs">
        <thead>
          <tr class="text-slate-500 border-b border-slate-800">
            <th class="text-left px-4 py-2">ID</th>
            <th class="text-left px-4 py-2">Started</th>
            <th class="text-left px-4 py-2">Workspace</th>
            <th class="text-left px-4 py-2">Model</th>
            <th class="text-right px-4 py-2">Tokens</th>
            <th class="text-right px-4 py-2">Events</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in store.sessions"
            :key="s.id"
            class="border-b border-slate-800/50 hover:bg-slate-800/30"
          >
            <td class="px-4 py-2 text-slate-500 font-mono">{{ s.id.slice(0, 8) }}…</td>
            <td class="px-4 py-2 text-slate-400">{{ fmtDate(s.started_at) }}</td>
            <td class="px-4 py-2 text-slate-300">{{ s.workspace || '-' }}</td>
            <td class="px-4 py-2 text-blue-300">{{ s.model || '-' }}</td>
            <td class="px-4 py-2 text-right text-emerald-400">{{ fmt(s.total_tokens_input + s.total_tokens_output) }}</td>
            <td class="px-4 py-2 text-right text-slate-400">{{ s.event_count }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recent events feed -->
    <div
      class="bg-slate-900 border rounded-lg overflow-hidden transition-colors duration-300"
      :class="store.hasNewData ? 'border-emerald-800/60' : 'border-slate-800'"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wide">
          Recent Events (last 20)
        </p>
        <span
          v-if="store.hasNewData"
          class="text-[10px] font-medium text-emerald-400 animate-pulse"
        >
          ● New event
        </span>
      </div>
      <div v-if="!store.events.length" class="px-4 py-6 text-xs text-slate-600 text-center">No events yet</div>
      <div v-else class="divide-y divide-slate-800/50">
        <div
          v-for="(ev, idx) in store.events"
          :key="ev.id"
          class="px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 hover:bg-slate-800/30 text-xs transition-colors"
          :class="{ 'bg-emerald-950/20': idx === 0 && store.hasNewData }"
        >
          <span class="text-slate-500 font-mono w-36 shrink-0">{{ fmtDate(ev.timestamp) }}</span>
          <span
            class="px-1.5 py-0.5 rounded text-[10px] font-medium"
            :class="{
              'bg-violet-900/60 text-violet-300': ev.event_type === 'skill_invoked',
              'bg-amber-900/60 text-amber-300': ev.event_type === 'agent_invoked',
              'bg-blue-900/60 text-blue-300': ev.event_type === 'user_message' || ev.event_type === 'agent_response',
              'bg-green-900/60 text-green-300': ev.event_type === 'task_update' || ev.event_type === 'task_created' || ev.event_type === 'task_deleted',
              'bg-indigo-900/60 text-indigo-300': ev.event_type === 'git_commit',
              'bg-slate-700 text-slate-300': !['skill_invoked','agent_invoked','user_message','agent_response','task_update','task_created','task_deleted','git_commit'].includes(ev.event_type),
            }"
          >{{ ev.event_type }}</span>
          <span v-if="ev.skill_name" class="text-violet-300">{{ ev.skill_name }}</span>
          <span v-if="ev.agent_name" class="text-amber-300">{{ ev.agent_name }}</span>
          <span v-if="ev.task_id" class="text-slate-400">task: {{ ev.task_id }}</span>
          <span v-if="ev.workspace && ev.workspace !== 'workspace'" class="text-slate-500">{{ ev.workspace }}</span>
          <span v-if="ev.tokens_input || ev.tokens_output" class="text-emerald-400 ml-auto">
            {{ fmt((ev.tokens_input ?? 0) + (ev.tokens_output ?? 0)) }} tok
          </span>
        </div>
      </div>
    </div>

    <!-- Empty state when no data at all -->
    <div
      v-if="!store.loading && !store.error && !store.summary"
      class="text-center py-16 text-slate-600 text-sm"
    >
      No metrics data yet. Start the server and POST some events to begin tracking.
    </div>
  </div>
</template>
