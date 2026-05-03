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
  githubIssueNumber?: number
  githubIssueUrl?: string
}

