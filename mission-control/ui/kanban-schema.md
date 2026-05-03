# Kanban Task Schema

> This schema defines the canonical structure for all kanban tasks across `{repo}/kanban/tasks/*.md` files.
> The Kanban UI (see `ui/README.md`) uses this schema to parse and render tasks.

---

## Markdown Table Format (source of truth)

Each task in `kanban/tasks/` is represented as a two-column markdown table:

```markdown
| Field | Value |
|-------|-------|
| **ID** | FEAT-001 |
| **Origin** | 👤 Human |
| **Status** | READY |
| **Priority** | HIGH |
| **Repo** | demo-backend |
| **Description** | Add JWT authentication to the REST API |
| **Acceptance Criteria** | - [ ] POST /auth/login returns signed JWT\n- [ ] Tests passing |
| **Created** | 2026-01-01 |
| **Updated** | 2026-01-01 |
| **Lead Time** | — |
```

---

## JSON Schema (for UI parsing)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KanbanTask",
  "type": "object",
  "required": ["id", "origin", "status", "priority", "repo", "description", "created", "updated"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^(FEAT|FIX|CHORE|SCOUT|DONE|BACKLOG|LANG)-[0-9]{3,}$",
      "description": "Unique task ID. Immutable once assigned.",
      "examples": ["FEAT-001", "FIX-042", "DONE-015"]
    },
    "origin": {
      "type": "string",
      "enum": ["👤 Human", "🤖 Agent"],
      "description": "Who created the task. IMMUTABLE once set."
    },
    "status": {
      "type": "string",
      "enum": ["BACKLOG", "TODO", "READY", "DOING", "TESTING", "HUMAN_VALIDATION", "DONE"],
      "description": "Current kanban column. DOING max = 2 tasks at any time."
    },
    "priority": {
      "type": "string",
      "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    },
    "repo": {
      "type": "string",
      "description": "Target repository folder name or 'all' for cross-repo tasks.",
      "examples": [
        "demo-backend",
        "demo-frontend",
        "mission-control",
        "all"
      ]
    },
    "description": {
      "type": "string",
      "description": "What needs to be done. Written in English."
    },
    "acceptanceCriteria": {
      "type": "string",
      "description": "Checklist items that define done. Written in English."
    },
    "created": {
      "type": "string",
      "format": "date",
      "description": "ISO 8601 date when task was created."
    },
    "updated": {
      "type": "string",
      "format": "date",
      "description": "ISO 8601 date of last status change."
    },
    "leadTime": {
      "type": ["string", "null"],
      "description": "Business days from READY to DONE. Null until completed.",
      "examples": ["3 days", "—"]
    }
  }
}
```

---

## ID Prefix Rules

| Prefix | Origin | Usage |
|--------|--------|-------|
| `FEAT-` | 👤 Human | New feature |
| `FIX-` | 👤 Human | Bug fix |
| `CHORE-` | 👤 Human | Maintenance, dependency update |
| `SCOUT-` | 🤖 Agent | Proposal from `@project-scout` |
| `DONE-` | 🤖 Agent | Historical mapping from `@history-mapper` |
| `BACKLOG-` | 🤖 Agent | Auto-populated backlog item |
| `LANG-` | 🤖 Agent | Language enforcement fix |

---

## Status Transitions

Valid transitions (enforced by agents and optionally by UI):

```
BACKLOG → TODO → READY → DOING → TESTING → HUMAN_VALIDATION → DONE
                              ↓
                           READY  (if blocked, move back)
```

**Guards**:
- DOING column: maximum 2 tasks. Adding a 3rd is blocked.
- DONE column: append-only. Tasks in DONE are never modified.
- Origin field: immutable. Never change from 👤 to 🤖 or vice versa.

---

## Column Files

| Status | File |
|--------|------|
| BACKLOG | `kanban/BACKLOG.md` |
| TODO | `kanban/TODO.md` |
| READY | `kanban/READY.md` |
| DOING | `kanban/DOING.md` |
| TESTING | `kanban/TESTING.md` |
| HUMAN_VALIDATION | `kanban/HUMAN_VALIDATION.md` |
| DONE | `kanban/DONE.md` |
