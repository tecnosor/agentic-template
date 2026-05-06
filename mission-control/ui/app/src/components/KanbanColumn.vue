<script setup lang="ts">
import { ref, computed } from 'vue'
import type { KanbanColumn, KanbanTask } from '../types/kanban'
import { COLUMN_LABELS, COLUMN_CONFIG } from '../types/kanban'
import KanbanCard from './KanbanCard.vue'
import { useKanbanStore } from '../stores/kanbanStore'

const props = defineProps<{
  column: KanbanColumn
  tasks: KanbanTask[]
}>()

const emit = defineEmits<{
  (e: 'card-click', task: KanbanTask): void
}>()

const store = useKanbanStore()
const config = computed(() => COLUMN_CONFIG[props.column])
const label = computed(() => COLUMN_LABELS[props.column])
const isDragOver = ref(false)
let dragDepth = 0

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onDragEnter() {
  dragDepth++
  isDragOver.value = true
}

function onDragLeave() {
  dragDepth--
  if (dragDepth <= 0) {
    dragDepth = 0
    isDragOver.value = false
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  dragDepth = 0

  const raw =
    event.dataTransfer?.getData('application/json') ||
    event.dataTransfer?.getData('text/plain')
  if (!raw) return

  try {
    const { id, repo } = JSON.parse(raw) as { id: string; repo: string }
    void store.moveTask(id, repo, props.column)
  } catch {
    // ignore malformed drag payload
  }
}
</script>

<template>
  <div class="w-64 flex-shrink-0 flex flex-col">
    <!-- Column container with top border -->
    <div
      class="flex-1 rounded-lg border-t-4 border border-slate-800 bg-slate-900 flex flex-col transition-colors"
      :class="[
        config.topColor,
        isDragOver ? 'bg-slate-800 ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-950' : '',
      ]"
      @dragover="onDragOver"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- Header -->
      <div class="px-3 py-2.5 border-b border-slate-800">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-sm text-slate-100 truncate">{{ label }}</span>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-mono font-medium shrink-0"
            :class="config.badge"
          >
            {{ tasks.length }}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5 leading-tight">{{ config.description }}</p>
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
          class="flex items-center justify-center h-14 text-xs italic transition-colors"
          :class="isDragOver ? 'text-blue-400' : 'text-slate-600'"
        >
          {{ isDragOver ? 'Drop here' : '— empty —' }}
        </div>
      </div>
    </div>
  </div>
</template>
