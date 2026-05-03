---
name: kanban-sync
description: >-
  Manages kanban task creation, movement, and lifecycle across workspace repos.
  One file per task in kanban/tasks/{ID}.md with YAML frontmatter status field.
  Enforces DOING limit (max 2), immutable Origin field, correct ID prefixes.
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
    ├── FEAT-001.md     (status: ready)
    ├── FEAT-002.md     (status: doing)
    ├── FIX-003.md      (status: testing)
    └── .gitkeep
```

### Task File Format

`kanban/tasks/{ID}.md`:

```yaml
---
id: FEAT-042
title: Add user onboarding flow
status: ready
origin: "👤 Human"
priority: high
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
| `backlog` | Discovered, not yet prioritized |
| `todo` | Prioritized for upcoming work |
| `ready` | Estimated and ready to start |
| `doing` | Actively being worked on (**MAX 2**) |
| `testing` | Implementation done, tests running |
| `human-validation` | Awaiting stakeholder approval |
| `done` | Completed and merged |

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

## DOING Limit — MAX 2 Tasks

Before moving any task to `doing`:

```bash
grep -rl "status: doing" kanban/tasks/ 2>/dev/null | wc -l
```

If count is 2: **STOP. Finish or move a doing task before starting a new one.**

---

## Workflow Transitions

```
backlog → todo → ready → doing → testing → human-validation → done
```

| Trigger | Status change |
|---------|---------------|
| Prioritized for next sprint | `backlog` → `todo` |
| Estimated and refined | `todo` → `ready` |
| Work started | `ready` → `doing` |
| Implementation complete | `doing` → `testing` |
| Tests passed, build green | `testing` → `human-validation` |
| Stakeholder approved | `human-validation` → `done` |
| PR merged (automated) | `doing`/`testing` → `done` |

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
status: backlog
origin: "👤 Human"
priority: medium
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
# Move FEAT-043 from backlog → ready (macOS sed)
sed -i '' 's/^status: backlog/status: ready/' kanban/tasks/FEAT-043.md
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
grep -rl "^status: doing" kanban/tasks/ 2>/dev/null
```

Expected health indicators:
- `doing`: ≤ 2
- `testing`: ≤ 3
- No task stuck in `doing` for > 5 days

---

## Query Examples

```bash
# All ready tasks
grep -rl "status: ready" kanban/tasks/

# Doing tasks with titles
grep -rl "status: doing" kanban/tasks/ | xargs grep "^title:" 2>/dev/null

# Tasks for a specific repo
grep -rl "repo: demo-backend" kanban/tasks/
```
