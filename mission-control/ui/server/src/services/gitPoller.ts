// @ts-ignore — simple-git has different default import style between versions
import { simpleGit } from 'simple-git'
import { resolve } from 'path'
import { WORKSPACE_ROOT, REPOS } from '../config.js'
import { insertEvent } from './metricsService.js'

const seenCommits = new Set<string>()
let initialized = false

async function pollRepo(repo: string): Promise<void> {
  const repoPath = resolve(WORKSPACE_ROOT, repo)
  try {
    const git = simpleGit(repoPath)
    const log = await git.log({ '--max-count': '50' } as Parameters<typeof git.log>[0])

    for (const commitRaw of log.all) {
      const commit = commitRaw as unknown as { hash: string; author_name: string; message: string; date: string }
      if (seenCommits.has(commit.hash)) continue
      seenCommits.add(commit.hash)
      if (!initialized) continue // Seed without recording

      insertEvent({
        session_id: 'git-poller',
        timestamp: new Date().toISOString(),
        event_type: 'git_commit',
        workspace: repo,
        status: 'success',
        metadata: JSON.stringify({
          source: 'git-poller',
          commit: commit.hash.slice(0, 7),
          author: commit.author_name,
          message: commit.message.slice(0, 100),
          date: commit.date,
        }),
      })
    }
  } catch {
    // non-blocking — repo may not exist or have no commits
  }
}

export async function startGitPoller(): Promise<void> {
  // Seed seen commits (don't record historical ones)
  await Promise.all(REPOS.map(repo => pollRepo(repo)))
  initialized = true

  // Poll every 5 minutes for new commits
  setInterval(async () => {
    await Promise.all(REPOS.map(repo => pollRepo(repo)))
  }, 5 * 60 * 1000)

  console.info(`[git-poller] Monitoring ${REPOS.length} repos for new commits`)
}
