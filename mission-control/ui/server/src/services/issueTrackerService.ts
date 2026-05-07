import { Octokit } from '@octokit/rest'
import {
  GITHUB_ORG,
  GITHUB_TOKEN,
  GITLAB_HOST,
  GITLAB_TOKEN,
  ISSUE_PROVIDER,
  getGitHubRepoName,
  getGitLabProjectPath,
  getIssueProviderLabel,
} from '../config.js'
import type { IssueProvider } from '../config.js'
import type { KanbanTask } from '../types/kanban.js'
import { updateIssueFields } from './kanbanWriter.js'

const octokit = new Octokit({ auth: GITHUB_TOKEN || undefined })

export interface IssueRef {
  provider: IssueProvider
  number: number
  url: string
}

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
      .map((line) => line.trim())
      .filter(Boolean)
    lines.push(...criteria)
  }

  lines.push('', '---', `*Synced from Kanban board — ${task.id}*`)
  return lines.join('\n')
}

function getLabels(task: KanbanTask): string[] {
  return [
    `priority:${task.priority.toLowerCase()}`,
    `status:${task.status.toLowerCase().replace(/_/g, '-')}`,
    task.origin === '🤖 Agent' ? 'agent' : 'human',
  ]
}

function getConfiguredProvider(): IssueProvider | null {
  if (ISSUE_PROVIDER === 'github' && GITHUB_TOKEN) return 'github'
  if (ISSUE_PROVIDER === 'gitlab' && GITLAB_TOKEN) return 'gitlab'
  if (!ISSUE_PROVIDER) {
    if (GITHUB_TOKEN) return 'github'
    if (GITLAB_TOKEN) return 'gitlab'
  }
  return null
}

function assertConfiguredProvider(): IssueProvider {
  const provider = getConfiguredProvider()
  if (!provider) {
    throw new Error('No issue provider configured. Set ISSUE_PROVIDER plus matching GitHub or GitLab credentials.')
  }
  if (provider === 'github' && !GITHUB_ORG) {
    throw new Error('GITHUB_ORG not set')
  }
  return provider
}

async function createGitHubIssue(task: KanbanTask): Promise<IssueRef> {
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

  return {
    provider: 'github',
    number: response.data.number,
    url: response.data.html_url,
  }
}

async function updateGitHubIssue(task: KanbanTask): Promise<IssueRef> {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set')
  if (!GITHUB_ORG) throw new Error('GITHUB_ORG not set')
  if (!task.issueNumber) throw new Error(`Task ${task.id} has no issue number`)

  const repoName = getGitHubRepoName(task.repo)
  await octokit.rest.issues.update({
    owner: GITHUB_ORG,
    repo: repoName,
    issue_number: task.issueNumber,
    title: formatIssueTitle(task),
    body: formatIssueBody(task),
    state: task.status === 'DONE' ? 'closed' : 'open',
    labels: getLabels(task),
  })

  return {
    provider: 'github',
    number: task.issueNumber,
    url: task.issueUrl ?? `https://github.com/${GITHUB_ORG}/${repoName}/issues/${task.issueNumber}`,
  }
}

async function gitLabRequest<T>(path: string, init: RequestInit): Promise<T> {
  if (!GITLAB_TOKEN) throw new Error('GITLAB_TOKEN not set')

  const response = await fetch(`${GITLAB_HOST}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': GITLAB_TOKEN,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitLab API ${response.status}: ${body || response.statusText}`)
  }

  return response.json() as Promise<T>
}

async function createGitLabIssue(task: KanbanTask): Promise<IssueRef> {
  const projectPath = encodeURIComponent(getGitLabProjectPath(task.repo))
  const response = await gitLabRequest<{ iid: number; web_url: string }>(
    `/api/v4/projects/${projectPath}/issues`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: formatIssueTitle(task),
        description: formatIssueBody(task),
        labels: getLabels(task).join(','),
      }),
    },
  )

  return {
    provider: 'gitlab',
    number: response.iid,
    url: response.web_url,
  }
}

async function updateGitLabIssue(task: KanbanTask): Promise<IssueRef> {
  if (!task.issueNumber) throw new Error(`Task ${task.id} has no issue number`)

  const projectPath = encodeURIComponent(getGitLabProjectPath(task.repo))
  const response = await gitLabRequest<{ iid: number; web_url: string }>(
    `/api/v4/projects/${projectPath}/issues/${task.issueNumber}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        title: formatIssueTitle(task),
        description: formatIssueBody(task),
        labels: getLabels(task).join(','),
        state_event: task.status === 'DONE' ? 'close' : 'reopen',
      }),
    },
  )

  return {
    provider: 'gitlab',
    number: response.iid,
    url: response.web_url,
  }
}

export function getIssueIntegrationConfig(): { provider: IssueProvider | null; enabled: boolean; label: string } {
  const provider = getConfiguredProvider()
  return {
    provider,
    enabled: provider !== null,
    label: getIssueProviderLabel(provider),
  }
}

export async function syncTask(task: KanbanTask): Promise<IssueRef | null> {
  const provider = assertConfiguredProvider()
  const issue = task.issueNumber && task.issueProvider === provider
    ? provider === 'gitlab'
      ? await updateGitLabIssue(task)
      : await updateGitHubIssue(task)
    : provider === 'gitlab'
      ? await createGitLabIssue(task)
      : await createGitHubIssue(task)

  updateIssueFields(task.repo, task.id, issue.provider, issue.number, issue.url)
  return issue
}

export async function syncAllTasks(
  tasks: KanbanTask[],
): Promise<{ created: number; skipped: number; errors: string[]; provider: IssueProvider }> {
  const provider = assertConfiguredProvider()
  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const task of tasks) {
    if (task.issueNumber && task.issueProvider === provider) {
      skipped++
      continue
    }

    try {
      await syncTask(task)
      created++
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${task.repo}/${task.id}: ${message}`)
    }
  }

  return { provider, created, skipped, errors }
}
