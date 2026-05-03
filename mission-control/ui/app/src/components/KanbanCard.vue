<script setup lang="ts">
import { computed } from 'vue'
import type { KanbanTask } from '../types/kanban'
import { PRIORITY_CONFIG } from '../types/kanban'

const props = defineProps<{
  task: KanbanTask
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', task: KanbanTask): void
}>()

const priorityCfg = computed(() => PRIORITY_CONFIG[props.task.priority])
</script>

<template>
  <div
    class="rounded border border-slate-700 bg-slate-800 p-2.5 flex flex-col gap-1.5 hover:border-slate-500 transition-colors cursor-pointer"
    :class="{ 'opacity-70': readOnly }"
    @click="emit('click', task)"
  >
    <!-- ID + Priority row -->
    <div class="flex items-center justify-between gap-2">
      <span class="font-mono text-xs text-slate-400 shrink-0">{{ task.id }}</span>
      <span
        class="text-xs px-1.5 py-0.5 rounded border font-semibold shrink-0 tracking-wide"
        :class="priorityCfg.classes"
      >
        {{ priorityCfg.label }}
      </span>
    </div>

    <!-- Description -->
    <p class="text-slate-200 text-xs leading-relaxed overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
      {{ task.description }}
    </p>

    <!-- Footer: repo + origin -->
    <div class="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-700">
      <span class="text-xs text-slate-500 truncate" :title="task.repo">{{ task.repo }}</span>
      <span class="text-xs text-slate-500 shrink-0">{{ task.origin }}</span>
    </div>

    <!-- Completed date (DONE column) -->
    <div v-if="task.completed" class="text-xs text-slate-500">
      ✓ {{ task.completed }}
    </div>
  </div>
</template>
