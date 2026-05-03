<script setup lang="ts">
import { ref, computed } from 'vue'
import type { KanbanTask, KanbanColumn, Origin } from '../types/kanban'
import { COLUMNS, COLUMN_LABELS, PRIORITY_CONFIG } from '../types/kanban'
import { useKanbanStore } from '../stores/kanbanStore'

const props = defineProps<{ task: KanbanTask }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const store = useKanbanStore()

// ── Comments ─────────────────────────────────────────────────────────────────
const commentAuthor = ref<Origin>('👤 Human')
const commentAuthorName = ref('')
const commentText = ref('')
const submittingComment = ref(false)
const commentError = ref<string | null>(null)

async function submitComment() {
  if (!commentText.value.trim()) return
  submittingComment.value = true
  commentError.value = null
  try {
    await store.addComment(
      props.task.id,
      props.task.repo,
      commentAuthor.value,
      commentText.value.trim(),
      commentAuthorName.value.trim() || undefined,
    )
    commentText.value = ''
    commentAuthorName.value = ''
  } catch (e) {
    commentError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submittingComment.value = false
  }
}

// ── Move task ────────────────────────────────────────────────────────────────
const movingTo = ref<KanbanColumn | null>(null)
const moveError = ref<string | null>(null)

async function moveTo(col: KanbanColumn) {
  if (col === props.task.status) return
  movingTo.value = col
  moveError.value = null
  try {
    await store.moveTask(props.task.id, props.task.repo, col)
  } catch (e) {
    moveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    movingTo.value = null
  }
}

// ── GitHub sync ───────────────────────────────────────────────────────────────
const syncing = ref(false)
const syncResult = ref<string | null>(null)

async function syncGitHub() {
  syncing.value = true
  syncResult.value = null
  try {
    const res = await fetch('/api/github/sync-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: props.task.id, repo: props.task.repo }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Sync failed')
    syncResult.value = data.issue
      ? `✓ Issue #${data.issue.number}`
      : '✓ Synced'
  } catch (e) {
    syncResult.value = `✗ ${e instanceof Error ? e.message : String(e)}`
  } finally {
    syncing.value = false
  }
}

// ── Acceptance criteria ───────────────────────────────────────────────────────
const criteria = computed(() =>
  props.task.acceptanceCriteria
    ? props.task.acceptanceCriteria.split(/\n|<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean)
    : [],
)

// ── Priority config ───────────────────────────────────────────────────────────
const priorityCfg = computed(() => PRIORITY_CONFIG[props.task.priority])

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return iso.split('T')[0]
}
</script>

<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <!-- Modal -->
    <div
      class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-700 bg-slate-900 px-6 py-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-xs text-slate-400 shrink-0">{{ task.id }}</span>
            <span
              class="text-xs px-1.5 py-0.5 rounded border font-semibold shrink-0"
              :class="priorityCfg.classes"
            >
              {{ priorityCfg.label }}
            </span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {{ task.origin }}
            </span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              {{ task.repo }}
            </span>
          </div>
          <h2 class="mt-2 text-base font-semibold text-slate-100 break-words">
            {{ task.title ?? task.description }}
          </h2>
        </div>
        <button
          class="shrink-0 text-slate-500 hover:text-slate-200 transition-colors text-xl leading-none mt-1"
          aria-label="Close"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 flex flex-col gap-6">

        <!-- Metadata row -->
        <div class="flex flex-wrap gap-4 text-xs text-slate-400">
          <div>
            <span class="font-semibold text-slate-500">Status:</span>
            {{ COLUMN_LABELS[task.status] }}
          </div>
          <div>
            <span class="font-semibold text-slate-500">Created:</span>
            {{ formatDate(task.created) }}
          </div>
          <div v-if="task.updated !== task.created">
            <span class="font-semibold text-slate-500">Updated:</span>
            {{ formatDate(task.updated) }}
          </div>
          <div v-if="task.leadTime">
            <span class="font-semibold text-slate-500">Lead time:</span>
            {{ task.leadTime }}
          </div>
          <div v-if="task.completed">
            <span class="font-semibold text-slate-500">Completed:</span>
            {{ task.completed }}
          </div>
        </div>

        <!-- Description -->
        <div>
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
          <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{{ task.description }}</p>
        </div>

        <!-- Acceptance criteria -->
        <div v-if="criteria.length > 0">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Acceptance Criteria</h3>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="(criterion, i) in criteria"
              :key="i"
              class="flex items-start gap-2 text-sm text-slate-300"
            >
              <span class="mt-0.5 shrink-0 h-4 w-4 rounded border border-slate-600 bg-slate-800 flex items-center justify-center text-xs text-slate-500">✓</span>
              {{ criterion }}
            </li>
          </ul>
        </div>

        <!-- Move to column -->
        <div>
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Move to</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="col in COLUMNS"
              :key="col"
              class="text-xs px-3 py-1.5 rounded border transition-colors"
              :class="
                col === task.status
                  ? 'border-slate-400 bg-slate-700 text-slate-200 font-semibold cursor-default'
                  : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-400 hover:text-slate-200'
              "
              :disabled="col === task.status || movingTo !== null"
              @click="moveTo(col)"
            >
              <span v-if="movingTo === col" class="opacity-60">…</span>
              <span v-else>{{ COLUMN_LABELS[col] }}</span>
            </button>
          </div>
          <p v-if="moveError" class="mt-1.5 text-xs text-red-400">{{ moveError }}</p>
        </div>

        <!-- GitHub Issue -->
        <div class="flex items-center gap-3">
          <a
            v-if="task.githubIssueUrl"
            :href="task.githubIssueUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            GitHub Issue #{{ task.githubIssueNumber }}
          </a>
          <button
            class="text-xs px-3 py-1.5 rounded border border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            :disabled="syncing"
            @click="syncGitHub"
          >
            {{ syncing ? 'Syncing…' : task.githubIssueUrl ? '↺ Re-sync GitHub' : '↑ Create GitHub Issue' }}
          </button>
          <span v-if="syncResult" class="text-xs text-slate-400">{{ syncResult }}</span>
        </div>

        <!-- Comments -->
        <div>
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Comments ({{ task.comments?.length ?? 0 }})
          </h3>

          <!-- Comment thread -->
          <div v-if="task.comments && task.comments.length > 0" class="flex flex-col gap-3 mb-4">
            <div
              v-for="(comment, i) in task.comments"
              :key="i"
              class="rounded-lg border border-slate-700 bg-slate-800 p-3 flex flex-col gap-1"
            >
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span class="font-medium text-slate-400">
                  {{ comment.author }}{{ comment.authorName ? ` (${comment.authorName})` : '' }}
                </span>
                <span>·</span>
                <span>{{ formatDate(comment.date) }}</span>
              </div>
              <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{{ comment.text }}</p>
            </div>
          </div>

          <!-- Add comment form -->
          <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-3 flex flex-col gap-3">
            <div class="flex gap-2">
              <!-- Author dropdown -->
              <select
                v-model="commentAuthor"
                class="rounded border border-slate-600 bg-slate-800 text-slate-300 text-xs px-2 py-1.5 focus:outline-none focus:border-slate-400"
              >
                <option value="👤 Human">👤 Human</option>
                <option value="🤖 Agent">🤖 Agent</option>
              </select>
              <!-- Author name (optional) -->
              <input
                v-model="commentAuthorName"
                type="text"
                placeholder="Name (optional)"
                class="flex-1 rounded border border-slate-600 bg-slate-800 text-slate-300 text-xs px-2 py-1.5 placeholder:text-slate-600 focus:outline-none focus:border-slate-400"
              />
            </div>
            <textarea
              v-model="commentText"
              rows="3"
              placeholder="Add a comment…"
              class="w-full rounded border border-slate-600 bg-slate-800 text-slate-300 text-xs px-2 py-1.5 placeholder:text-slate-600 focus:outline-none focus:border-slate-400 resize-none"
            />
            <div class="flex items-center justify-between gap-2">
              <p v-if="commentError" class="text-xs text-red-400">{{ commentError }}</p>
              <div v-else />
              <button
                class="text-xs px-4 py-1.5 rounded border border-slate-500 bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors disabled:opacity-50"
                :disabled="!commentText.trim() || submittingComment"
                @click="submitComment"
              >
                {{ submittingComment ? 'Saving…' : 'Add Comment' }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
