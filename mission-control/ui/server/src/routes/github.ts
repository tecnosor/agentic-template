import { Router } from 'express'
import type { Request, Response } from 'express'
import { readAllTasks, readTaskById } from '../services/kanbanReader.js'
import { getIssueIntegrationConfig, syncAllTasks, syncTask } from '../services/issueTrackerService.js'
import { commitAndPush } from '../services/gitService.js'

const router = Router()

function ensureIssuesEnabled(res: Response): boolean {
  const config = getIssueIntegrationConfig()
  if (!config.enabled || !config.provider) {
    res.status(503).json({ error: 'No issue provider configured' })
    return false
  }
  return true
}

router.get('/issues/config', (_req, res) => {
  res.json(getIssueIntegrationConfig())
})

// ── POST /api/github/sync ────────────────────────────────────────────────────
async function syncAllIssues(_req: Request, res: Response) {
  if (!ensureIssuesEnabled(res)) return

  try {
    const tasks = readAllTasks(false)
    const result = await syncAllTasks(tasks)
    res.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
}

router.post('/issues/sync', syncAllIssues)
router.post('/github/sync', syncAllIssues)

// ── POST /api/github/sync-task ───────────────────────────────────────────────
interface SyncTaskBody {
  id: string
  repo: string
}

async function syncSingleIssue(req: Request<object, object, SyncTaskBody>, res: Response) {
  if (!ensureIssuesEnabled(res)) return

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
      await commitAndPush(repo, `chore(kanban): link ${id} to ${ref.provider} issue #${ref.number}`)
    }

    res.json({ ok: true, issue: ref, config: getIssueIntegrationConfig() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
}

router.post('/issues/sync-task', syncSingleIssue)
router.post('/github/sync-task', syncSingleIssue)

export default router
