import { Router } from 'express'
import type { Request, Response } from 'express'
import type { KanbanColumn, KanbanTaskDraft, Origin, Priority } from '../types/kanban.js'
import { moveTask, addComment, createTask } from '../services/kanbanWriter.js'
import { commitAndPush } from '../services/gitService.js'
import { readTaskById } from '../services/kanbanReader.js'

const router = Router()

const TASK_ID_PATTERN = /^(FEAT|FIX|CHORE|SCOUT|DONE|BACKLOG|LANG)-[0-9]{3,}$/
const VALID_PRIORITIES: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const VALID_COLUMNS: KanbanColumn[] = ['BACKLOG', 'TODO', 'READY', 'DOING', 'TESTING', 'HUMAN_VALIDATION', 'DONE']
const VALID_ORIGINS: Origin[] = ['👤 Human', '🤖 Agent']

// ── POST /api/tasks/move ─────────────────────────────────────────────────────
interface MoveBody {
  id: string
  repo: string
  targetColumn: KanbanColumn
}

router.post('/tasks/move', async (req: Request<object, object, MoveBody>, res: Response) => {
  const { id, repo, targetColumn } = req.body
  if (!id || !repo || !targetColumn) {
    res.status(400).json({ error: 'id, repo, and targetColumn are required' })
    return
  }

  try {
    const existing = readTaskById(repo, id)
    if (!existing) {
      res.status(404).json({ error: `Task ${id} not found in ${repo}` })
      return
    }
    if (existing.status === 'DONE' && targetColumn !== 'DONE') {
      res.status(400).json({ error: 'DONE tasks are append-only and cannot be moved back' })
      return
    }
    const sourceFile = moveTask(repo, id, targetColumn)
    await commitAndPush(repo, `chore(kanban): move ${id} to ${targetColumn}`)
    res.json({ ok: true, sourceFile })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// ── POST /api/tasks/create ────────────────────────────────────────────────────
router.post('/tasks/create', async (req: Request<object, object, KanbanTaskDraft>, res: Response) => {
  const body = req.body
  if (!body.id || !body.title || !body.repo || !body.description) {
    res.status(400).json({ error: 'id, title, repo, and description are required' })
    return
  }
  if (!TASK_ID_PATTERN.test(body.id)) {
    res.status(400).json({ error: 'Task ID must match FEAT-/FIX-/CHORE-/SCOUT-/DONE-/BACKLOG-/LANG- followed by at least 3 digits' })
    return
  }
  // Validate repo is a safe directory name (no path traversal)
  if (!body.repo || !/^[a-zA-Z0-9_-]+$/.test(body.repo)) {
    res.status(400).json({ error: 'repo must be a valid directory name (letters, numbers, dashes, underscores)' })
    return
  }
  if (!VALID_ORIGINS.includes(body.origin)) {
    res.status(400).json({ error: 'origin must be either 👤 Human or 🤖 Agent' })
    return
  }
  if (!VALID_PRIORITIES.includes(body.priority)) {
    res.status(400).json({ error: 'priority must be CRITICAL, HIGH, MEDIUM, or LOW' })
    return
  }
  if (!VALID_COLUMNS.includes(body.status)) {
    res.status(400).json({ error: 'status is invalid' })
    return
  }

  try {
    const sourceFile = createTask(body.repo, body)
    await commitAndPush(body.repo, `chore(kanban): create ${body.id}`)
    const task = readTaskById(body.repo, body.id)
    res.status(201).json({ ok: true, sourceFile, task })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('already exists')) {
      res.status(409).json({ error: msg })
      return
    }
    res.status(500).json({ error: msg })
  }
})

// ── POST /api/tasks/comment ──────────────────────────────────────────────────
interface CommentBody {
  id: string
  repo: string
  author: Origin
  text: string
  authorName?: string
}

router.post('/tasks/comment', async (req: Request<object, object, CommentBody>, res: Response) => {
  const { id, repo, author, text, authorName } = req.body
  if (!id || !repo || !author || !text) {
    res.status(400).json({ error: 'id, repo, author, and text are required' })
    return
  }

  const comment = {
    author,
    authorName,
    date: new Date().toISOString(),
    text,
  }

  try {
    addComment(repo, id, comment)
    await commitAndPush(repo, `chore(kanban): add comment to ${id}`)
    res.json({ ok: true, comment })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

export default router
