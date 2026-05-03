import { Router } from 'express'
import type { Request, Response } from 'express'
import type { KanbanColumn, Origin } from '../types/kanban.js'
import { moveTask, addComment } from '../services/kanbanWriter.js'
import { commitAndPush } from '../services/gitService.js'

const router = Router()

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
    const sourceFile = moveTask(repo, id, targetColumn)
    await commitAndPush(repo, `chore(kanban): move ${id} to ${targetColumn}`)
    res.json({ ok: true, sourceFile })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
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
