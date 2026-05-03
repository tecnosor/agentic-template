import { Router } from 'express'
import { readAllTasks } from '../services/kanbanReader.js'
import { REPOS } from '../config.js'

const router = Router()

// GET /api/tasks
router.get('/tasks', (_req, res) => {
  try {
    const tasks = readAllTasks(true)
    res.json(tasks)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
})

// GET /api/repos
router.get('/repos', (_req, res) => {
  res.json(REPOS)
})

export default router
