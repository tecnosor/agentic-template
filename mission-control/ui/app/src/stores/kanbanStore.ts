import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { KanbanTask, KanbanColumn, KanbanComment, Origin } from '../types/kanban'

export const useKanbanStore = defineStore('kanban', () => {
  const allTasks = ref<KanbanTask[]>([])
  const filterRepo = ref<string>('all')
  const filterOrigin = ref<Origin | 'all'>('all')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadTasks() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      allTasks.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function moveTask(id: string, repo: string, targetColumn: KanbanColumn): Promise<void> {
    // Optimistic update
    const task = allTasks.value.find((t) => t.id === id && t.repo === repo)
    const prevStatus = task?.status
    if (task) task.status = targetColumn

    try {
      const res = await fetch('/api/tasks/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, repo, targetColumn }),
      })
      if (!res.ok) throw new Error(`Move failed: ${res.status}`)
    } catch (e) {
      // Roll back optimistic update on error
      if (task && prevStatus) task.status = prevStatus
      throw e
    }
  }

  async function addComment(
    id: string,
    repo: string,
    author: Origin,
    text: string,
    authorName?: string,
  ): Promise<void> {
    const res = await fetch('/api/tasks/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, repo, author, text, authorName }),
    })
    if (!res.ok) throw new Error(`Comment failed: ${res.status}`)

    const data: { comment: KanbanComment } = await res.json()
    const task = allTasks.value.find((t) => t.id === id && t.repo === repo)
    if (task) {
      task.comments = [...(task.comments ?? []), data.comment]
    }
  }

  const filteredTasks = computed(() =>
    allTasks.value.filter((task) => {
      if (filterRepo.value !== 'all' && task.repo !== filterRepo.value) return false
      if (filterOrigin.value !== 'all' && task.origin !== filterOrigin.value) return false
      return true
    }),
  )

  const tasksByColumn = computed(() => {
    const map = new Map<KanbanColumn, KanbanTask[]>()
    for (const task of filteredTasks.value) {
      const col = task.status
      const existing = map.get(col)
      if (existing) {
        existing.push(task)
      } else {
        map.set(col, [task])
      }
    }
    return map
  })

  const repos = computed(() => {
    const repoSet = new Set<string>()
    for (const t of allTasks.value) {
      if (t.repo && t.repo !== 'all') repoSet.add(t.repo)
    }
    return ['all', ...Array.from(repoSet).sort()]
  })

  const doingCount = computed(() => tasksByColumn.value.get('DOING')?.length ?? 0)

  return {
    allTasks,
    filterRepo,
    filterOrigin,
    loading,
    error,
    filteredTasks,
    tasksByColumn,
    repos,
    doingCount,
    loadTasks,
    moveTask,
    addComment,
  }
})
