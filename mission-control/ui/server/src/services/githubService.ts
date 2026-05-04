import { Octokit } from '@octokit/rest'
import { GITHUB_ORG, GITHUB_TOKEN, getGitHubRepoName } from '../config.js'
import type { KanbanTask } from '../types/kanban.js'
import { updateGitHubIssueFields } from './kanbanWriter.js'

const octokit = new Octokit({ auth: GITHUB_TOKEN || undefined })

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatIssueTitle(task: KanbanTask): string {
  const title = task.title ?? task.description.slice(0, 80)
  return `[${task.id}] ${title}`
}

function formatIssueBody(task: KanbanTask): string {
  const lines: string[] = [
    `**Status:** ${task.status}`,
    `**Priority:** ${task.priority}`,
    `**Origin:** ${task.origin}`,
    `**Repo:** ${task.repo}`,
    '',
    '## Description',
    '',
    task.description,
  ]

  if (task.acceptanceCriteria) {
    lines.push('', '## Acceptance Criteria', '')
    const criteria = task.acceptanceCriteria
      .replace(/<br\s*\/?>/gi, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    lines.push(...criteria)
  }

  lines.push('', `---`, `*Synced from Kanban board — ${task.id}*`)
  return lines.join('\n')
}

function getLabels(task: KanbanTask): string[] {
  return [
    `priority:${task.priority.toLowerCase()}`,
    `status:${task.status.toLowerCase().replace(/_/g, '-')}`,
    task.origin === '🤖 Agent' ? 'agent' : 'human',
  ]
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface IssueRef {
  number: number
  url: string
}

export async function createIssue(task: KanbanTask): Promise<IssueRef> {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set')
  if (!GITHUB_ORG) throw new Error('GITHUB_ORG not set')
  const repoName = getGitHubRepoName(task.repo)

  const response = await octokit.rest.issues.create({
    owner: GITHUB_ORG,
    repo: repoName,
    title: formatIssueTitle(task),
    body: formatIssueBody(task),
    labels: getLabels(task),
  })

  const ref: IssueRef = { number: response.data.number, url: response.data.html_url }

  // Persist issue number in the kanban markdown file
  updateGitHubIssueFields(task.repo, task.id, ref.number, ref.url)

  return ref
}

export async function updateIssue(
  repo: string,
  issueNumber: number,
  task: KanbanTask,
): Promise<void> {
  if (!GITHUB_TOKEN) return
  const repoName = getGitHubRepoName(repo)

  await octokit.rest.issues.update({
    owner: GITHUB_ORG,
    repo: repoName,
    issue_number: issueNumber,
    title: formatIssueTitle(task),
    body: formatIssueBody(task),
    state: task.status === 'DONE' ? 'closed' : 'open',
    labels: getLabels(task),
  })
}

export async function addIssueComment(
  repo: string,
  issueNumber: number,
  body: string,
): Promise<void> {
  if (!GITHUB_TOKEN) return
  await octokit.rest.issues.createComment({
    owner: GITHUB_ORG,
    repo: getGitHubRepoName(repo),
    issue_number: issueNumber,
    body,
  })
}

/**
 * Sync all tasks that do not yet have a GitHub Issue.
 * Returns a summary of how many issues were created / skipped.
 */
export async function syncAllTasks(
  tasks: KanbanTask[],
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const task of tasks) {
    if (task.githubIssueNumber) {
      skipped++
      continue
    }
    try {
      await createIssue(task)
      created++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${task.repo}/${task.id}: ${msg}`)
    }
  }

  return { created, skipped, errors }
}

/**
 * Sync a single task (create or update its GitHub Issue).
 */
export async function syncTask(task: KanbanTask): Promise<IssueRef | null> {
  if (!GITHUB_TOKEN) return null
  if (task.githubIssueNumber) {
    await updateIssue(task.repo, task.githubIssueNumber, task)
    return { number: task.githubIssueNumber, url: task.githubIssueUrl ?? '' }
  }
  return createIssue(task)
}
