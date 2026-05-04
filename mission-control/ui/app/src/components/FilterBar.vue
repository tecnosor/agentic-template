<script setup lang="ts">
import { useKanbanStore } from '../stores/kanbanStore'

const store = useKanbanStore()
defineEmits<{
  (e: 'create-task'): void
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Task count -->
    <div class="text-sm text-slate-400">
      <span class="font-semibold text-white">{{ store.filteredTasks.length }}</span>
      tasks
      <span v-if="store.allTasks.length !== store.filteredTasks.length" class="text-slate-500">
        / {{ store.allTasks.length }}
      </span>
    </div>

    <!-- DOING guard indicator -->
    <div v-if="store.globalDoingCount > 0" class="text-sm">
      <span
        class="font-semibold"
        :class="store.globalDoingCount > 2 ? 'text-red-400' : 'text-amber-400'"
      >
        {{ store.globalDoingCount }}/2
      </span>
      <span class="text-slate-500"> doing</span>
      <span v-if="store.globalDoingCount > 2" class="ml-1 text-red-400">⚠️</span>
    </div>

    <div class="text-sm flex items-center gap-2">
      <span
        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
        :class="store.isLive ? 'border-emerald-800/50 bg-emerald-900/60 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-500'"
      >
        <span
          v-if="store.isLive"
          class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
        />
        {{ store.isLive ? 'LIVE' : 'OFFLINE' }}
      </span>
      <span v-if="store.lastUpdated" class="text-xs text-slate-500">
        Updated {{ new Date(store.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </span>
    </div>

    <!-- Repo filter -->
    <select
      v-model="store.filterRepo"
      class="text-sm bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
    >
      <option v-for="repo in store.repos" :key="repo" :value="repo">
        {{ repo === 'all' ? 'All repos' : repo }}
      </option>
    </select>

    <!-- Origin filter -->
    <select
      v-model="store.filterOrigin"
      class="text-sm bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
    >
      <option value="all">All origins</option>
      <option value="👤 Human">👤 Human</option>
      <option value="🤖 Agent">🤖 Agent</option>
    </select>

    <!-- Refresh -->
    <button
      @click="store.loadTasks()"
      class="text-sm bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500"
      title="Reload kanban files"
    >
      ↺ Refresh
    </button>

    <button
      @click="$emit('create-task')"
      class="text-sm bg-blue-600 border border-blue-500 rounded-md px-3 py-1.5 text-white hover:bg-blue-500 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400"
      title="Create a new task"
    >
      + New Task
    </button>
  </div>
</template>
