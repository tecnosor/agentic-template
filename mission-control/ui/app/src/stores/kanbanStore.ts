import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { KanbanTask, KanbanColumn, KanbanComment, KanbanTaskDraft, Origin } from '../types/kanban'

export const useKanbanStore = defineStore('kanban', () => {
  const allTasks = ref<KanbanTask[]>([])
  const availableRepos = ref<string[]>([])
  const filterRepo = ref<string>('all')
  const filterOrigin = ref<Origin | 'all'>('all')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isLive = ref(false)
  const lastUpdated = ref<string | null>(null)

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let eventSource: EventSource | null = null

  async function loadTasks() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      allTasks.value = await res.json()
      lastUpdated.value = new Date().toISOString()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function loadRepos() {
    try {
      const res = await fetch('/api/repos')
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      availableRepos.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
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

  async function createTask(task: KanbanTaskDraft): Promise<void> {
    const res = await fetch('/api/tasks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `Create failed: ${res.status}`)

    if (data.task) {
      allTasks.value = [
        data.task as KanbanTask,
        ...allTasks.value.filter((existing) => !(existing.id === data.task.id && existing.repo === data.task.repo)),
      ]
      lastUpdated.value = new Date().toISOString()
    } else {
      await loadTasks()
    }
    await loadRepos()
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

  function startPolling(intervalMs = 10000) {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(() => {
      void loadTasks()
    }, intervalMs)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function connectLive() {
    if (eventSource) return

    try {
      eventSource = new EventSource('/api/metrics/stream')
      eventSource.addEventListener('connected', () => {
        isLive.value = true
        stopPolling()
      })
      eventSource.addEventListener('metric', (event) => {
        const payload = JSON.parse((event as MessageEvent<string>).data) as { event_type?: string }
        if (payload.event_type === 'task_created' || payload.event_type === 'task_update' || payload.event_type === 'task_deleted') {
          void loadTasks()
        }
      })
      // Auto-refresh when orchestrator moves tasks or creates subtasks
      for (const agentEvent of ['agent:task_moved', 'agent:subtask_created', 'agent:orchestration_started']) {
        eventSource.addEventListener(agentEvent, () => {
          void loadTasks()
        })
      }
      eventSource.onerror = () => {
        isLive.value = false
        eventSource?.close()
        eventSource = null
        startPolling()
        if (retryTimer) clearTimeout(retryTimer)
        retryTimer = setTimeout(() => {
          retryTimer = null
          connectLive()
        }, 15000)
      }
    } catch {
      startPolling()
    }
  }

  function disconnectLive() {
    eventSource?.close()
    eventSource = null
    isLive.value = false
    stopPolling()
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
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
    for (const repo of availableRepos.value) repoSet.add(repo)
    for (const t of allTasks.value) {
      if (t.repo && t.repo !== 'all') repoSet.add(t.repo)
    }
    return ['all', ...Array.from(repoSet).sort()]
  })

  const globalDoingCount = computed(() => allTasks.value.filter((task) => task.status === 'DOING').length)

  return {
    allTasks,
    availableRepos,
    filterRepo,
    filterOrigin,
    loading,
    error,
    isLive,
    lastUpdated,
    filteredTasks,
    tasksByColumn,
    repos,
    globalDoingCount,
    loadTasks,
    loadRepos,
    moveTask,
    createTask,
    addComment,
    connectLive,
    disconnectLive,
  }
})
