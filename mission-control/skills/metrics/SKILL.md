# Skill: metrics

## Purpose
Track and record all agent/skill activity metrics to the Mission Control API,
which bridges transparently to **Langfuse** for persistent observability.

## Architecture
```
Agent  →  POST http://localhost:3099/api/metrics/*  →  Mission Control  →  Langfuse
                                                              │
                                                         In-memory feed (SSE)
                                                         for live dashboard
```

Agents never need Langfuse credentials — Mission Control handles the bridge.

## Automatic Collection
- **Kanban task changes** — `kanban-watcher` detects file changes in `*/kanban/tasks/*.md`
- **Git commits** — `git-poller` polls every 5 minutes; git hook fires on each commit
- **Dashboard** auto-refreshes via Server-Sent Events

## When to Activate (manual agent events)
- **Session start**: at the beginning of every conversation
- **Skill invoked**: whenever a skill is activated
- **Agent invoked**: when a sub-agent is called
- **Task update**: when a kanban task status changes
- **Context load**: when skill/file context is loaded
- **Session end**: at the end of the conversation (best effort)

## API Base
```
http://localhost:3099/api/metrics
```
> If the server is not running, skip silently. Never block real work.

---

## Token Estimation
Agents do not expose real token counts. Estimate:
```
tokens_input  = Math.floor(userMessage.length   / 4)
tokens_output = Math.floor(agentResponse.length / 4)
```

---

## Workflow

### 1. Session Start
```bash
curl -s -X POST http://localhost:3099/api/metrics/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "id":         "<uuid>",
    "started_at": "<ISO8601>",
    "workspace":  "<repo-name>",
    "model":      "<model-name>"
  }'
```
Store the `id` for all subsequent events.

### 2. Skill Invoked
```bash
curl -s -X POST http://localhost:3099/api/metrics/events \
  -H "Content-Type: application/json" \
  -d '{
    "session_id":    "<session-id>",
    "timestamp":     "<ISO8601>",
    "event_type":    "skill_invoked",
    "skill_name":    "<skill-name>",
    "workspace":     "<workspace>",
    "model":         "<model>",
    "tokens_input":  <n>,
    "tokens_output": <n>,
    "duration_ms":   <n>,
    "status":        "success"
  }'
```

### 3. Agent Invoked
```bash
curl -s -X POST http://localhost:3099/api/metrics/events \
  -H "Content-Type: application/json" \
  -d '{
    "session_id":    "<session-id>",
    "timestamp":     "<ISO8601>",
    "event_type":    "agent_invoked",
    "agent_name":    "<agent-name>",
    "workspace":     "<workspace>",
    "model":         "<model>",
    "tokens_input":  <n>,
    "tokens_output": <n>,
    "duration_ms":   <n>,
    "status":        "success"
  }'
```

### 4. Task Update
```bash
curl -s -X POST http://localhost:3099/api/metrics/events \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<session-id>",
    "timestamp":  "<ISO8601>",
    "event_type": "task_update",
    "task_id":    "<FEAT-001>",
    "workspace":  "<workspace>",
    "status":     "success"
  }'
```

### 5. Batch Events (preferred)
```bash
curl -s -X POST http://localhost:3099/api/metrics/events/batch \
  -H "Content-Type: application/json" \
  -d '[
    { "session_id": "...", "event_type": "skill_invoked", "skill_name": "kanban-sync", ... },
    { "session_id": "...", "event_type": "task_update",   "task_id": "FEAT-042", ... }
  ]'
```

### 6. Session End
```bash
curl -s -X PATCH http://localhost:3099/api/metrics/sessions/<id> \
  -H "Content-Type: application/json" \
  -d '{ "ended_at": "<ISO8601>" }'
```

---

## Query Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/metrics/summary` | Totals for current server run |
| `GET /api/metrics/skills` | Per-skill stats |
| `GET /api/metrics/agents` | Per-agent stats |
| `GET /api/metrics/models` | Per-model stats |
| `GET /api/metrics/tokens/daily?days=30` | Daily token trend |
| `GET /api/metrics/events?limit=50` | Recent events |
| `GET /api/metrics/sessions` | Recent sessions |
| `GET /api/langfuse/config` | Langfuse URL + enabled status |

---

## Full Analytics in Langfuse
For persistent history, cost breakdown, latency, and advanced analytics:
- Open `GET /api/langfuse/config` to get the Langfuse UI URL
- Or use the **🔍 Traces** tab in the Mission Control UI

---

## Error Handling
Metrics are supplemental. Never block actual work — wrap all calls in try/catch.

## Dashboard
Mission Control UI → **📊 Metrics** tab (in-session summary)
Mission Control UI → **🔍 Traces** tab (full Langfuse observability)

## Automatic Collection
The following are recorded **automatically** without agent action:
- **Kanban task changes** — `kanban-watcher` detects file changes in `*/kanban/tasks/*.md`
- **Git commits** — `git-poller` detects new commits every 5 minutes; `git-hook` fires on each commit (requires `setup-git-hooks.sh`)
- **Dashboard** auto-refreshes via Server-Sent Events (SSE) when the server is running

Agents should record the following **manually** during their work:

## When to Activate (manual agent events)
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

> Default local dev endpoint. If your Mission Control server runs elsewhere, update the host/port accordingly.
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

## Hook Reporter (CLI helper)

Agents can also call the hook reporter via bash for quick event recording:

```bash
node .opencode/hooks/metrics-reporter.js skill_invoked '{"skill_name":"code-review","tokens_input":1200}'
node .opencode/hooks/metrics-reporter.js agent_invoked '{"agent_name":"builder","tokens_input":800}'
```

---

## Error Handling
Metrics are supplemental. Never block actual work — wrap all POSTs in try/catch.

## Dashboard
View at: **http://localhost:5174** → **Metrics** tab (API stays on port `3099` by default).
