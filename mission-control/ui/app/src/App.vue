<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useKanbanStore } from './stores/kanbanStore'
import KanbanBoard from './components/KanbanBoard.vue'
import FilterBar from './components/FilterBar.vue'
import MetricsDashboard from './components/MetricsDashboard.vue'

const store = useKanbanStore()
const activeTab = ref<'kanban' | 'metrics'>('kanban')

onMounted(() => store.loadTasks())
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm px-6 py-3">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight">🎯 Mission Control</h1>
          <p class="text-xs text-slate-500">Enterprise App Template · Workspace Kanban</p>
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
        </div>
        <FilterBar v-if="activeTab === 'kanban'" />
      </div>
    </header>

    <!-- Kanban tab -->
    <template v-if="activeTab === 'kanban'">
      <!-- Error banner -->
      <div v-if="store.error" class="bg-red-950 border-b border-red-800 px-6 py-2 text-sm text-red-300">
        ⚠️ {{ store.error }}
      </div>
      <!-- Loading overlay -->
      <div v-if="store.loading" class="flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading kanban files…
      </div>
      <!-- Board -->
      <main v-else class="overflow-x-auto">
        <KanbanBoard />
      </main>
    </template>

    <!-- Metrics tab -->
    <template v-else>
      <MetricsDashboard />
    </template>
  </div>
</template>
