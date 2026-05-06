---
mode: agent
description: Map existing git history into kanban task files with status done.
---

Initialize kanban task files by mapping existing git history.

Read the skill first: [history-scan](../mission-control/skills/history-scan/SKILL.md)

Scope:
1. Read git log (last 6 months minimum, or full history for fresh kanban)
2. Read `README.md` and any `CHANGELOG.md` for feature documentation
3. Read migration files to infer schema changes
4. Read test files to confirm feature completeness

Output:
- Task files in `kanban/tasks/` with `status: done` for completed features (one file per logical feature)
- Task files with `status: backlog` and `SCOUT-` prefix for partially-completed work
- All entries in English
- `origin: "🤖 Agent (mapped from git history)"` field on every created file

Rules:
- Do not fabricate dates — use actual commit timestamps
- Do not merge unrelated work into one task
- Do not create tasks for chores/deps-only commits unless significant
