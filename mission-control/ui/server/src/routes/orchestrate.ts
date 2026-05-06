/**
 * Orchestrate routes
 *
 * Exposes the orchestration engine and agent inbox over HTTP.
 *
 * POST /api/orchestrate/trigger   — Manually trigger task orchestration
 * GET  /api/orchestrate/inbox     — List jobs by status
 * POST /api/orchestrate/inbox/:id/claim  — Claim a pending job
 * POST /api/orchestrate/inbox/:id/finish — Mark job done or failed
 * GET  /api/orchestrate/summary   — Inbox stats
 */
import { Router } from 'express'
import type { Request, Response } from 'express'
import { handleReadyTask, handleNewComment } from '../services/orchestratorService.js'
import {
  listJobs,
  claimJob,
  finishJob,
  getInboxSummary,
} from '../services/agentInboxService.js'
import type { JobStatus } from '../services/agentInboxService.js'

const router = Router()

const VALID_STATUSES: JobStatus[] = ['pending', 'in-progress', 'done', 'failed']

// ── POST /api/orchestrate/trigger ────────────────────────────────────────────
interface TriggerBody {
  taskId: string
  repo: string
}

router.post('/orchestrate/trigger', async (req: Request<object, object, TriggerBody>, res: Response) => {
  const { taskId, repo } = req.body
  if (!taskId || !repo) {
    res.status(400).json({ error: 'taskId and repo are required' })
    return
  }
  // Input validation: safe characters only
  if (!/^[A-Z]+-\d{3,}$/.test(taskId)) {
    res.status(400).json({ error: 'Invalid taskId format' })
    return
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(repo)) {
    res.status(400).json({ error: 'Invalid repo name' })
    return
  }
  try {
    await handleReadyTask(taskId, repo)
    res.json({ ok: true, message: `Orchestration triggered for ${taskId}` })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// ── POST /api/orchestrate/comment-review ─────────────────────────────────────
interface CommentReviewBody {
  taskId: string
  repo: string
  commentText: string
  commentAuthor: string
}

router.post(
  '/orchestrate/comment-review',
  async (req: Request<object, object, CommentReviewBody>, res: Response) => {
    const { taskId, repo, commentText, commentAuthor } = req.body
    if (!taskId || !repo || !commentText || !commentAuthor) {
      res.status(400).json({ error: 'taskId, repo, commentText, and commentAuthor are required' })
      return
    }
    if (!/^[A-Z]+-\d{3,}$/.test(taskId)) {
      res.status(400).json({ error: 'Invalid taskId format' })
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(repo)) {
      res.status(400).json({ error: 'Invalid repo name' })
      return
    }
    try {
      await handleNewComment(taskId, repo, commentText, commentAuthor)
      res.json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      res.status(500).json({ error: msg })
    }
  },
)

// ── GET /api/orchestrate/inbox ────────────────────────────────────────────────
router.get('/orchestrate/inbox', (req: Request, res: Response) => {
  const status = (req.query['status'] as string) ?? 'pending'
  if (!VALID_STATUSES.includes(status as JobStatus)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
    return
  }
  const jobs = listJobs(status as JobStatus)
  res.json(jobs)
})

// ── POST /api/orchestrate/inbox/:id/claim ────────────────────────────────────
router.post('/orchestrate/inbox/:id/claim', (req: Request, res: Response) => {
  const jobId = req.params['id']
  if (!jobId || !/^[0-9a-f-]{36}$/.test(jobId)) {
    res.status(400).json({ error: 'Invalid job ID' })
    return
  }
  const job = claimJob(jobId)
  if (!job) {
    res.status(404).json({ error: `Job ${jobId} not found in pending` })
    return
  }
  res.json({ ok: true, job })
})

// ── POST /api/orchestrate/inbox/:id/finish ───────────────────────────────────
interface FinishBody { outcome: 'done' | 'failed' }

router.post(
  '/orchestrate/inbox/:id/finish',
  (req: Request<{ id: string }, object, FinishBody>, res: Response) => {
    const jobId = req.params['id']
    const { outcome } = req.body
    if (!jobId || !/^[0-9a-f-]{36}$/.test(jobId)) {
      res.status(400).json({ error: 'Invalid job ID' })
      return
    }
    if (outcome !== 'done' && outcome !== 'failed') {
      res.status(400).json({ error: 'outcome must be "done" or "failed"' })
      return
    }
    const job = finishJob(jobId, outcome)
    if (!job) {
      res.status(404).json({ error: `Job ${jobId} not found in in-progress` })
      return
    }
    res.json({ ok: true, job })
  },
)

// ── GET /api/orchestrate/summary ─────────────────────────────────────────────
router.get('/orchestrate/summary', (_req: Request, res: Response) => {
  res.json(getInboxSummary())
})

export default router
