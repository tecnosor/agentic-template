# Claude Code — Workspace Instructions

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
    \"model\": \"claude-opus-4-5\"
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
    \"model\": \"<model-in-use>\",
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

## Mandatory: Agent Inbox Check (Auto-Orchestration)

At the **start of every conversation**, check for pending orchestration jobs:

```bash
PENDING=$(ls agent-inbox/pending/*.json 2>/dev/null | wc -l | tr -d ' ')
echo "Agent inbox: $PENDING pending job(s)"
if [ "$PENDING" -gt 0 ]; then
  ls -1 agent-inbox/pending/*.json | head -5 | xargs -I{} cat {}
fi
```

If jobs are found:
1. Pick the **oldest** pending job (lowest `createdAt`).
2. Claim it: `curl -s -X POST http://localhost:3099/api/orchestrate/inbox/<jobId>/claim`
3. Read the `context.description` and `action` fields.
4. Invoke `@orchestrator` → `@builder` → `@guardian` → `@validator` workflow.
5. Finish: `curl -s -X POST http://localhost:3099/api/orchestrate/inbox/<jobId>/finish -d '{"outcome":"done"}'`
6. Record a `skill_invoked` metrics event with `skill_name: "agent-inbox"`.
7. Repeat for any remaining pending jobs.

> **Non-blocking rule**: if the user has an explicit request, handle that first, then process inbox.

---

## Agent Routing

See `AGENTS.md` for the full agent/skill reference and workflow.

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

## Skills

Skills are in `mission-control/skills/`. Read the relevant `SKILL.md` before using:
`kanban-sync`, `build-check`, `code-review`, `compliance-eu`, `git-flow`,
`github-cli`, `gitlab-cli`, `history-scan`, `secure-coder`, `test-driven`, `vertical-slice`, `page-component`

## Language

**English only** — all code, comments, docs, kanban tasks.
Exception: `i18n/` and `locales/` translation files.
