<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

export interface AgentEvent {
  id: string
  type: string
  timestamp: string
  taskId?: string
  parentId?: string
  repo?: string
  title?: string
  from?: string
  to?: string
  action?: string
  reason?: string
  jobId?: string
}

const events = ref<AgentEvent[]>([])
const MAX_EVENTS = 30
let counter = 0

function addEvent(type: string, data: Record<string, unknown>) {
  const ev: AgentEvent = {
    id: String(++counter),
    type,
    timestamp: new Date().toISOString(),
    taskId: data['taskId'] as string | undefined,
    parentId: data['parentId'] as string | undefined,
    repo: data['repo'] as string | undefined,
    title: data['title'] as string | undefined,
    from: data['from'] as string | undefined,
    to: data['to'] as string | undefined,
    action: data['action'] as string | undefined,
    reason: data['reason'] as string | undefined,
    jobId: data['jobId'] as string | undefined,
  }
  events.value = [ev, ...events.value].slice(0, MAX_EVENTS)
}

// Subscribe to agent:* SSE events from the metrics stream
let es: EventSource | null = null

function connect() {
  if (es) return
  try {
    es = new EventSource('/api/metrics/stream')
    es.addEventListener('agent:orchestration_started', (e: MessageEvent) => {
      addEvent('orchestration_started', JSON.parse(e.data))
    })
    es.addEventListener('agent:subtask_created', (e: MessageEvent) => {
      addEvent('subtask_created', JSON.parse(e.data))
    })
    es.addEventListener('agent:task_moved', (e: MessageEvent) => {
      addEvent('task_moved', JSON.parse(e.data))
    })
    es.addEventListener('agent:job_queued', (e: MessageEvent) => {
      addEvent('job_queued', JSON.parse(e.data))
    })
    es.addEventListener('agent:comment_review', (e: MessageEvent) => {
      addEvent('comment_review', JSON.parse(e.data))
    })
    es.onerror = () => {
      es?.close()
      es = null
      setTimeout(connect, 10_000)
    }
  } catch {
    // ignore — server may not be running
  }
}

connect()

onUnmounted(() => {
  es?.close()
  es = null
})

function iconFor(type: string): string {
  switch (type) {
    case 'orchestration_started': return '🤖'
    case 'subtask_created': return '📋'
    case 'task_moved': return '➡️'
    case 'job_queued': return '📥'
    case 'comment_review': return '💬'
    default: return '⚡'
  }
}

function labelFor(ev: AgentEvent): string {
  switch (ev.type) {
    case 'orchestration_started':
      return `Orchestrating ${ev.taskId}${ev.title ? ` — ${ev.title}` : ''}`
    case 'subtask_created':
      return `Subtask ${ev.taskId} created${ev.parentId ? ` (↳ ${ev.parentId})` : ''}`
    case 'task_moved':
      return `${ev.taskId} moved ${ev.from} → ${ev.to}`
    case 'job_queued':
      return `Job queued for ${ev.taskId} [${ev.action ?? 'execute'}]`
    case 'comment_review':
      return `Comment reviewed on ${ev.taskId} → ${ev.action ?? 'no action'}`
    default:
      return ev.type
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function dismiss(id: string) {
  events.value = events.value.filter(e => e.id !== id)
}
</script>

<template>
  <transition-group
    v-if="events.length > 0"
    tag="div"
    name="feed"
    class="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 max-w-sm pointer-events-none"
  >
    <div
      v-for="ev in events.slice(0, 5)"
      :key="ev.id"
      class="pointer-events-auto flex items-start gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs text-slate-200"
    >
      <span class="text-base leading-none mt-0.5 shrink-0">{{ iconFor(ev.type) }}</span>
      <div class="flex-1 min-w-0">
        <p class="font-medium truncate">{{ labelFor(ev) }}</p>
        <p class="text-slate-500 mt-0.5">{{ timeAgo(ev.timestamp) }}</p>
      </div>
      <button
        class="ml-1 text-slate-600 hover:text-slate-300 shrink-0"
        @click="dismiss(ev.id)"
      >✕</button>
    </div>
  </transition-group>
</template>

<style scoped>
.feed-enter-active,
.feed-leave-active {
  transition: all 0.3s ease;
}
.feed-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.feed-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
