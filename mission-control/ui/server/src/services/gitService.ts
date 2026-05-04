import { simpleGit } from 'simple-git'
import { resolve } from 'path'
import { WORKSPACE_ROOT } from '../config.js'

/**
 * Stage kanban/ changes and commit + push for a given repo.
 * Silently skips push if there is nothing new to commit.
 */
export async function commitAndPush(repo: string, message: string): Promise<void> {
  const repoPath = resolve(WORKSPACE_ROOT, repo)
  const git = simpleGit(repoPath)

  try {
    // Stage only kanban directory (comments.json + markdown files)
    await git.add(['kanban/'])

    const status = await git.status()
    if (status.staged.length === 0) {
      console.info(`[git] Nothing to commit in ${repo}`)
      return
    }

    await git.commit(message)
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
    const git = simpleGit(resolve(WORKSPACE_ROOT, repo))
    const result = await git.revparse(['--abbrev-ref', 'HEAD'])
    return result.trim()
  } catch {
    return 'develop'
  }
}
