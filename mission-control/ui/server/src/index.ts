import express from 'express'
import cors from 'cors'
import { PORT } from './config.js'
import tasksRouter from './routes/tasks.js'
import mutationsRouter from './routes/mutations.js'
import githubRouter from './routes/github.js'
import metricsRouter from './routes/metrics.js'

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

app.listen(PORT, () => {
  console.info(`Kanban API server running at http://localhost:${PORT}`)
})
