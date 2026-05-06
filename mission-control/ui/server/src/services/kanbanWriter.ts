import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { WORKSPACE_ROOT, REPOS } from '../config.js'
import type { KanbanColumn, KanbanComment, KanbanTaskDraft } from '../types/kanban.js'
import type { IssueProvider } from '../config.js'

// ── Comments sidecar (kanban/comments.json) ───────────────────────────────────

function getCommentsPath(repo: string): string {
  return resolve(WORKSPACE_ROOT, repo, 'kanban', 'comments.json')
}

export function getTaskFilePath(repo: string, taskId: string): string {
  return resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks', `${taskId}.md`)
}

function resolveExistingTaskFilePath(repo: string, taskId: string): string | null {
  const primary = getTaskFilePath(repo, taskId)
  if (existsSync(primary)) return primary

  for (const discoveredRepo of REPOS) {
    if (discoveredRepo === repo) continue
    const candidate = getTaskFilePath(discoveredRepo, taskId)
    if (existsSync(candidate)) return candidate
  }

  return null
}

function readCommentsFile(repo: string): Record<string, KanbanComment[]> {
  const path = getCommentsPath(repo)
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, KanbanComment[]>
  } catch {
    return {}
  }
}

export function getCommentsForTask(repo: string, taskId: string): KanbanComment[] {
  return readCommentsFile(repo)[taskId] ?? []
}

export function addComment(repo: string, taskId: string, comment: KanbanComment): void {
  const data = readCommentsFile(repo)
  if (!data[taskId]) data[taskId] = []
  data[taskId].push(comment)
  writeFileSync(getCommentsPath(repo), JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

// ── Move task ─────────────────────────────────────────────────────────────────

/**
 * Update the task's status in its individual YAML frontmatter file.
 * Tasks live at kanban/tasks/{taskId}.md.
 */
export function moveTask(repo: string, taskId: string, targetColumn: KanbanColumn): string {
  let filePath = getTaskFilePath(repo, taskId)

  // Fallback: if task isn't in the given repo dir, search all discovered repos.
  // This handles the case where the task YAML `repo:` field differs from its
  // filesystem directory (e.g., agent wrote to demo-backend/ but set repo: my-project).
  if (!existsSync(filePath)) {
    for (const r of REPOS) {
      if (r === repo) continue
      const alt = getTaskFilePath(r, taskId)
      if (existsSync(alt)) {
        filePath = alt
        break
      }
    }
  }

  if (!existsSync(filePath)) {
    throw new Error(`Task ${taskId} not found in any repo (looked in ${repo} and ${REPOS.length} discovered repos)`)
  }

  const content = readFileSync(filePath, 'utf-8')
  const today = new Date().toISOString().split('T')[0]!

  // Replace the status and updated fields in YAML frontmatter
  const updated = content
    .replace(/^status:.*$/m, `status: ${targetColumn}`)
    .replace(/^updated:.*$/m, `updated: ${today}`)

  writeFileSync(filePath, updated, 'utf-8')
  return `tasks/${taskId}.md`
}

// ── GitHub Issue number persistence ──────────────────────────────────────────

export function updateGitHubIssueFields(
  repo: string,
  taskId: string,
  issueNumber: number,
  issueUrl: string,
): void {
  updateIssueFields(repo, taskId, 'github', issueNumber, issueUrl)
}

export function updateIssueFields(
  repo: string,
  taskId: string,
  provider: IssueProvider,
  issueNumber: number,
  issueUrl: string,
): void {
  const filePath = resolveExistingTaskFilePath(repo, taskId)
  if (!filePath || !existsSync(filePath)) return

  const content = readFileSync(filePath, 'utf-8')

  const setYamlField = (source: string, key: string, value: string): string => {
    const pattern = new RegExp(`^${key}:.*$`, 'm')
    if (pattern.test(source)) {
      return source.replace(pattern, `${key}: ${value}`)
    }
    return source.replace(/^(---\n)/, `$1${key}: ${value}\n`)
  }

  let updated = content
  updated = setYamlField(updated, 'issue_provider', provider)
  updated = setYamlField(updated, 'issue_number', String(issueNumber))
  updated = setYamlField(updated, 'issue_url', `"${issueUrl}"`)

  if (provider === 'github') {
    updated = setYamlField(updated, 'github_issue', String(issueNumber))
    updated = setYamlField(updated, 'github_url', `"${issueUrl}"`)
  }

  writeFileSync(filePath, updated, 'utf-8')
}

export function createTask(repo: string, task: KanbanTaskDraft): string {
  const tasksDir = resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks')
  mkdirSync(tasksDir, { recursive: true })

  const filePath = getTaskFilePath(repo, task.id)
  if (existsSync(filePath)) {
    throw new Error(`Task ${task.id} already exists in ${repo}`)
  }

  const today = new Date().toISOString().slice(0, 10)
  const body = [
    '---',
    `id: ${task.id}`,
    `title: "${task.title.replace(/"/g, '\\"')}"`,
    `status: ${task.status}`,
    `origin: "${task.origin}"`,
    `priority: ${task.priority}`,
    `repo: ${task.repo}`,
    `created: ${today}`,
    `updated: ${today}`,
    '---',
    '',
    '## Description',
    '',
    task.description.trim() || '_(empty)_',
    '',
    '## Acceptance Criteria',
    '',
    task.acceptanceCriteria?.trim() || '_(empty)_',
    '',
  ].join('\n')

  writeFileSync(filePath, `${body}\n`, 'utf-8')
  return `tasks/${task.id}.md`
}
