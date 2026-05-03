<script setup lang="ts">
import { ref } from 'vue'
import { useKanbanStore } from '../stores/kanbanStore'
import KanbanColumnComponent from './KanbanColumn.vue'
import TaskDetailModal from './TaskDetailModal.vue'
import { COLUMNS } from '../types/kanban'
import type { KanbanTask } from '../types/kanban'

const store = useKanbanStore()
const selectedTask = ref<KanbanTask | null>(null)
</script>

<template>
  <div class="flex gap-3 p-6 min-w-max">
    <KanbanColumnComponent
      v-for="column in COLUMNS"
      :key="column"
      :column="column"
      :tasks="store.tasksByColumn.get(column) ?? []"
      @card-click="selectedTask = $event"
    />
  </div>

  <TaskDetailModal
    v-if="selectedTask"
    :task="selectedTask"
    @close="selectedTask = null"
  />
</template>
