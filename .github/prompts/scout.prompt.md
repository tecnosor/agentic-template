---
mode: agent
description: Analyze the codebase and propose new backlog tasks — report only, no writes.
---

Analyze the repository and produce backlog task proposals.

Read the skill first: [project-status](../mission-control/skills/project-status/SKILL.md)

Scope:
1. Read current kanban state (all task files in `*/kanban/tasks/`)
2. Scan source code for `TODO`, `FIXME`, `HACK`, `deprecated`, `not-implemented` markers
3. Check test coverage gaps (missing test files for handlers/services)
4. Check architecture violations (domain importing from infrastructure)
5. Run `npm audit` or `mvn dependency:check` to find CVEs
6. Check for outdated dependencies

Output a structured proposal report:
- `SCOUT-NNN` prefixed entries for agent-proposed tasks
- Priority: `HIGH` / `MEDIUM` / `LOW`
- Source location or rationale for each entry
- Estimated effort (S / M / L)

**Report only** — do not write task files, do not modify kanban.
Human must approve before tasks are created.
