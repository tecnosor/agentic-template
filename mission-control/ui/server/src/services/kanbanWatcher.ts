import chokidar from 'chokidar'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { WORKSPACE_ROOT, REPOS } from '../config.js'
import { insertEvent } from './metricsService.js'

function taskIdFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, '')
}

function statusFromContent(content: string): string {
  const m =
    content.match(/^\|\s*\*\*Status\*\*\s*\|\s*([^|\n]+)\s*\|/m) ||
    content.match(/^status:\s*(.+)$/im) ||
    content.match(/^##\s+(done|in[- ]progress|todo|backlog|blocked)/im)
  return m ? m[1].trim().toLowerCase() : 'updated'
}

export function startKanbanWatcher(): void {
  const taskDirectories = REPOS.map(repo =>
    resolve(WORKSPACE_ROOT, repo, 'kanban', 'tasks'),
  )

  const watcher = chokidar.watch(taskDirectories, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    ignored: (filePath, stats) => Boolean(stats?.isFile() && !filePath.endsWith('.md')),
  })

  const handle = (ev: 'add' | 'change' | 'unlink', filePath: string): void => {
    try {
      const filename = filePath.split('/').pop() ?? filePath
      const taskId = taskIdFromFilename(filename)
      const repo = REPOS.find(r => filePath.includes(`/${r}/`)) ?? 'workspace'

      if (ev === 'unlink') {
        insertEvent({
          session_id: 'kanban-watcher',
          timestamp: new Date().toISOString(),
          event_type: 'task_deleted',
          workspace: repo,
          task_id: taskId,
          status: 'success',
          metadata: JSON.stringify({ source: 'kanban-watcher' }),
        })
        return
      }

      const content = readFileSync(filePath, 'utf8')
      const taskStatus = statusFromContent(content)

      insertEvent({
        session_id: 'kanban-watcher',
        timestamp: new Date().toISOString(),
        event_type: ev === 'add' ? 'task_created' : 'task_update',
        workspace: repo,
        task_id: taskId,
        status: 'success',
        metadata: JSON.stringify({ source: 'kanban-watcher', task_status: taskStatus }),
      })
    } catch {
      // non-blocking — file may have been removed
    }
  }

  watcher.on('add', (p: string) => handle('add', p))
  watcher.on('change', (p: string) => handle('change', p))
  watcher.on('unlink', (p: string) => handle('unlink', p))

  console.info(`[kanban-watcher] Watching ${REPOS.length} repos for task changes`)
}
