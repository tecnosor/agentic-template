# Mission Control — Workspace Governance

> **Language standard**: English (mandatory for all code, docs, kanban, and agent files)

---

## When to Use Each Agent

| Agent | Use when... |
|-------|-------------|
| `@orchestrator` | Starting any new task (feature, fix, chore, spike) |
| `@builder` | Implementing code, fixing bugs, refactoring |
| `@guardian` | Reviewing security, compliance, GDPR, DORA, PSD2 |
| `@validator` | Verifying build and tests before opening a PR |
| `@reviewer` | Opening a PR (always the last step before merge) |
| `@project-scout` | Checking project status or proposing backlog tasks |
| `@history-mapper` | Mapping existing work to initialize kanban tasks as `done` |
| `@lang-enforcer` | Checking or fixing language consistency (English standard) |

---

## Mandatory Workflow

```
@orchestrator
    ├── @builder     (code implementation)
    └── @guardian    (security + compliance — run in parallel)
         │
         └── @validator  (build + tests gate)
                  │
                  └── @reviewer  (PR creation — always last)
```

---

## Available Skills

| Skill | Auto-activates when... |
|-------|------------------------|
| `/git-flow` | Talking about branches, new features, tickets |
| `/kanban-sync` | Moving or creating kanban tasks |
| `/project-status` | Asking for project state or backlog proposals |
| `/history-scan` | Mapping existing functionality to `done` task files |
| `/test-driven` | Writing tests, discussing coverage, TDD |
| `/build-check` | Validating before PR, running CI locally |
| `/secure-coder` | Security review, vulnerabilities, secrets |
| `/compliance-eu` | GDPR, DORA, PSD2, privacy, audit |
| `/code-review` | Code review, quality gate before PR |
| `/lang-enforcer` | Checking or enforcing English language standard |
| `/github-cli` | GitHub interactions: PRs, issues, releases, CI workflows |
| `/vertical-slice` | Scaffolding new CQRS command or query (Node.js TypeScript) |
| `/metrics` | Recording session/skill/agent events to Mission Control + Langfuse |
| `/metrics-agent` | Lightweight metrics for sub-agents and CI scripts |

---

## Kanban Origin Convention

| Badge | Meaning | Prefix examples |
|-------|---------|-----------------|
| 🤖 Agent | Proposed or detected by an agent | `SCOUT-`, `DONE-`, `BACKLOG-`, `LANG-` |
| 👤 Human | Proposed or created by a human | `FEAT-`, `FIX-`, `CHORE-` |

> **Origin is immutable.** Never change 🤖 to 👤 or vice versa after creation.

---

## Kanban Discipline

- **One file per task** — tasks live in `kanban/tasks/{ID}.md` with a `status:` YAML field
- **Maximum 2 tasks with `status: doing`** — finish before starting new ones
- Changing status = editing the `status:` field in the task file (no files to move)
- Task ID prefixes:
  - Human tasks: `FEAT-NNN`, `FIX-NNN`, `CHORE-NNN`
  - Agent proposals: `SCOUT-NNN`, `LANG-NNN`, `BACKLOG-NNN`
- Cross-repo tasks: main entry here, sub-tasks in each affected repo, cross-referenced by ID

---

## Default Template Repos

| Repo | Role | Regulations |
|------|------|-------------|
| `mission-control` | Governance + observability | N/A |

---

## Language Standard

English is mandatory for **all** code, comments, docs, kanban tasks, and agent/skill files.

**Exceptions (only)**:
- User-facing i18n strings in files explicitly marked for translation (e.g., `locales/`, `i18n/`, `*.po`)
- Bilingual keyword sections in agent/skill `description` fields (for activation searchability)

Run `/lang-enforcer` to detect and fix violations.

---

## Onboarding a New Repo

```bash
# 1. Create kanban tasks directory
mkdir -p [new-repo]/kanban/tasks
touch [new-repo]/kanban/tasks/.gitkeep

# 2. Copy opencode.json from template root
# 3. Create AGENTS.md in new repo (short-form guide)
# 4. Add repo row to workspace repos table above
# 5. Run @history-mapper to create done task files for existing work
# 6. Run @project-scout to generate initial backlog task files
```

---

## Observability

Mission Control runs a built-in Langfuse bridge.
Agents never need Langfuse credentials — just POST to `http://localhost:3099/api/metrics/*`.

| UI | URL |
|----|-----|
| Mission Control UI | http://localhost:3098 |
| Mission Control API | http://localhost:3099 |
| Langfuse (self-hosted) | http://localhost:3000 |

See `README.md` for setup options (Cloud vs self-hosted docker).

---

*Maintained by the workspace governance team.*
