---
mode: agent
description: Start or resume the active kanban task — full orchestration workflow.
---

Start the task lifecycle for the current branch or active kanban ticket.

Steps:
1. Register a metrics session: run `python3 -c "import uuid; print(uuid.uuid4())"` to get SESSION_ID, then POST to `http://localhost:3099/api/metrics/sessions`
2. Check current branch: `git branch --show-current` — stop if on main/master/develop
3. Check which task files have `status: doing` in `kanban/tasks/` (if any)
4. If no active task, find files with `status: ready` to pick up; create one if none found
5. Invoke security audit (guardian role): OWASP Top 10, GDPR, DORA checks — report only, do not modify code
6. Implement the task following architecture rules in [AGENTS.md](../AGENTS.md) and relevant skills in [mission-control/skills/](../mission-control/skills/)
7. After implementation: run build + tests
8. On passing build: move task to `status: testing`, then open PR

Skills to load as needed:
- Code: [vertical-slice](../mission-control/skills/vertical-slice/SKILL.md) | [page-component](../mission-control/skills/page-component/SKILL.md)
- Security: [secure-coder](../mission-control/skills/secure-coder/SKILL.md)
- Quality: [test-driven](../mission-control/skills/test-driven/SKILL.md) | [build-check](../mission-control/skills/build-check/SKILL.md)
- PR: [git-flow](../mission-control/skills/git-flow/SKILL.md) | [github-cli](../mission-control/skills/github-cli/SKILL.md)
