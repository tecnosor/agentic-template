<script setup lang="ts">
import { computed } from 'vue'
import type { KanbanColumn, KanbanTask } from '../types/kanban'
import { COLUMN_LABELS, COLUMN_CONFIG } from '../types/kanban'
import KanbanCard from './KanbanCard.vue'

const props = defineProps<{
  column: KanbanColumn
  tasks: KanbanTask[]
}>()

const emit = defineEmits<{
  (e: 'card-click', task: KanbanTask): void
}>()

const config = computed(() => COLUMN_CONFIG[props.column])
const label = computed(() => COLUMN_LABELS[props.column])
const isDoing = computed(() => props.column === 'DOING')
const isOverLimit = computed(() => isDoing.value && props.tasks.length > 2)
</script>

<template>
  <div class="w-64 flex-shrink-0 flex flex-col">
    <!-- Column container with top border -->
    <div
      class="flex-1 rounded-lg border-t-4 border border-slate-800 bg-slate-900 flex flex-col"
      :class="[config.topColor, isOverLimit ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950' : '']"
    >
      <!-- Header -->
      <div class="px-3 py-2.5 border-b border-slate-800">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-sm text-slate-100 truncate">{{ label }}</span>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-mono font-medium shrink-0"
            :class="isOverLimit ? 'bg-red-900 text-red-300' : config.badge"
          >
            {{ tasks.length }}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5 leading-tight">{{ config.description }}</p>
        <div v-if="isOverLimit" class="mt-1.5 text-xs text-red-400 font-medium">
          ⛔ WIP limit exceeded ({{ tasks.length }}/2)
        </div>
      </div>

      <!-- Task list -->
      <div class="p-2 flex flex-col gap-2 flex-1 min-h-20">
        <KanbanCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :read-only="column === 'DONE'"
          @click="emit('card-click', task)"
        />
        <div
          v-if="tasks.length === 0"
          class="flex items-center justify-center h-14 text-slate-600 text-xs italic"
        >
          — empty —
        </div>
      </div>
    </div>
  </div>
</template>
