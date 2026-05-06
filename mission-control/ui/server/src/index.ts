import express from 'express'
import cors from 'cors'
import { PORT, WORKSPACE_ROOT, REPOS, LANGFUSE_ENABLED, LANGFUSE_HOST } from './config.js'
import tasksRouter from './routes/tasks.js'
import mutationsRouter from './routes/mutations.js'
import githubRouter from './routes/github.js'
import metricsRouter from './routes/metrics.js'
import orchestrateRouter from './routes/orchestrate.js'
import { startKanbanWatcher } from './services/kanbanWatcher.js'
import { startGitPoller } from './services/gitPoller.js'
import { getLangfuseClient, flushLangfuse } from './services/langfuseService.js'

const app = express()

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', tasksRouter)
app.use('/api', mutationsRouter)
app.use('/api', githubRouter)
app.use('/api', metricsRouter)
app.use('/api', orchestrateRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const server = app.listen(PORT, () => {
  console.info(`\n┌─ Mission Control API ────────────────────────────────┐`)
  console.info(`│  URL            http://localhost:${PORT}              │`)
  console.info(`│  Workspace      ${WORKSPACE_ROOT.slice(-44).padEnd(44)} │`)
  console.info(`│  Repos (${String(REPOS.length).padStart(2)})     ${(REPOS.join(', ') || '(none)').slice(0, 44).padEnd(44)} │`)
  if (LANGFUSE_ENABLED) {
    console.info(`│  Langfuse       ${LANGFUSE_HOST.slice(0, 44).padEnd(44)} │`)
  } else {
    console.warn(`│  Langfuse       ⚠ disabled (set LANGFUSE_PUBLIC_KEY/SECRET_KEY)    │`)
  }
  if (REPOS.length === 0) {
    console.warn(`│  ⚠ No repos found. Set WORKSPACE_ROOT env var or    │`)
    console.warn(`│    ensure repos have a kanban/tasks/ directory.      │`)
  }
  console.info(`└──────────────────────────────────────────────────────┘\n`)

  // Initialise Langfuse client eagerly so we catch config errors at startup
  getLangfuseClient()

  // Start background collectors
  startKanbanWatcher()
  startGitPoller().catch(() => {/* non-blocking */})
})

function shutdown(signal: string) {
  console.info(`Shutting down Mission Control server (${signal})`)
  flushLangfuse().finally(() => {
    server.close(() => process.exit(0))
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
