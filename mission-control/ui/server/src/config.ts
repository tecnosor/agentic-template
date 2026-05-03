import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// server/src → server → ui → mission-control → Github
export const WORKSPACE_ROOT = resolve(__dirname, '../../../../')

// List your workspace repositories here (folder names relative to WORKSPACE_ROOT).
// Add or remove repos to match your actual project structure.
export const REPOS = [
  'demo-backend',
  'demo-frontend',
  'mission-control',
] as const

export type RepoName = (typeof REPOS)[number]

// Set GITHUB_ORG in your .env file to enable GitHub integrations.
export const GITHUB_ORG = process.env.GITHUB_ORG ?? ''
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ''
export const PORT = parseInt(process.env.PORT ?? '3099', 10)

// Map local folder name → GitHub repo name, only when they differ.
// Example: { 'my-service': 'org-my-service' }
export const GITHUB_REPO_MAP: Record<string, string> = {}
export function getGitHubRepoName(repo: string): string {
  return GITHUB_REPO_MAP[repo] ?? repo
}
