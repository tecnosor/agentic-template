# Skill: metrics

## Purpose
Track and record all agent/skill activity metrics to the Mission Control metrics API (SQLite via REST).

## When to Activate
- At the start of every conversation (POST session)
- When a skill is invoked (POST event: `skill_invoked`)
- When a subagent is invoked (POST event: `agent_invoked`)
- When a task is updated (POST event: `task_update`)
- When context files are loaded (POST event: `context_load`)
- At the end of a conversation (PATCH session with end time)

## API Base
```
http://localhost:3099/api/metrics
```

> If the server is not running, skip silently. Metrics collection is non-blocking.

---

## Token Estimation
Copilot does not expose actual token counts. Estimate as:
```
tokens = Math.floor(text.length / 4)
```
Use this for `tokens_input` (user messages) and `tokens_output` (agent responses).

---

## Workflow

### 1. Session Start
At the beginning of a conversation, POST a new session:

```http
POST /api/metrics/sessions
Content-Type: application/json

{
  "id": "<uuid>",
  "started_at": "<ISO timestamp>",
  "workspace": "<repo-name or workspace label>",
  "model": "<model name>"
}
```

### 2. Skill Invoked

```http
POST /api/metrics/events
Content-Type: application/json

{
  "session_id": "<session-id>",
  "timestamp": "<ISO timestamp>",
  "event_type": "skill_invoked",
  "skill_name": "<skill-name>",
  "tokens_input": <estimated>,
  "tokens_output": <estimated>,
  "duration_ms": <elapsed if known>,
  "status": "success"
}
```

### 3. Agent Invoked

```http
POST /api/metrics/events
Content-Type: application/json

{
  "session_id": "<session-id>",
  "timestamp": "<ISO timestamp>",
  "event_type": "agent_invoked",
  "agent_name": "<agent-name>",
  "tokens_input": <estimated>,
  "tokens_output": <estimated>,
  "duration_ms": <elapsed if known>,
  "status": "success"
}
```

### 4. Task Update

```http
POST /api/metrics/events
Content-Type: application/json

{
  "session_id": "<session-id>",
  "timestamp": "<ISO timestamp>",
  "event_type": "task_update",
  "task_id": "<task-id>",
  "status": "in-progress | completed | blocked"
}
```

### 5. Session End

```http
PATCH /api/metrics/sessions/<session-id>
Content-Type: application/json

{ "ended_at": "<ISO timestamp>" }
```

---

## Batch Events

```http
POST /api/metrics/events/batch
Content-Type: application/json

[
  { "session_id": "...", "event_type": "skill_invoked", ... },
  { "session_id": "...", "event_type": "agent_invoked", ... }
]
```

---

## Query Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/metrics/summary` | Overall totals |
| `GET /api/metrics/skills` | Per-skill usage |
| `GET /api/metrics/agents` | Per-agent usage |
| `GET /api/metrics/models` | Per-model stats |
| `GET /api/metrics/tokens/daily?days=30` | Daily trend |
| `GET /api/metrics/events?limit=50` | Recent events |
| `GET /api/metrics/sessions` | Recent sessions |
| `GET /api/metrics/export` | Full JSON export |

---

## Error Handling
Metrics are supplemental. Never block actual work — wrap all POSTs in try/catch.

## Dashboard
View at: **http://localhost:3099** → 📊 Metrics tab.
