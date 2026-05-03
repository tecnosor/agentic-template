import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { WORKSPACE_ROOT } from '../config.js'
import type { KanbanColumn, KanbanComment } from '../types/kanban.js'

// ── Comments sidecar (kanban/comments.json) ───────────────────────────────────

function getCommentsPath(repo: string): string {
  return resolve(WORKSPACE_ROOT, repo, 'kanban', 'comments.json')
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
  const filePath = resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks', `${taskId}.md`)

  if (!existsSync(filePath)) {
    throw new Error(`Task ${taskId} not found: ${filePath}`)
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
  const filePath = resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks', `${taskId}.md`)
  if (!existsSync(filePath)) return

  const content = readFileSync(filePath, 'utf-8')
  // Inject or update github_issue and github_url in the YAML frontmatter
  const ghIssuePattern = /^github_issue:.*$/m
  const ghUrlPattern = /^github_url:.*$/m

  let updated = content
  if (ghIssuePattern.test(updated)) {
    updated = updated.replace(ghIssuePattern, `github_issue: ${issueNumber}`)
  } else {
    updated = updated.replace(/^(---\n)/, `$1github_issue: ${issueNumber}\n`)
  }
  if (ghUrlPattern.test(updated)) {
    updated = updated.replace(ghUrlPattern, `github_url: "${issueUrl}"`)
  } else {
    updated = updated.replace(/^(---\n)/, `$1github_url: "${issueUrl}"\n`)
  }

  writeFileSync(filePath, updated, 'utf-8')
}
