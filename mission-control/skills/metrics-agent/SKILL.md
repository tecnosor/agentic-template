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
  "model": "<model name, e.g. Claude Sonnet 4.5>"
}
```

Store the session ID for all subsequent events.

### 2. Skill Invoked
When any skill is activated:

```http
POST /api/metrics/events
Content-Type: application/json

{
  "session_id": "<session-id>",
  "timestamp": "<ISO timestamp>",
  "event_type": "skill_invoked",
  "skill_name": "<skill-name>",
  "workspace": "<workspace>",
  "model": "<model>",
  "tokens_input": <estimated>,
  "tokens_output": <estimated>,
  "duration_ms": <elapsed if known>,
  "status": "success"
}
```

### 3. Agent Invoked
When runSubagent or an agent is called:

```http
POST /api/metrics/events
Content-Type: application/json

{
  "session_id": "<session-id>",
  "timestamp": "<ISO timestamp>",
  "event_type": "agent_invoked",
  "agent_name": "<agent-name>",
  "workspace": "<workspace>",
  "model": "<model>",
  "tokens_input": <estimated>,
  "tokens_output": <estimated>,
  "duration_ms": <elapsed if known>,
  "status": "success"
}
```

### 4. Task Update
When a kanban task changes status:

```http
POST /api/metrics/events
Content-Type: application/json

{
  "session_id": "<session-id>",
  "timestamp": "<ISO timestamp>",
  "event_type": "task_update",
  "task_id": "<FEAT-001 or kanban ID>",
  "workspace": "<workspace>",
  "status": "in-progress | completed | blocked"
}
```

### 5. Session End
When the conversation ends (best effort):

```http
PATCH /api/metrics/sessions/<session-id>
Content-Type: application/json

{
  "ended_at": "<ISO timestamp>"
}
```

---

## Batch Events
For efficiency, use the batch endpoint to send multiple events at once:

```http
POST /api/metrics/events/batch
Content-Type: application/json

[
  { "session_id": "...", "event_type": "skill_invoked", ... },
  { "session_id": "...", "event_type": "context_load", ... }
]
```

---

## Querying Metrics
The following read endpoints are available for reporting:

| Endpoint | Description |
|----------|-------------|
| `GET /api/metrics/summary` | Overall totals |
| `GET /api/metrics/skills` | Per-skill token usage |
| `GET /api/metrics/agents` | Per-agent token usage |
| `GET /api/metrics/models` | Per-model stats |
| `GET /api/metrics/tokens/daily?days=30` | Daily token trend |
| `GET /api/metrics/events?limit=50` | Recent events feed |
| `GET /api/metrics/sessions` | Recent sessions |
| `GET /api/metrics/export` | Full JSON export |

---

## Error Handling
- If the server returns non-2xx, log a warning but **do not fail the task**
- Metrics are supplemental — never block actual work
- Use `try/catch` or equivalent around all metric POSTs

---

## Dashboard
View all metrics at: **http://localhost:3099** → click the 📊 Metrics tab.
