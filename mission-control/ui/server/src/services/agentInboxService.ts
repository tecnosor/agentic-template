/**
 * Agent Inbox Service
 *
 * Manages the agent-inbox/ directory at workspace root.
 * Jobs flow through: pending → in-progress → done|failed
 *
 * Each AI tool (Claude Code, OpenCode, GH Copilot) checks this inbox
 * at session start and processes pending jobs autonomously.
 */
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
} from 'fs'
import { resolve } from 'path'
import { randomUUID } from 'crypto'
import { WORKSPACE_ROOT } from '../config.js'

export type JobAction = 'execute' | 'review' | 'plan'
export type JobStatus = 'pending' | 'in-progress' | 'done' | 'failed'

export interface AgentJob {
  id: string
  createdAt: string
  status: JobStatus
  taskId: string
  repo: string
  action: JobAction
  parentId: string | null
  subtaskIds: string[]
  sessionId: string
  context: {
    title: string
    description: string
    priority: string
  }
}

const INBOX_DIR = resolve(WORKSPACE_ROOT, 'agent-inbox')

function ensureDirs(): void {
  for (const sub of ['pending', 'in-progress', 'done', 'failed']) {
    mkdirSync(resolve(INBOX_DIR, sub), { recursive: true })
  }
}

function readJob(filePath: string): AgentJob | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as AgentJob
  } catch {
    return null
  }
}

export function writeAgentJob(
  draft: Omit<AgentJob, 'id' | 'createdAt' | 'status'>,
): AgentJob {
  ensureDirs()
  const job: AgentJob = {
    ...draft,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  }
  const filePath = resolve(INBOX_DIR, 'pending', `${job.id}.json`)
  writeFileSync(filePath, JSON.stringify(job, null, 2) + '\n', 'utf-8')
  return job
}

export function listJobs(status: JobStatus = 'pending'): AgentJob[] {
  ensureDirs()
  const dir = resolve(INBOX_DIR, status)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => readJob(resolve(dir, f)))
    .filter((j): j is AgentJob => j !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function claimJob(jobId: string): AgentJob | null {
  ensureDirs()
  const src = resolve(INBOX_DIR, 'pending', `${jobId}.json`)
  if (!existsSync(src)) return null
  const job = readJob(src)
  if (!job) return null
  job.status = 'in-progress'
  const dst = resolve(INBOX_DIR, 'in-progress', `${jobId}.json`)
  writeFileSync(dst, JSON.stringify(job, null, 2) + '\n', 'utf-8')
  unlinkSync(src)
  return job
}

export function finishJob(jobId: string, outcome: 'done' | 'failed'): AgentJob | null {
  ensureDirs()
  const src = resolve(INBOX_DIR, 'in-progress', `${jobId}.json`)
  if (!existsSync(src)) {
    // Might still be in pending (claimed from API but not moved yet)
    const pendingSrc = resolve(INBOX_DIR, 'pending', `${jobId}.json`)
    if (!existsSync(pendingSrc)) return null
    const j = readJob(pendingSrc)
    if (!j) return null
    j.status = outcome
    const dst = resolve(INBOX_DIR, outcome, `${jobId}.json`)
    writeFileSync(dst, JSON.stringify(j, null, 2) + '\n', 'utf-8')
    unlinkSync(pendingSrc)
    return j
  }
  const job = readJob(src)
  if (!job) return null
  job.status = outcome
  const dst = resolve(INBOX_DIR, outcome, `${jobId}.json`)
  writeFileSync(dst, JSON.stringify(job, null, 2) + '\n', 'utf-8')
  unlinkSync(src)
  return job
}

export function getInboxSummary(): { pending: number; inProgress: number; done: number; failed: number } {
  ensureDirs()
  const count = (dir: string) => {
    try { return readdirSync(resolve(INBOX_DIR, dir)).filter(f => f.endsWith('.json')).length } catch { return 0 }
  }
  return {
    pending: count('pending'),
    inProgress: count('in-progress'),
    done: count('done'),
    failed: count('failed'),
  }
}
