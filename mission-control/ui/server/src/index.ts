import express from 'express'
import cors from 'cors'
import { PORT } from './config.js'
import tasksRouter from './routes/tasks.js'
import mutationsRouter from './routes/mutations.js'
import githubRouter from './routes/github.js'
import metricsRouter from './routes/metrics.js'
import { startKanbanWatcher } from './services/kanbanWatcher.js'
import { startGitPoller } from './services/gitPoller.js'

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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const server = app.listen(PORT, () => {
  console.info(`Kanban API server running at http://localhost:${PORT}`)

  // Start background collectors
  startKanbanWatcher()
  startGitPoller().catch(() => {/* non-blocking */})
})

function shutdown(signal: string) {
  console.info(`Shutting down Mission Control server (${signal})`)
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
