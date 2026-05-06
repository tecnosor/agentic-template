/**
 * Orchestrator Service
 *
 * Automatically triggered when:
 *   1. A task transitions to READY status  → plan + decompose + move to DOING
 *   2. A human comment is added to a task  → evaluate + optionally act
 *
 * The service is purely server-side and non-blocking. It handles:
 *   - Rule-based task decomposition (parses Delivery Plan + Acceptance Criteria)
 *   - Subtask creation in kanban
 *   - Parent task transition READY → DOING
 *   - Agent inbox job writing for external AI tool pickup
 *   - SSE broadcast for real-time UI updates
 *   - Metrics emission to Langfuse
 */
import { existsSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { randomUUID } from 'crypto'
import { WORKSPACE_ROOT, REPOS } from '../config.js'
import { createTask, moveTask, addComment } from './kanbanWriter.js'
import { readTaskById } from './kanbanReader.js'
import { insertEvent } from './metricsService.js'
import { broadcast } from './sseService.js'
import { writeAgentJob } from './agentInboxService.js'
import type { KanbanTask, KanbanTaskDraft } from '../types/kanban.js'

// ── Cooldown: avoid re-triggering on the status change we just made ───────────
const recentlyHandled = new Map<string, number>()
const COOLDOWN_MS = 60_000 // 60 s per task key

function cooldownKey(repo: string, taskId: string): string {
  return `${repo}/${taskId}`
}

function isOnCooldown(key: string): boolean {
  const ts = recentlyHandled.get(key) ?? 0
  return Date.now() - ts < COOLDOWN_MS
}

function setCooldown(key: string): void {
  recentlyHandled.set(key, Date.now())
  // Clean up old entries after 5 min
  setTimeout(() => recentlyHandled.delete(key), 5 * 60_000)
}

// ── Main trigger: task moved to READY ────────────────────────────────────────

export async function handleReadyTask(taskId: string, repo: string): Promise<void> {
  const key = cooldownKey(repo, taskId)
  if (isOnCooldown(key)) return
  setCooldown(key)

  const task = readTaskById(repo, taskId)
  if (!task || task.status !== 'READY') return

  const sessionId = `orch-${randomUUID()}`

  console.info(`[orchestrator] READY task detected: ${taskId} in ${repo}`)

  insertEvent({
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    event_type: 'agent_invoked',
    agent_name: 'orchestrator',
    workspace: repo,
    task_id: taskId,
    status: 'success',
    metadata: JSON.stringify({
      trigger: 'task_ready',
      task_title: task.title,
      task_priority: task.priority,
    }),
  })

  broadcast('agent:orchestration_started', {
    taskId,
    repo,
    sessionId,
    title: task.title,
    priority: task.priority,
  })

  // 1. Decompose task into subtasks (rule-based)
  const subtaskDrafts = decomposeTask(task)
  const createdSubtaskIds: string[] = []

  // 2. Create subtask files (status: READY, origin: 🤖 Agent)
  for (const draft of subtaskDrafts) {
    try {
      createTask(repo, draft)
      createdSubtaskIds.push(draft.id)
      insertEvent({
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        event_type: 'task_created',
        workspace: repo,
        task_id: draft.id,
        status: 'success',
        metadata: JSON.stringify({
          parent_id: taskId,
          source: 'orchestrator',
          title: draft.title,
        }),
      })
      broadcast('agent:subtask_created', {
        taskId: draft.id,
        parentId: taskId,
        repo,
        title: draft.title,
      })
    } catch {
      // skip if subtask ID already exists
    }
  }

  // 3. Move parent task to DOING
  try {
    moveTask(repo, taskId, 'DOING')
    insertEvent({
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      event_type: 'task_update',
      workspace: repo,
      task_id: taskId,
      status: 'success',
      metadata: JSON.stringify({
        from: 'READY',
        to: 'DOING',
        source: 'orchestrator',
      }),
    })
    broadcast('agent:task_moved', {
      taskId,
      repo,
      from: 'READY',
      to: 'DOING',
      sessionId,
    })
  } catch (err) {
    console.warn(`[orchestrator] Could not move ${taskId} to DOING:`, err)
  }

  // 4. Add orchestration comment to parent task
  const subtaskNote =
    createdSubtaskIds.length > 0
      ? `\n\n**Subtasks created (READY):**\n${createdSubtaskIds.map(id => `- \`${id}\``).join('\n')}`
      : '\n\n_Task is atomic — no subtasks generated._'

  addComment(repo, taskId, {
    author: '🤖 Agent',
    authorName: 'orchestrator',
    date: new Date().toISOString(),
    text: `**Auto-orchestration triggered** (session \`${sessionId}\`)\n\nTask moved READY → DOING. Planning complete.${subtaskNote}\n\nAll queued jobs are visible in the **agent-inbox/pending/** directory. Each AI tool will pick them up at next session start.`,
  })

  // 5. Write parent job to agent inbox
  const parentJob = writeAgentJob({
    taskId,
    repo,
    action: 'execute',
    parentId: null,
    subtaskIds: createdSubtaskIds,
    sessionId,
    context: {
      title: task.title ?? taskId,
      description: task.description,
      priority: task.priority,
    },
  })
  broadcast('agent:job_queued', {
    jobId: parentJob.id,
    taskId,
    repo,
    action: 'execute',
  })

  // 6. Write individual jobs for each subtask
  for (const subId of createdSubtaskIds) {
    const subTask = readTaskById(repo, subId)
    if (!subTask) continue
    const subJob = writeAgentJob({
      taskId: subId,
      repo,
      action: 'execute',
      parentId: taskId,
      subtaskIds: [],
      sessionId,
      context: {
        title: subTask.title ?? subId,
        description: subTask.description,
        priority: subTask.priority,
      },
    })
    broadcast('agent:job_queued', {
      jobId: subJob.id,
      taskId: subId,
      parentId: taskId,
      repo,
      action: 'execute',
    })
  }

  console.info(
    `[orchestrator] ${taskId} → DOING. Subtasks: [${createdSubtaskIds.join(', ') || 'none'}]. Jobs queued.`,
  )
}

// ── Comment trigger ───────────────────────────────────────────────────────────

export async function handleNewComment(
  taskId: string,
  repo: string,
  commentText: string,
  commentAuthor: string,
): Promise<void> {
  // Only react to human comments — ignore agent-generated ones
  if (commentAuthor === '🤖 Agent') return

  const task = readTaskById(repo, taskId)
  if (!task) return

  const sessionId = `cr-${randomUUID()}`

  insertEvent({
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    event_type: 'skill_invoked',
    skill_name: 'comment-review',
    workspace: repo,
    task_id: taskId,
    status: 'success',
    metadata: JSON.stringify({
      trigger: 'comment_added',
      task_status: task.status,
      author: commentAuthor,
    }),
  })

  const analysis = analyzeComment(commentText, task.status)

  broadcast('agent:comment_review', {
    taskId,
    repo,
    action: analysis.action,
    sessionId,
  })

  if (analysis.action === 'none') return

  // Add agent reply comment
  addComment(repo, taskId, {
    author: '🤖 Agent',
    authorName: 'comment-reviewer',
    date: new Date().toISOString(),
    text: buildCommentReply(analysis, task, commentText),
  })

  // Move to READY if warranted and task isn't already running or done
  if (
    analysis.action === 'move_to_ready' &&
    !['READY', 'DOING', 'TESTING', 'HUMAN_VALIDATION', 'DONE'].includes(task.status)
  ) {
    try {
      moveTask(repo, taskId, 'READY')
      insertEvent({
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        event_type: 'task_update',
        workspace: repo,
        task_id: taskId,
        status: 'success',
        metadata: JSON.stringify({
          from: task.status,
          to: 'READY',
          source: 'comment-review',
          reason: analysis.reason,
        }),
      })
      broadcast('agent:task_moved', {
        taskId,
        repo,
        from: task.status,
        to: 'READY',
        reason: analysis.reason,
        sessionId,
      })
      // handleReadyTask will fire from the watcher detecting this change
    } catch (err) {
      console.warn(`[comment-review] Could not move ${taskId} to READY:`, err)
    }
  } else if (analysis.action === 'queue_review') {
    const job = writeAgentJob({
      taskId,
      repo,
      action: 'review',
      parentId: null,
      subtaskIds: [],
      sessionId,
      context: {
        title: task.title ?? taskId,
        description: `Comment review requested:\n\n> ${commentText}`,
        priority: task.priority,
      },
    })
    broadcast('agent:job_queued', {
      jobId: job.id,
      taskId,
      repo,
      action: 'review',
      trigger: 'comment',
    })
  }
}

// ── Comment analyser ──────────────────────────────────────────────────────────

interface CommentAnalysis {
  action: 'move_to_ready' | 'queue_review' | 'none'
  reason: string
}

const READY_KEYWORDS = [
  /\b(fix|bug|broken|error|crash|blocker|regression)\b/i,
  /\b(please\s+(implement|build|create|add|start|do|work|execute))\b/i,
  /\b(ready\s+to\s+(go|start|implement))\b/i,
  /\b(approved|lgtm|go\s+ahead|green\s+light)\b/i,
  /\b(priority|urgent|asap|critical)\b/i,
  /\b(unblock|unblocked)\b/i,
]

const REVIEW_KEYWORDS = [
  /\b(question|clarif|concern|issue|problem|doubt|help|unclear|confus)\b/i,
  /\b(feedback|suggestion|consider|maybe|think|what\s+if)\b/i,
  /\?(.*)/,
]

function analyzeComment(text: string, taskStatus: string): CommentAnalysis {
  for (const pattern of READY_KEYWORDS) {
    if (pattern.test(text)) {
      return {
        action: taskStatus === 'BACKLOG' || taskStatus === 'TODO' ? 'move_to_ready' : 'queue_review',
        reason: `Comment contains action keyword matching: ${pattern.source}`,
      }
    }
  }
  for (const pattern of REVIEW_KEYWORDS) {
    if (pattern.test(text)) {
      return {
        action: 'queue_review',
        reason: `Comment contains review/feedback signal matching: ${pattern.source}`,
      }
    }
  }
  return { action: 'none', reason: 'No actionable signal detected' }
}

function buildCommentReply(
  analysis: CommentAnalysis,
  task: KanbanTask,
  commentText: string,
): string {
  if (analysis.action === 'move_to_ready') {
    return `**🤖 Auto-review:** Comment signals this task should proceed.\n\n> "${commentText.slice(0, 200)}"\n\n_Reason:_ ${analysis.reason}\n\nMoving task \`${task.id}\` → **READY**. The orchestrator will pick it up and begin planning.`
  }
  if (analysis.action === 'queue_review') {
    return `**🤖 Auto-review:** Feedback or question detected in this comment.\n\n> "${commentText.slice(0, 200)}"\n\n_Reason:_ ${analysis.reason}\n\nQueued a review job in agent-inbox. An agent will assess and respond in the next session.`
  }
  return ''
}

// ── Task decomposer ───────────────────────────────────────────────────────────

function decomposeTask(task: KanbanTask): KanbanTaskDraft[] {
  const items = extractDeliveryPlanItems(task.description)
  if (items.length === 0) return []

  const nextIds = computeNextTaskIds(items.length, preferredPrefix(task.id))

  return items.map((item, i) => ({
    id: nextIds[i]!,
    title: item.slice(0, 120),
    origin: '🤖 Agent' as const,
    status: 'READY' as const,
    priority: task.priority,
    repo: task.repo,
    description: `**Subtask of \`${task.id}\`** — ${task.title ?? task.id}\n\n${item}`,
    acceptanceCriteria: `- [ ] ${item}`,
  }))
}

function extractDeliveryPlanItems(description: string): string[] {
  const lines = description.split('\n')
  const items: string[] = []
  let inSection = false

  // First pass: Delivery Plan
  for (const line of lines) {
    if (/^##\s+delivery\s+plan/i.test(line)) { inSection = true; continue }
    if (inSection && /^##/.test(line)) { inSection = false; continue }
    if (inSection) {
      const m = line.match(/^\s*-\s+\[[ x]\]\s+(.+)/)
      if (m?.[1]) items.push(m[1].trim())
    }
  }

  // Fallback: Acceptance Criteria
  if (items.length === 0) {
    inSection = false
    for (const line of lines) {
      if (/^##\s+acceptance\s+criteria/i.test(line)) { inSection = true; continue }
      if (inSection && /^##/.test(line)) { inSection = false; continue }
      if (inSection) {
        const m = line.match(/^\s*-\s+(.+)/)
        if (m?.[1]) items.push(m[1].trim())
      }
    }
  }

  return items.slice(0, 5) // max 5 subtasks
}

function preferredPrefix(parentId: string): string {
  const m = parentId.match(/^(FEAT|FIX|CHORE|SCOUT|LANG)/)
  return m ? m[1]! : 'FEAT'
}

function computeNextTaskIds(count: number, prefix: string): string[] {
  let maxNum = 0

  for (const repo of REPOS) {
    const tasksDir = resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks')
    if (!existsSync(tasksDir)) continue
    for (const f of readdirSync(tasksDir).filter(f => f.endsWith('.md'))) {
      const m = f.match(/^(?:FEAT|FIX|CHORE|SCOUT|LANG)-(\d+)\.md$/)
      if (m) {
        const n = parseInt(m[1]!, 10)
        if (n > maxNum) maxNum = n
      }
    }
  }

  return Array.from({ length: count }, (_, i) =>
    `${prefix}-${String(maxNum + i + 1).padStart(3, '0')}`,
  )
}
