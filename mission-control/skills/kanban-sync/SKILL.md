---
name: kanban-sync
description: >-
  Manages kanban task creation, movement, and lifecycle across workspace repos.
  One file per task in kanban/tasks/{ID}.md with YAML frontmatter status field.
  Supports unlimited parallel DOING tasks, immutable Origin field, correct ID prefixes.
  Use when creating tickets, updating task status, or checking workflow health.
  Keywords: kanban, backlog, task, ticket, FEAT, FIX, CHORE, SCOUT, sprint,
  move task, update status, tarea, tablero, pendiente, en progreso.
allowed-tools:
  - read_file
  - create_file
  - replace_string_in_file
  - file_search
  - run_in_terminal
---

# Kanban Sync Skill

## Board Structure

**One file per task.** No stage files. Status lives in each task's YAML frontmatter.

```
kanban/
└── tasks/
    ├── FEAT-001.md     (status: READY)
    ├── FEAT-002.md     (status: DOING)
    ├── FIX-003.md      (status: TESTING)
    └── .gitkeep
```

### Task File Format

`kanban/tasks/{ID}.md`:

```yaml
---
id: FEAT-042
title: Add user onboarding flow
status: READY
origin: "👤 Human"
priority: HIGH
repo: demo-backend
created: 2025-01-15
updated: 2025-01-20
---

## Description
Implement the complete user onboarding flow with email verification.

## Acceptance Criteria
- [ ] POST /api/v1/users/onboard creates user
- [ ] Unit tests for handler
- [ ] Integration test for full flow

## Notes
- PR: (pending)
```

### Valid Status Values

| Status | Meaning |
|--------|---------|
| `BACKLOG` | Discovered, not yet prioritized |
| `TODO` | Prioritized for upcoming work |
| `READY` | Estimated and ready to start |
| `DOING` | Actively being worked on (unlimited parallel) |
| `TESTING` | Implementation done, tests running |
| `HUMAN_VALIDATION` | Awaiting stakeholder approval |
| `DONE` | Completed and merged |

---

## ID Prefix Conventions

| Prefix | Origin | Description |
|--------|--------|-------------|
| `FEAT-` | 👤 Human | New feature |
| `FIX-` | 👤 Human | Bug fix |
| `CHORE-` | 👤 Human | Maintenance, tooling, deps |
| `SCOUT-` | 🤖 Agent | Proposed by @project-scout |
| `BACKLOG-` | 🤖 Agent | Auto-generated backlog item |
| `LANG-` | 🤖 Agent | Language violation (from @lang-enforcer) |
| `DONE-` | 🤖 Agent | Mapped from history by @history-mapper |

**Origin is IMMUTABLE.** Never change `👤 Human` to `🤖 Agent` or vice versa.

---

## Workflow Transitions

```
BACKLOG → TODO → READY → DOING → TESTING → HUMAN_VALIDATION → DONE
```

| Trigger | Status change |
|---------|---------------|
| Prioritized for next sprint | `BACKLOG` → `TODO` |
| Estimated and refined | `TODO` → `READY` |
| Work started | `READY` → `DOING` |
| Implementation complete | `DOING` → `TESTING` |
| Tests passed, build green | `TESTING` → `HUMAN_VALIDATION` |
| Stakeholder approved | `HUMAN_VALIDATION` → `DONE` |
| PR merged (automated) | `DOING`/`TESTING` → `DONE` |

---

## Create Task

1. Find next numeric suffix:
   ```bash
   ls kanban/tasks/*.md 2>/dev/null | grep -oE '[0-9]+' | sort -n | tail -1
   ```
2. Create `kanban/tasks/{PREFIX}-{N}.md` with YAML frontmatter:

```bash
cat > kanban/tasks/FEAT-043.md << 'EOF'
---
id: FEAT-043
title: Add password reset flow
status: BACKLOG
origin: "👤 Human"
priority: MEDIUM
repo: demo-backend
created: 2025-01-20
updated: 2025-01-20
---

## Description
...

## Acceptance Criteria
- [ ] ...
EOF
```

---

## Move Task (update status)

1. Update `status:` in the task file's YAML frontmatter
2. Update `updated:` date

```bash
# Move FEAT-043 from BACKLOG → READY (macOS sed)
sed -i '' 's/^status: BACKLOG/status: READY/' kanban/tasks/FEAT-043.md
sed -i '' "s/^updated: .*/updated: $(date +%Y-%m-%d)/" kanban/tasks/FEAT-043.md
```

No other files change — status is self-contained per task file.

---

## Board Health Check

```bash
echo "Status breakdown:"
grep -h "^status:" kanban/tasks/*.md 2>/dev/null \
  | awk -F': ' '{print $2}' | sort | uniq -c | sort -rn

echo "DOING tasks:"
grep -rl "^status: DOING" kanban/tasks/ 2>/dev/null
```

Expected health indicators:
- No task stuck in `DOING` for > 5 days

---

## Query Examples

```bash
# All READY tasks
grep -rl "status: READY" kanban/tasks/

# DOING tasks with titles
grep -rl "status: DOING" kanban/tasks/ | xargs grep "^title:" 2>/dev/null

# Tasks for a specific repo
grep -rl "repo: demo-backend" kanban/tasks/
```
