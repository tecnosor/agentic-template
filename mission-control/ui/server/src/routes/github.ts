import { Router } from 'express'
import type { Request, Response } from 'express'
import { readAllTasks, readTaskById } from '../services/kanbanReader.js'
import { syncAllTasks, syncTask } from '../services/githubService.js'
import { commitAndPush } from '../services/gitService.js'
import { GITHUB_TOKEN } from '../config.js'

const router = Router()

// ── POST /api/github/sync ────────────────────────────────────────────────────
router.post('/github/sync', async (_req: Request, res: Response) => {
  if (!GITHUB_TOKEN) {
    res.status(503).json({ error: 'GITHUB_TOKEN not configured' })
    return
  }

  try {
    const tasks = readAllTasks(false)
    const result = await syncAllTasks(tasks)
    res.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// ── POST /api/github/sync-task ───────────────────────────────────────────────
interface SyncTaskBody {
  id: string
  repo: string
}

router.post(
  '/github/sync-task',
  async (req: Request<object, object, SyncTaskBody>, res: Response) => {
    if (!GITHUB_TOKEN) {
      res.status(503).json({ error: 'GITHUB_TOKEN not configured' })
      return
    }

    const { id, repo } = req.body
    if (!id || !repo) {
      res.status(400).json({ error: 'id and repo are required' })
      return
    }

    try {
      const task = readTaskById(repo, id)
      if (!task) {
        res.status(404).json({ error: `Task ${id} not found in ${repo}` })
        return
      }

      const ref = await syncTask(task)

      if (ref) {
        // Persist issue number back to kanban file and commit
        await commitAndPush(repo, `chore(kanban): link ${id} to GitHub issue #${ref.number}`)
      }

      res.json({ ok: true, issue: ref })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      res.status(500).json({ error: msg })
    }
  },
)

export default router
