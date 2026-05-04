# Metrics System — Mission Control

Usage metrics system. Tracks token usage, skill invocations, agent calls, sessions, and task lifecycle — stored in SQLite, queryable via REST, visualized in the Vue dashboard.

---

## Architecture

```
mission-control/
├── metrics/
│   ├── workspace-metrics.db    ← SQLite database (git-ignored)
│   ├── .gitignore
│   ├── .gitkeep
│   └── README.md               ← This file
└── ui/
    ├── server/src/services/metricsService.ts  ← DB service
    ├── server/src/routes/metrics.ts           ← REST API
    └── app/src/
        ├── stores/metricsStore.ts             ← Pinia store
        └── components/MetricsDashboard.vue    ← Dashboard UI
```

---

## Database Schema

### `sessions` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PRIMARY KEY | UUID |
| `started_at` | TEXT | ISO timestamp |
| `ended_at` | TEXT | ISO timestamp or NULL |
| `workspace` | TEXT | Repo / workspace label |
| `model` | TEXT | Model name |
| `total_tokens_input` | INTEGER | Accumulated input tokens |
| `total_tokens_output` | INTEGER | Accumulated output tokens |
| `event_count` | INTEGER | Total events in session |

### `events` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `session_id` | TEXT | FK → sessions.id |
| `timestamp` | TEXT | ISO timestamp |
| `event_type` | TEXT | See event types below |
| `skill_name` | TEXT | Skill (if skill_invoked) |
| `agent_name` | TEXT | Agent (if agent_invoked) |
| `task_id` | TEXT | Task ID (if task_update) |
| `model` | TEXT | Model used |
| `tokens_input` | INTEGER | Input tokens (estimated) |
| `tokens_output` | INTEGER | Output tokens (estimated) |
| `duration_ms` | INTEGER | Operation duration |
| `context_files_count` | INTEGER | Number of loaded context files |
| `metadata` | TEXT | JSON blob for extra data |

### Event Types

| `event_type` | When to use |
|---|---|
| `skill_invoked` | A `/skill` or `@skill` is activated |
| `agent_invoked` | A subagent is launched via `runSubagent` |
| `task_update` | Kanban task status changes |
| `task_deleted` | Kanban task file removed |
| `context_load` | Context files are read/loaded |
| `user_message` | User sends a new message |
| `agent_response` | Agent completes a response |
| `tool_call` | Any tool is called |
| `session_start` | Session begins |
| `session_end` | Session ends |
| `task_created` | New kanban task file created |
| `git_commit` | Git commit detected by poller or hook |

---

## REST API

Server runs at: `http://localhost:3099`

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/metrics/sessions` | Create session |
| `PATCH` | `/api/metrics/sessions/:id` | Update (set ended_at) |
| `GET` | `/api/metrics/sessions` | List sessions |
| `GET` | `/api/metrics/sessions/:id` | Session by ID |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/metrics/events` | Record single event |
| `POST` | `/api/metrics/events/batch` | Record multiple events |
| `GET` | `/api/metrics/events?limit=50` | Recent events |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/metrics/summary` | Overall totals |
| `GET` | `/api/metrics/skills` | Per-skill usage |
| `GET` | `/api/metrics/agents` | Per-agent usage |
| `GET` | `/api/metrics/models` | Per-model stats |
| `GET` | `/api/metrics/tokens/daily?days=30` | Daily trend |
| `GET` | `/api/metrics/export` | Full JSON export |

---

## Example API Calls

```bash
# Create session
curl -s -X POST http://localhost:3099/api/metrics/sessions \
  -H "Content-Type: application/json" \
  -d '{"id":"sess-001","started_at":"2026-01-01T10:00:00Z","workspace":"mission-control","model":"claude-sonnet-4-5"}'

# Record a skill invocation
curl -s -X POST http://localhost:3099/api/metrics/events \
  -H "Content-Type: application/json" \
  -d '{"session_id":"sess-001","timestamp":"2026-01-01T10:01:00Z","event_type":"skill_invoked","skill_name":"secure-coder","tokens_input":240,"tokens_output":180,"duration_ms":3200,"status":"success"}'

# Get summary
curl -s http://localhost:3099/api/metrics/summary | python3 -m json.tool

# Get top skills
curl -s http://localhost:3099/api/metrics/skills

# End session
curl -s -X PATCH http://localhost:3099/api/metrics/sessions/sess-001 \
  -H "Content-Type: application/json" \
  -d '{"ended_at":"2026-01-01T11:30:00Z"}'
```

---

## Token Estimation

Copilot does not expose raw token counts. Estimate using:

```
tokens = Math.floor(text.length / 4)
```

This is a rough approximation (~4 chars per token for English/code). Actual counts will vary by model.

---

## Viewing the Dashboard

1. Start the dev server:
   ```bash
   cd mission-control/ui
   npm run dev
   ```
2. Open: **http://localhost:5174**
3. Click the **📊 Metrics** tab

The dashboard shows:
- Summary cards (tokens / sessions / skills / agents)
- 30-day daily token bar chart
- Skills, Agents, Models usage tables
- Recent sessions and events feed

---

## CLI Report

```bash
# Quick report (server or sqlite3 fallback)
cd mission-control
./scripts/metrics-report.sh

# Last 7 days
./scripts/metrics-report.sh --days 7

# Full JSON export
./scripts/metrics-report.sh --json
```

---

## Direct SQLite Queries

```bash
DB="mission-control/metrics/workspace-metrics.db"

# Summary
sqlite3 $DB "SELECT COUNT(*) as sessions FROM sessions;"
sqlite3 $DB "SELECT SUM(tokens_input+tokens_output) as total_tokens FROM events;"

# Top skills
sqlite3 $DB "SELECT skill_name, COUNT(*) FROM events WHERE skill_name IS NOT NULL GROUP BY skill_name ORDER BY 2 DESC LIMIT 10;"

# Daily tokens
sqlite3 $DB "SELECT DATE(timestamp) as day, SUM(tokens_input+tokens_output) FROM events GROUP BY day ORDER BY day DESC LIMIT 30;"

# Per-model usage
sqlite3 $DB "SELECT model, COUNT(*) as events, SUM(tokens_input) as tin, SUM(tokens_output) as tout FROM events WHERE model IS NOT NULL GROUP BY model;"
```

---

## Metrics Skill

Skills and agents can report metrics via the `metrics` skill and `.opencode/hooks/metrics-reporter.js`.
See: `mission-control/skills/metrics/SKILL.md`

## Metrics Collector Agent

Read-only agent for generating reports on demand.
See: `mission-control/.github/agents/metrics-collector.agent.md`
Activate with: "metrics report" or "token usage summary"
