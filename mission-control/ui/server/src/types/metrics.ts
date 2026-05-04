export type EventType =
  | 'session_start'
  | 'session_end'
  | 'skill_invoked'
  | 'agent_invoked'
  | 'user_message'
  | 'agent_response'
  | 'task_update'
  | 'task_created'
  | 'task_deleted'
  | 'git_commit'
  | 'context_load'
  | 'tool_call'
  | string // allow future event types from collectors

export interface Session {
  id: string
  started_at: string
  ended_at?: string
  workspace?: string
  model?: string
  total_tokens_input: number
  total_tokens_output: number
  event_count: number
}

export interface MetricEvent {
  id?: number
  session_id: string
  timestamp: string
  event_type: EventType
  workspace?: string
  model?: string
  skill_name?: string
  agent_name?: string
  task_id?: string
  tokens_input?: number
  tokens_output?: number
  context_files_count?: number
  duration_ms?: number
  status?: 'success' | 'error' | 'cancelled'
  metadata?: string
}

export interface SkillStat {
  skill_name: string
  invocations: number
  total_tokens_input: number
  total_tokens_output: number
  avg_duration_ms: number | null
  last_used: string
}

export interface AgentStat {
  agent_name: string
  invocations: number
  total_tokens_input: number
  total_tokens_output: number
  avg_duration_ms: number | null
  last_used: string
}

export interface ModelStat {
  model: string
  sessions: number
  total_tokens_input: number
  total_tokens_output: number
}

export interface DailyTokenStat {
  date: string
  tokens_input: number
  tokens_output: number
  events: number
}

export interface MetricsSummary {
  total_sessions: number
  total_events: number
  total_tokens_input: number
  total_tokens_output: number
  total_skills_invoked: number
  total_agents_invoked: number
  unique_skills: number
  unique_agents: number
  unique_workspaces: number
  unique_models: number
  top_skill: string | null
  top_agent: string | null
  most_used_model: string | null
}
