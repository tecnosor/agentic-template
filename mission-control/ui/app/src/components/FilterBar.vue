<script setup lang="ts">
import { useKanbanStore } from '../stores/kanbanStore'

const store = useKanbanStore()
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
    <div v-if="store.doingCount > 0" class="text-sm">
      <span
        class="font-semibold"
        :class="store.doingCount > 2 ? 'text-red-400' : 'text-amber-400'"
      >
        {{ store.doingCount }}/2
      </span>
      <span class="text-slate-500"> doing</span>
      <span v-if="store.doingCount > 2" class="ml-1 text-red-400">⚠️</span>
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
  </div>
</template>
