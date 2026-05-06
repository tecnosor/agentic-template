<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useKanbanStore } from './stores/kanbanStore'
import KanbanBoard from './components/KanbanBoard.vue'
import FilterBar from './components/FilterBar.vue'
import MetricsDashboard from './components/MetricsDashboard.vue'
import TaskCreateModal from './components/TaskCreateModal.vue'

const store = useKanbanStore()
const activeTab = ref<'kanban' | 'metrics' | 'traces'>('kanban')
const creatingTask = ref(false)

// Langfuse config fetched from the Mission Control server
const langfuseUrl = ref<string | null>(null)
const langfuseEnabled = ref(false)

async function loadLangfuseConfig() {
  try {
    const res = await fetch('/api/langfuse/config')
    if (res.ok) {
      const data = await res.json() as { enabled: boolean; uiUrl: string | null }
      langfuseEnabled.value = data.enabled
      langfuseUrl.value = data.uiUrl
    }
  } catch {
    // server may not be running yet — ignore
  }
}

onMounted(() => {
  void store.loadRepos()
  void store.loadTasks()
  store.connectLive()
  void loadLangfuseConfig()
})

onUnmounted(() => {
  store.disconnectLive()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm px-6 py-3">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight">🎯 Mission Control</h1>
          <p class="text-xs text-slate-500">Enterprise App Template · Workspace Kanban &amp; Observability</p>
        </div>
        <!-- Tab bar -->
        <div class="flex gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
          <button
            class="px-3 py-1.5 text-xs rounded transition font-medium"
            :class="activeTab === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'"
            @click="activeTab = 'kanban'"
          >📋 Kanban</button>
          <button
            class="px-3 py-1.5 text-xs rounded transition font-medium"
            :class="activeTab === 'metrics' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'"
            @click="activeTab = 'metrics'"
          >📊 Metrics</button>
          <button
            class="px-3 py-1.5 text-xs rounded transition font-medium"
            :class="activeTab === 'traces' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'"
            @click="activeTab = 'traces'"
          >🔍 Traces</button>
        </div>
        <FilterBar v-if="activeTab === 'kanban'" @create-task="creatingTask = true" />
      </div>
    </header>

    <!-- Kanban tab -->
    <template v-if="activeTab === 'kanban'">
      <div v-if="store.error" class="bg-red-950 border-b border-red-800 px-6 py-2 text-sm text-red-300">
        ⚠️ {{ store.error }}
      </div>
      <div v-if="store.loading" class="flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading kanban files…
      </div>
      <main v-else class="overflow-x-auto">
        <KanbanBoard />
      </main>
    </template>

    <!-- Metrics tab (in-session summary) -->
    <template v-else-if="activeTab === 'metrics'">
      <MetricsDashboard :langfuse-url="langfuseUrl" :langfuse-enabled="langfuseEnabled" />
    </template>

    <!-- Traces tab — Langfuse full UI or setup instructions -->
    <template v-else>
      <div class="p-6 space-y-4">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-white">🔍 Langfuse Traces</h2>
          <span
            v-if="langfuseEnabled"
            class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/60 text-emerald-400 border border-emerald-800/50"
          >CONNECTED</span>
          <span
            v-else
            class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-900/60 text-amber-400 border border-amber-800/50"
          >NOT CONFIGURED</span>
        </div>

        <!-- Connected: show iframe + open button -->
        <template v-if="langfuseEnabled && langfuseUrl">
          <div class="flex items-center gap-3 mb-4">
            <a
              :href="langfuseUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
            >
              Open Langfuse ↗
            </a>
            <span class="text-xs text-slate-500">{{ langfuseUrl }}</span>
          </div>
          <iframe
            :src="langfuseUrl"
            class="w-full rounded-lg border border-slate-800 bg-slate-900"
            style="height: calc(100vh - 200px);"
            title="Langfuse Observability UI"
          />
        </template>

        <!-- Not configured: show setup instructions -->
        <template v-else>
          <div class="max-w-2xl bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4 text-sm">
            <p class="text-slate-300">
              Langfuse is not configured yet. All agent traces, sessions, token usage,
              skill invocations, and more are tracked here once connected.
            </p>

            <div class="space-y-2">
              <p class="font-semibold text-white">Option A — Langfuse Cloud (free, no infra)</p>
              <ol class="list-decimal list-inside space-y-1 text-slate-400">
                <li>Sign up at <a href="https://cloud.langfuse.com" target="_blank" class="text-indigo-400 hover:underline">cloud.langfuse.com</a></li>
                <li>Create a project and copy the public/secret keys</li>
                <li>Set <code class="bg-slate-800 px-1 rounded">LANGFUSE_PUBLIC_KEY</code>, <code class="bg-slate-800 px-1 rounded">LANGFUSE_SECRET_KEY</code>, and <code class="bg-slate-800 px-1 rounded">LANGFUSE_HOST=https://cloud.langfuse.com</code></li>
                <li>Restart the Mission Control server</li>
              </ol>
            </div>

            <div class="space-y-2">
              <p class="font-semibold text-white">Option B — Self-hosted (docker compose)</p>
              <ol class="list-decimal list-inside space-y-1 text-slate-400">
                <li>
                  <code class="bg-slate-800 px-1 rounded">cd mission-control && cp .env.example .env</code>
                  — edit secrets
                </li>
                <li><code class="bg-slate-800 px-1 rounded">docker compose up -d</code></li>
                <li>Langfuse UI at <a href="http://localhost:3000" target="_blank" class="text-indigo-400 hover:underline">http://localhost:3000</a></li>
              </ol>
            </div>

            <p class="text-slate-500 text-xs">
              Default credentials (self-hosted): <code class="bg-slate-800 px-1 rounded">admin@mission-control.local</code> / <code class="bg-slate-800 px-1 rounded">Admin1234!</code>
            </p>
          </div>
        </template>
      </div>
    </template>

    <TaskCreateModal
      v-if="creatingTask"
      @close="creatingTask = false"
      @created="creatingTask = false"
    />
  </div>
</template>
