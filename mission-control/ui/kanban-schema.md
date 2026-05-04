# Kanban Task Schema

> Canonical task format for Mission Control.
> Source of truth: `{repo}/kanban/tasks/*.md`

---

## File Format

Each task is a **single markdown file** with:

1. **YAML frontmatter** for structured metadata
2. A `## Description` section
3. An optional `## Acceptance Criteria` section

```md
---
id: FEAT-001
title: "Add API key rotation flow"
status: READY
origin: "👤 Human"
priority: HIGH
repo: demo-backend
created: 2026-01-01
updated: 2026-01-01
lead_time: "—"
github_issue: 42
github_url: "https://github.com/org/repo/issues/42"
---

## Description

Add the API key rotation workflow to the backend service.

## Acceptance Criteria

- [ ] Rotation endpoint exists
- [ ] Old key is invalidated
- [ ] Tests cover the happy path and invalid input
```

---

## Required Frontmatter Fields

| Field | Type | Notes |
|------|------|------|
| `id` | string | `FEAT-001`, `FIX-042`, `SCOUT-007`, etc. |
| `title` | string | Short human-readable title |
| `status` | string | `BACKLOG`, `TODO`, `READY`, `DOING`, `TESTING`, `HUMAN_VALIDATION`, `DONE` |
| `origin` | string | `👤 Human` or `🤖 Agent` |
| `priority` | string | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `repo` | string | Workspace repo folder name |
| `created` | date | ISO date (`YYYY-MM-DD`) |
| `updated` | date | ISO date (`YYYY-MM-DD`) |

### Optional Fields

| Field | Type | Notes |
|------|------|------|
| `lead_time` / `lead-time` | string | Displayed in the task modal |
| `completed` | date/string | Completion date or label |
| `github_issue` | number | Linked GitHub issue number |
| `github_url` | string | Linked GitHub issue URL |

---

## Body Sections

### `## Description`

Required by convention. Free-form markdown text.

### `## Acceptance Criteria`

Optional. Markdown checklist or bullet list.

If empty, Mission Control writes:

```md
_(empty)_
```

---

## ID Prefix Rules

| Prefix | Origin | Usage |
|--------|--------|-------|
| `FEAT-` | 👤 Human | New feature |
| `FIX-` | 👤 Human | Bug fix |
| `CHORE-` | 👤 Human | Maintenance |
| `SCOUT-` | 🤖 Agent | Proposal from `@project-scout` |
| `DONE-` | 🤖 Agent | Historical mapping from `@history-mapper` |
| `BACKLOG-` | 🤖 Agent | Auto-generated backlog item |
| `LANG-` | 🤖 Agent | Language-enforcement task |

---

## Status Rules

Valid statuses:

```text
BACKLOG → TODO → READY → DOING → TESTING → HUMAN_VALIDATION → DONE
```

### Guards

- **DOING max = 2 tasks** across the workspace
- **DONE is append-only** — tasks in `DONE` must not move backward
- **Origin is immutable**

These rules are enforced by Mission Control server mutations.

---

## Manual Creation

Tasks can be created in two ways:

1. **UI** — Mission Control `+ New Task`
2. **Manually** — create the markdown file directly in `kanban/tasks/`

If you create files manually, keep the frontmatter and section names exactly as shown above.

---

## Notes

- Mission Control reads the live file system; there is no secondary kanban database.
- Comments are stored in `kanban/comments.json`.
- Metrics for task creation and updates are recorded automatically by the watcher layer.
