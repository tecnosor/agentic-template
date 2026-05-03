---
description: Invoke the project-scout agent to analyze the codebase and propose new backlog tasks.
---

# Scout

Analyze the current repository and produce backlog task proposals.

Invoke `@project-scout` with the following scope:

1. Read current kanban state (all columns)
2. Scan source code for TODO, FIXME, HACK, deprecated, not-implemented markers
3. Check test coverage gaps (missing test files)
4. Check architecture violations (domain importing from infrastructure)
5. Run `npm audit` or `mvn dependency:check` to find CVEs
6. Check for outdated dependencies

Output a structured proposal report with:
- SCOUT-NNN prefixed entries for agent-proposed tasks
- Priority (HIGH / MEDIUM / LOW)
- Source location or rationale
- NO writes to kanban — proposals only
