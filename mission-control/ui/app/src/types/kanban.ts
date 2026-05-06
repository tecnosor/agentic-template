export type KanbanColumn =
  | 'BACKLOG'
  | 'TODO'
  | 'READY'
  | 'DOING'
  | 'TESTING'
  | 'HUMAN_VALIDATION'
  | 'DONE'

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type Origin = '👤 Human' | '🤖 Agent'
export type IssueProvider = 'github' | 'gitlab'

export interface KanbanComment {
  author: Origin
  authorName?: string
  date: string
  text: string
}

export interface KanbanTask {
  id: string
  title?: string
  origin: Origin
  status: KanbanColumn
  priority: Priority
  repo: string
  description: string
  acceptanceCriteria?: string
  created: string
  updated: string
  leadTime?: string
  completed?: string
  comments?: KanbanComment[]
  issueProvider?: IssueProvider
  issueNumber?: number
  issueUrl?: string
  githubIssueNumber?: number
  githubIssueUrl?: string
}

export interface KanbanTaskDraft {
  id: string
  title: string
  origin: Origin
  status: KanbanColumn
  priority: Priority
  repo: string
  description: string
  acceptanceCriteria?: string
}

export const COLUMNS: KanbanColumn[] = [
  'BACKLOG',
  'TODO',
  'READY',
  'DOING',
  'TESTING',
  'HUMAN_VALIDATION',
  'DONE',
]

export const COLUMN_LABELS: Record<KanbanColumn, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  READY: 'Ready',
  DOING: 'Doing',
  TESTING: 'Testing',
  HUMAN_VALIDATION: 'Human Validation',
  DONE: 'Done',
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; classes: string }> = {
  CRITICAL: { label: 'CRITICAL', classes: 'bg-red-950 text-red-400 border-red-700' },
  HIGH: { label: 'HIGH', classes: 'bg-orange-950 text-orange-400 border-orange-700' },
  MEDIUM: { label: 'MEDIUM', classes: 'bg-yellow-950 text-yellow-400 border-yellow-700' },
  LOW: { label: 'LOW', classes: 'bg-slate-800 text-slate-400 border-slate-600' },
}

export const COLUMN_CONFIG: Record<
  KanbanColumn,
  { topColor: string; badge: string; description: string }
> = {
  BACKLOG: {
    topColor: 'border-t-slate-500',
    badge: 'bg-slate-700 text-slate-300',
    description: 'Ideas & future work',
  },
  TODO: {
    topColor: 'border-t-blue-500',
    badge: 'bg-blue-900 text-blue-300',
    description: 'Committed work',
  },
  READY: {
    topColor: 'border-t-cyan-500',
    badge: 'bg-cyan-900 text-cyan-300',
    description: 'Ready to pick up',
  },
  DOING: {
    topColor: 'border-t-amber-500',
    badge: 'bg-amber-900 text-amber-300',
    description: '⚠️ Max 2 tasks',
  },
  TESTING: {
    topColor: 'border-t-purple-500',
    badge: 'bg-purple-900 text-purple-300',
    description: 'Under testing',
  },
  HUMAN_VALIDATION: {
    topColor: 'border-t-rose-500',
    badge: 'bg-rose-900 text-rose-300',
    description: 'Awaiting review',
  },
  DONE: {
    topColor: 'border-t-green-500',
    badge: 'bg-green-900 text-green-300',
    description: 'Append-only ✓',
  },
}
