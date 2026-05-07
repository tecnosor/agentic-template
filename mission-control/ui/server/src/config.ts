import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Allow explicit override via WORKSPACE_ROOT env var.
// Default: 4 levels up from server/src/ → mission-control/ui/server/src → workspace root.
export const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT
  ? resolve(process.env.WORKSPACE_ROOT)
  : resolve(__dirname, '../../../../')

// Auto-discover repos: any top-level directory that has kanban/tasks/ inside.
// You can still override with REPOS env var (comma-separated): REPOS=my-api,my-frontend
function discoverRepos(): string[] {
  if (process.env.REPOS) {
    return process.env.REPOS.split(',').map(r => r.trim()).filter(Boolean)
  }
  try {
    const entries = readdirSync(WORKSPACE_ROOT, { withFileTypes: true })
    return entries
      .filter(e => e.isDirectory() && existsSync(join(WORKSPACE_ROOT, e.name, 'kanban', 'tasks')))
      .map(e => e.name)
      .sort()
  } catch {
    return []
  }
}

export const REPOS: string[] = discoverRepos()

export type RepoName = string
export type IssueProvider = 'github' | 'gitlab'

function parseRepoMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}

function normalizeIssueProvider(raw: string | undefined): IssueProvider | null {
  if (!raw) return null
  const value = raw.trim().toLowerCase()
  if (value === 'github' || value === 'gitlab') return value
  return null
}

// Set GITHUB_ORG in your .env file to enable GitHub integrations.
export const GITHUB_ORG = process.env.GITHUB_ORG ?? ''
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ''
export const GITHUB_REPO_MAP: Record<string, string> = parseRepoMap(process.env.GITHUB_REPO_MAP)

export const GITLAB_HOST = (process.env.GITLAB_HOST ?? 'https://gitlab.com').replace(/\/$/, '')
export const GITLAB_TOKEN = process.env.GITLAB_TOKEN ?? ''
export const GITLAB_GROUP = process.env.GITLAB_GROUP ?? ''
export const GITLAB_PROJECT_MAP: Record<string, string> = parseRepoMap(process.env.GITLAB_PROJECT_MAP)

const configuredIssueProvider = normalizeIssueProvider(process.env.ISSUE_PROVIDER)
export const ISSUE_PROVIDER: IssueProvider | null = configuredIssueProvider
  ?? (GITHUB_TOKEN ? 'github' : GITLAB_TOKEN ? 'gitlab' : null)

export const PORT = parseInt(process.env.PORT ?? '3099', 10)

// Map local folder name → GitHub repo name, only when they differ.
// Example: { 'my-service': 'org-my-service' }
export function getGitHubRepoName(repo: string): string {
  return GITHUB_REPO_MAP[repo] ?? repo
}

export function getGitLabProjectPath(repo: string): string {
  const mapped = GITLAB_PROJECT_MAP[repo]
  if (mapped) return mapped
  return GITLAB_GROUP ? `${GITLAB_GROUP}/${repo}` : repo
}

export function getIssueProviderLabel(provider: IssueProvider | null): string {
  if (provider === 'gitlab') return 'GitLab'
  if (provider === 'github') return 'GitHub'
  return 'Issue'
}

// ─── Langfuse observability config ───────────────────────────────────────────
// Set these in .env or docker-compose environment.
// For Langfuse Cloud: LANGFUSE_HOST=https://cloud.langfuse.com
// For self-hosted:    LANGFUSE_HOST=http://localhost:3000  (or http://langfuse-web:3000 in compose)
export const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY ?? ''
export const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY ?? ''
export const LANGFUSE_HOST       = process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com'
// UI-facing URL so the Vue app can show a "Open Langfuse" link.
// Defaults to LANGFUSE_HOST, but when running inside compose the internal URL
// (http://langfuse-web:3000) differs from the browser-facing one.
export const LANGFUSE_UI_URL     = process.env.LANGFUSE_UI_URL ?? LANGFUSE_HOST
export const LANGFUSE_ENABLED    = Boolean(LANGFUSE_PUBLIC_KEY && LANGFUSE_SECRET_KEY)
