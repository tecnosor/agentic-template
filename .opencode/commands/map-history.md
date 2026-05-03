---
description: Invoke the history-mapper agent to initialize kanban task files (status: done) from existing git history.
---

# Map History

Initialize kanban task files by mapping existing git history to structured entries.

Invoke `@history-mapper` with the following scope:

1. Read git log (last 6 months minimum, or entire history for new kanban)
2. Read README.md and any CHANGELOG.md for feature documentation
3. Read migration files to infer schema changes and related features
4. Read test files to confirm feature completeness

Output:
- Task files in `kanban/tasks/` with `status: done` for all completed features (one file per logical feature)
- Task files with `status: backlog` and `SCOUT-` prefix for partially-completed work
- All entries normalized to English
- Origin field: `🤖 Agent (mapped from git history)`

Do not fabricate dates — use actual commit timestamps.
