import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { WORKSPACE_ROOT, REPOS } from '../config.js'
import type { KanbanTask, KanbanColumn, Priority, Origin } from '../types/kanban.js'
import { getCommentsForTask } from './kanbanWriter.js'

function normalizeOrigin(raw = ''): Origin {
  const lower = raw.toLowerCase().trim()
  if (lower === 'agent' || raw.includes('🤖')) return '🤖 Agent'
  return '👤 Human'
}

function normalizePriority(raw = ''): Priority {
  const u = raw.toUpperCase().trim()
  if (u === 'CRITICAL') return 'CRITICAL'
  if (u === 'HIGH') return 'HIGH'
  if (u === 'LOW') return 'LOW'
  return 'MEDIUM'
}

function parseOptionalNumber(raw?: string): number | undefined {
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function normalizeStatus(raw = ''): KanbanColumn {
  const u = raw.toUpperCase().trim()
  const valid: KanbanColumn[] = [
    'BACKLOG',
    'TODO',
    'READY',
    'DOING',
    'TESTING',
    'HUMAN_VALIDATION',
    'DONE',
  ]
  return valid.includes(u as KanbanColumn) ? (u as KanbanColumn) : 'BACKLOG'
}

// ── YAML frontmatter parser ───────────────────────────────────────────────────

function parseFrontmatter(content: string): { fields: Record<string, string>; body: string } {
  const fields: Record<string, string> = {}

  if (!content.startsWith('---')) {
    return { fields, body: content }
  }

  const end = content.indexOf('\n---', 3)
  if (end === -1) return { fields, body: content }

  const yamlSection = content.slice(3, end).trim()
  const body = content.slice(end + 4).trim()

  for (const line of yamlSection.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) fields[key] = value
  }

  return { fields, body }
}

function extractSection(body: string, title: string): string | undefined {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^##+\\s+${escapedTitle}\\s*\\n([\\s\\S]*?)(?=\\n##+\\s+|$)`, 'im')
  const match = body.match(regex)
  return match?.[1]?.trim()
}

function extractBodySections(body: string): {
  description: string
  acceptanceCriteria?: string
} {
  const rawDescription = extractSection(body, 'Description') ?? ''
  const description = rawDescription === '_(empty)_' ? '' : rawDescription
  const rawAcceptanceCriteria = extractSection(body, 'Acceptance Criteria')
  const acceptanceCriteria = rawAcceptanceCriteria === '_(empty)_' ? undefined : rawAcceptanceCriteria

  return { description, acceptanceCriteria }
}

// ── Task location helper (searches all repos as fallback) ────────────────────

/**
 * Resolve the physical file path for a task.
 * Tries `{WORKSPACE_ROOT}/{repo}/kanban/tasks/{taskId}.md` first,
 * then falls back to scanning all discovered repos so that tasks whose
 * YAML `repo:` field differs from their filesystem directory are still found.
 */
function resolveTaskPath(repo: string, taskId: string): { filePath: string; fsRepo: string } | null {
  const primary = resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks', `${taskId}.md`)
  if (existsSync(primary)) return { filePath: primary, fsRepo: repo }

  for (const r of REPOS) {
    if (r === repo) continue
    const alt = resolve(WORKSPACE_ROOT, r, 'kanban', 'tasks', `${taskId}.md`)
    if (existsSync(alt)) return { filePath: alt, fsRepo: r }
  }
  return null
}

// ── Public API ────────────────────────────────────────────────────────────────

export function readTaskFile(filePath: string, repo: string): KanbanTask | null {
  if (!existsSync(filePath)) return null

  try {
    const content = readFileSync(filePath, 'utf-8')
    const { fields, body } = parseFrontmatter(content)

    const id = fields['id']
    if (!id) return null

    const { description, acceptanceCriteria } = extractBodySections(body)

    return {
      id,
      title: fields['title'] || undefined,
      origin: normalizeOrigin(fields['origin'] ?? ''),
      status: normalizeStatus(fields['status'] ?? ''),
      priority: normalizePriority(fields['priority'] ?? ''),
      repo: fields['repo'] || repo,
      description,
      acceptanceCriteria,
      created: fields['created'] || '',
      updated: fields['updated'] || '',
      leadTime: fields['lead_time'] ?? fields['lead-time'] ?? '—',
      completed: fields['completed'] || undefined,
      githubIssueNumber: parseOptionalNumber(fields['github_issue']),
      githubIssueUrl: fields['github_url'] || undefined,
    }
  } catch (error) {
    console.warn(`[kanbanReader] Could not parse ${filePath}:`, error)
    return null
  }
}

export function readAllTasks(includeComments = false): KanbanTask[] {
  const tasks: KanbanTask[] = []

  for (const repo of REPOS) {
    const tasksDir = resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks')
    if (!existsSync(tasksDir)) continue

    try {
      const files = readdirSync(tasksDir).filter((f) => f.endsWith('.md'))
      for (const file of files) {
        const filePath = join(tasksDir, file)
        const task = readTaskFile(filePath, repo)
        if (task) {
          if (includeComments) {
            task.comments = getCommentsForTask(repo, task.id)
          }
          tasks.push(task)
        }
      }
    } catch (error) {
      console.warn(`[kanbanReader] Could not scan ${tasksDir}:`, error)
    }
  }

  return tasks
}

export function readTaskById(
  repo: string,
  taskId: string,
): (KanbanTask & { comments: import('../types/kanban.js').KanbanComment[] }) | null {
  const found = resolveTaskPath(repo, taskId)
  if (!found) return null
  const task = readTaskFile(found.filePath, found.fsRepo)
  if (!task) return null
  return { ...task, comments: getCommentsForTask(found.fsRepo, taskId) }
}

export function findTaskLocation(
  repo: string,
  taskId: string,
): { column: KanbanColumn; filename: string } | null {
  const found = resolveTaskPath(repo, taskId)
  if (!found) return null
  const task = readTaskFile(found.filePath, found.fsRepo)
  if (!task) return null
  return { column: task.status, filename: `tasks/${taskId}.md` }
}

export function countTasksInColumn(column: KanbanColumn, repo?: string): number {
  return readAllTasks(false).filter((task) => task.status === column && (!repo || task.repo === repo)).length
}
