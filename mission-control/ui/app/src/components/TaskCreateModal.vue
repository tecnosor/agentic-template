<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useKanbanStore } from '../stores/kanbanStore'
import type { KanbanColumn, KanbanTaskDraft, Origin, Priority } from '../types/kanban'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const store = useKanbanStore()
const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive<KanbanTaskDraft>({
  id: '',
  title: '',
  origin: '👤 Human',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  repo: store.repos.find((repo) => repo !== 'all') ?? 'mission-control',
  description: '',
  acceptanceCriteria: '',
})

const statusOptions: KanbanColumn[] = ['BACKLOG', 'TODO', 'READY', 'DOING', 'TESTING', 'HUMAN_VALIDATION', 'DONE']
const priorityOptions: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const originOptions: Origin[] = ['👤 Human', '🤖 Agent']
const repoOptions = computed(() => store.repos.filter((repo) => repo !== 'all'))

async function submit() {
  saving.value = true
  error.value = null
  try {
    await store.createTask({
      ...form,
      id: form.id.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      acceptanceCriteria: form.acceptanceCriteria?.trim() || undefined,
    })
    emit('created')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div>
          <h2 class="text-base font-semibold text-slate-100">Create Task</h2>
          <p class="text-xs text-slate-500">Creates a kanban markdown task file and commits it.</p>
        </div>
        <button class="text-xl leading-none text-slate-500 hover:text-slate-200" @click="emit('close')">✕</button>
      </div>

      <form class="flex flex-col gap-4 px-6 py-5" @submit.prevent="submit">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs text-slate-400">
            Task ID
            <input
              v-model="form.id"
              type="text"
              placeholder="FEAT-002"
              class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            >
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-400">
            Repository
            <select v-model="form.repo" class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              <option v-for="repo in repoOptions" :key="repo" :value="repo">{{ repo }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-400 md:col-span-2">
            Title
            <input
              v-model="form.title"
              type="text"
              placeholder="Add team setup guide"
              class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            >
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-400">
            Origin
            <select v-model="form.origin" class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              <option v-for="origin in originOptions" :key="origin" :value="origin">{{ origin }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-400">
            Priority
            <select v-model="form.priority" class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              <option v-for="priority in priorityOptions" :key="priority" :value="priority">{{ priority }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-400 md:col-span-2">
            Status
            <select v-model="form.status" class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-400 md:col-span-2">
            Description
            <textarea
              v-model="form.description"
              rows="5"
              placeholder="Describe the task in English"
              class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-400 md:col-span-2">
            Acceptance Criteria
            <textarea
              v-model="form.acceptanceCriteria"
              rows="4"
              placeholder="- [ ] First criterion"
              class="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </label>
        </div>

        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            :disabled="saving || !form.id.trim() || !form.title.trim() || !form.description.trim()"
          >
            {{ saving ? 'Creating…' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
