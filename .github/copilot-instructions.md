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

Skills are in `mission-control/skills/`. Read the relevant `SKILL.md` before using:
`kanban-sync`, `build-check`, `code-review`, `compliance-eu`, `git-flow`,
`github-cli`, `history-scan`, `secure-coder`, `test-driven`, `vertical-slice`, `page-component`

## Language

**English only** — all code, comments, docs, kanban tasks.
Exception: `i18n/` and `locales/` translation files.
