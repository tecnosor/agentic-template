import { existsSync } from 'fs'
import { dirname, relative, resolve } from 'path'
import { simpleGit } from 'simple-git'
import { WORKSPACE_ROOT } from '../config.js'

const DEFAULT_GIT_AUTHOR_NAME = process.env.MISSION_CONTROL_GIT_AUTHOR_NAME ?? 'Mission Control'
const DEFAULT_GIT_AUTHOR_EMAIL = process.env.MISSION_CONTROL_GIT_AUTHOR_EMAIL ?? 'mission-control@local.invalid'

function findGitRoot(startPath: string): string | null {
  let current = resolve(startPath)
  const workspaceRoot = resolve(WORKSPACE_ROOT)

  while (current.startsWith(workspaceRoot)) {
    if (existsSync(resolve(current, '.git'))) return current
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }

  if (existsSync(resolve(workspaceRoot, '.git'))) return workspaceRoot
  return null
}

function resolveGitContext(repo: string): { gitRoot: string | null; kanbanPathspec: string } {
  const repoPath = resolve(WORKSPACE_ROOT, repo)
  const gitRoot = findGitRoot(repoPath)

  if (!gitRoot) {
    return { gitRoot: null, kanbanPathspec: resolve(repoPath, 'kanban') }
  }

  const kanbanPathspec = relative(gitRoot, resolve(repoPath, 'kanban')).replace(/\\/g, '/') || 'kanban'
  return { gitRoot, kanbanPathspec }
}

function isRecoverableGitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('spawn git ENOENT') || message.includes('not a git repository')
}

/**
 * Stage kanban/ changes and commit + push for a given repo.
 * Silently skips push if there is nothing new to commit.
 */
export async function commitAndPush(repo: string, message: string): Promise<void> {
  const { gitRoot, kanbanPathspec } = resolveGitContext(repo)
  if (!gitRoot) {
    console.info(`[git] Skipping commit for ${repo}: no git worktree found under ${WORKSPACE_ROOT}`)
    return
  }

  const git = simpleGit(gitRoot)

  try {
    await git.add(['--', kanbanPathspec])

    const staged = await git.diffSummary(['--cached', '--', kanbanPathspec])
    if (staged.files.length === 0) {
      console.info(`[git] Nothing to commit in ${repo}`)
      return
    }

    await git.raw([
      '-c', `user.name=${DEFAULT_GIT_AUTHOR_NAME}`,
      '-c', `user.email=${DEFAULT_GIT_AUTHOR_EMAIL}`,
      'commit',
      '-m',
      message,
    ])

    const remotes = await git.getRemotes()
    if (remotes.length === 0) {
      console.info(`[git] Committed locally (no remote configured): ${message} (${repo})`)
      return
    }

    try {
      await git.push()
      console.info(`[git] Committed and pushed: ${message} (${repo})`)
    } catch (pushError) {
      console.warn(`[git] Commit created but push skipped in ${repo}:`, pushError)
    }
  } catch (error) {
    if (isRecoverableGitError(error)) {
      console.warn(`[git] Skipping commit/push in ${repo}:`, error)
      return
    }

    console.error(`[git] Failed to commit/push in ${repo}:`, error)
    throw error
  }
}

/**
 * Return the current HEAD branch name for a repo.
 * Falls back to 'develop' if detection fails.
 */
export async function getCurrentBranch(repo: string): Promise<string> {
  try {
    const { gitRoot } = resolveGitContext(repo)
    if (!gitRoot) return 'develop'

    const git = simpleGit(gitRoot)
    const result = await git.revparse(['--abbrev-ref', 'HEAD'])
    return result.trim()
  } catch {
    return 'develop'
  }
}
