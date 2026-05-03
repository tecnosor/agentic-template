<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useMetricsStore } from '../stores/metricsStore'

const store = useMetricsStore()

onMounted(() => store.loadAll())

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
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header row -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">📊 Metrics Dashboard</h2>
      <button
        class="px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        :disabled="store.loading"
        @click="store.loadAll()"
      >
        {{ store.loading ? 'Refreshing…' : '↻ Refresh' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="store.error" class="bg-red-950 border border-red-800 rounded px-4 py-2 text-sm text-red-300">
      ⚠️ {{ store.error }} — Is the server running on port 3099?
    </div>

    <!-- Summary cards -->
    <div v-if="store.summary" class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p class="text-xs text-slate-500 mb-1">Total Tokens</p>
        <p class="text-2xl font-bold text-emerald-400">
          {{ fmt((store.summary.total_tokens_input ?? 0) + (store.summary.total_tokens_output ?? 0)) }}
        </p>
        <p class="text-xs text-slate-600 mt-1">
          ↑ {{ fmt(store.summary.total_tokens_input) }} in · {{ fmt(store.summary.total_tokens_output) }} out
        </p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p class="text-xs text-slate-500 mb-1">Sessions</p>
        <p class="text-2xl font-bold text-blue-400">{{ store.summary.total_sessions ?? 0 }}</p>
        <p class="text-xs text-slate-600 mt-1">{{ store.summary.total_events ?? 0 }} events total</p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p class="text-xs text-slate-500 mb-1">Skills Used</p>
        <p class="text-2xl font-bold text-violet-400">{{ store.summary.total_skills_invoked ?? 0 }}</p>
        <p class="text-xs text-slate-600 mt-1">{{ store.summary.unique_skills ?? 0 }} unique · top: {{ store.summary.top_skill || '-' }}</p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
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
    <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <p class="text-xs text-slate-500 font-medium uppercase tracking-wide px-4 py-3 border-b border-slate-800">
        Recent Events (last 20)
      </p>
      <div v-if="!store.events.length" class="px-4 py-6 text-xs text-slate-600 text-center">No events yet</div>
      <div v-else class="divide-y divide-slate-800/50">
        <div
          v-for="ev in store.events"
          :key="ev.id"
          class="px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 hover:bg-slate-800/30 text-xs"
        >
          <span class="text-slate-500 font-mono w-36 shrink-0">{{ fmtDate(ev.timestamp) }}</span>
          <span
            class="px-1.5 py-0.5 rounded text-[10px] font-medium"
            :class="{
              'bg-violet-900/60 text-violet-300': ev.event_type === 'skill_invoked',
              'bg-amber-900/60 text-amber-300': ev.event_type === 'agent_invoked',
              'bg-blue-900/60 text-blue-300': ev.event_type === 'user_message' || ev.event_type === 'agent_response',
              'bg-slate-700 text-slate-300': !['skill_invoked','agent_invoked','user_message','agent_response'].includes(ev.event_type),
            }"
          >{{ ev.event_type }}</span>
          <span v-if="ev.skill_name" class="text-violet-300">{{ ev.skill_name }}</span>
          <span v-if="ev.agent_name" class="text-amber-300">{{ ev.agent_name }}</span>
          <span v-if="ev.task_id" class="text-slate-400">task: {{ ev.task_id }}</span>
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
