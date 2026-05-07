# GitHub Copilot — Workspace Instructions

> Full agent/skill reference: `AGENTS.md` and `mission-control/AGENTS.md`

---

## Mandatory: Metrics Instrumentation

At the **start of every conversation**, register a session with Mission Control:

```bash
SESSION_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
curl -s -X POST http://localhost:3099/api/metrics/sessions \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$SESSION_ID\",
    \"started_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"workspace\": \"template\",
    \"model\": \"Claude Sonnet 4.6\"
  }" || true
```

After each **skill or agent invocation**:
```bash
curl -s -X POST http://localhost:3099/api/metrics/events \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"event_type\": \"skill_invoked\",
    \"skill_name\": \"<skill-name>\",
    \"workspace\": \"template\",
    \"model\": \"Claude Sonnet 4.6\",
    \"tokens_input\": <floor(user_chars/4)>,
    \"tokens_output\": <floor(response_chars/4)>,
    \"duration_ms\": <elapsed>,
    \"status\": \"success\"
  }" || true
```

At **conversation end** (best effort):
```bash
curl -s -X PATCH http://localhost:3099/api/metrics/sessions/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d "{\"ended_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" || true
```

> If `http://localhost:3099` is unreachable — skip silently. Never block real work.

Token estimation: `tokens = floor(text.length / 4)` (no real counts available).

Full API reference: `mission-control/skills/metrics/SKILL.md`

---

## Agent Routing

| Task | Agent |
|------|-------|
| New feature / fix / spike | `@orchestrator` first |
| Code implementation | `@builder` |
| Security + compliance | `@guardian` |
| Build + tests gate | `@validator` |
| Open PR | `@reviewer` (always last) |
| Project status / backlog | `@project-scout` |
| Map existing work to kanban | `@history-mapper` |
| Language consistency check | `@lang-enforcer` |

## Reusable Prompts (use with #prompt or /prompt in chat)

| Prompt | What it does |
|--------|-------------|
| [orchestrate](.github/prompts/orchestrate.prompt.md) | Full task lifecycle — kanban → build → PR |
| [audit](.github/prompts/audit.prompt.md) | Security + compliance audit (OWASP, GDPR, DORA) |
| [lang-check](.github/prompts/lang-check.prompt.md) | Find non-English content, propose LANG-NNN fixes |
| [new-slice](.github/prompts/new-slice.prompt.md) | Scaffold CQRS command or query (backend) |
| [new-component](.github/prompts/new-component.prompt.md) | Scaffold Vue 3 page/component/composable |
| [map-history](.github/prompts/map-history.prompt.md) | Map git history → kanban done tasks |
| [scout](.github/prompts/scout.prompt.md) | Analyze codebase, propose backlog tasks (report only) |
| [metrics-session](.github/prompts/metrics-session.prompt.md) | Register session in Mission Control + Langfuse |

## Skills

Skills are in `mission-control/skills/`. Use the `read_file` tool on the path below **before** performing any task in that domain:

| Skill | Domain | Path |
|-------|--------|------|
| `build-check` | CI validation, pre-PR build gate | `mission-control/skills/build-check/SKILL.md` |
| `code-review` | Code quality gate, review checklist | `mission-control/skills/code-review/SKILL.md` |
| `compliance-eu` | GDPR, DORA, PSD2, privacy, audit | `mission-control/skills/compliance-eu/SKILL.md` |
| `git-flow` | Branches, commits, PRs, releases | `mission-control/skills/git-flow/SKILL.md` |
| `github-cli` | GitHub interactions via `gh` CLI | `mission-control/skills/github-cli/SKILL.md` |
| `gitlab-cli` | GitLab interactions via `glab` CLI | `mission-control/skills/gitlab-cli/SKILL.md` |
| `history-scan` | Map git history → kanban `done` tasks | `mission-control/skills/history-scan/SKILL.md` |
| `kanban-sync` | Create/move/update kanban tasks | `mission-control/skills/kanban-sync/SKILL.md` |
| `lang-enforcer` | Detect/fix non-English content (LANG-NNN) | `mission-control/skills/lang-enforcer/SKILL.md` |
| `metrics` | Mission Control metrics API (sessions/events) | `mission-control/skills/metrics/SKILL.md` |
| `metrics-agent` | Agent-side metrics instrumentation | `mission-control/skills/metrics-agent/SKILL.md` |
| `page-component` | Scaffold Vue 3 page/component/composable | `mission-control/skills/page-component/SKILL.md` |
| `project-status` | Project health, backlog, status report | `mission-control/skills/project-status/SKILL.md` |
| `secure-coder` | OWASP Top 10, secrets, vulnerability review | `mission-control/skills/secure-coder/SKILL.md` |
| `test-driven` | TDD, test quality, coverage | `mission-control/skills/test-driven/SKILL.md` |
| `vertical-slice` | Scaffold CQRS command/query (Node.js/TS) | `mission-control/skills/vertical-slice/SKILL.md` |

## Language

**English only** — all code, comments, docs, kanban tasks.
Exception: `i18n/` and `locales/` translation files.
