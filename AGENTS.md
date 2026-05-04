# Workspace Agents & Skills — Enterprise App Template

> **Governance repo**: mission-control | **Language standard**: English

---

## What Is This Template?

A production-ready, public project template for enterprise applications.
Architecture: **DDD + Clean Architecture + CQRS + Vertical Slice**.
Standards: **GDPR, DORA, PSD2, ISO 20022, OWASP Top 10, WCAG 2.1 AA**.

Default template workspaces:
- `demo-backend/` — Node.js + TypeScript REST API (replace with your backend)
- `demo-frontend/` — Vue 3 + TypeScript SPA (replace with your frontend)
- `mission-control/` — Governance: kanban, skills, agents, compliance

---

## When to Use Each Agent

| Agent | Use me when... |
|-------|----------------|
| `@orchestrator` | Starting any new task (feature, fix, chore, spike) |
| `@builder` | Implementing code, fixing bugs, refactoring |
| `@guardian` | Reviewing security, compliance, GDPR, DORA, PSD2 |
| `@validator` | Verifying build and tests before opening a PR |
| `@reviewer` | Opening a PR (always the last step before merge) |
| `@project-scout` | Checking project status or proposing backlog tasks |
| `@history-mapper` | Mapping existing work to initialize kanban task files as `done` |
| `@lang-enforcer` | Checking or fixing language consistency (English standard) |

---

## Mandatory Workflow

```
@orchestrator
    ├── @builder     (code implementation)
    └── @guardian    (security + compliance — run in parallel with builder)
         │
         └── @validator  (build + tests gate)
                  │
                  └── @reviewer  (PR creation — always last)
```

---

## Available Skills

| Skill | Activates when... |
|-------|-------------------|
| `build-check` | Validating before PR, running CI locally |
| `code-review` | Code review, quality gate before PR |
| `compliance-eu` | GDPR, DORA, PSD2, privacy, audit |
| `git-flow` | Branches, commits, PRs, releases |
| `github-cli` | GitHub interactions via `gh` CLI |
| `history-scan` | Mapping existing work to `done` task files in `kanban/tasks/` |
| `kanban-sync` | Moving or creating kanban tasks |
| `lang-enforcer` | Checking or enforcing English language standard |
| `project-status` | Project state, backlog, health report |
| `secure-coder` | Security review, vulnerabilities, secrets |
| `test-driven` | TDD, test quality, coverage |
| `vertical-slice` | Scaffold CQRS command/query (Node.js/TypeScript) |
| `page-component` | Scaffold Vue 3 page/component with i18n and a11y |

Skills are in `mission-control/skills/`.

---

## Kanban Origin Convention

| Badge | Meaning | Prefix examples |
|-------|---------|-----------------|
| 🤖 Agent | Proposed or detected by an agent | `SCOUT-`, `DONE-`, `BACKLOG-`, `LANG-` |
| 👤 Human | Proposed or created by a human | `FEAT-`, `FIX-`, `CHORE-` |

> **Origin is immutable.** Never change 🤖 to 👤 or vice versa after creation.

---

## Kanban Scope

| Location | Scope |
|----------|-------|
| `mission-control/kanban/` | Workspace-wide and cross-repo tasks |
| `demo-backend/kanban/` | Backend-specific tasks |
| `demo-frontend/kanban/` | Frontend-specific tasks |

---

## Language Standard

English is the workspace default for **all** code, comments, docs, and kanban tasks.

**Exceptions** (only):
- User-facing i18n strings in files explicitly marked for translation (`locales/`, `i18n/`)

Run `@lang-enforcer` to detect and fix violations.

---

## Project Structure

```
template/
├── opencode.json              # OpenCode workspace config
├── AGENTS.md                  # This file
├── README.md                  # Project overview
├── .opencode/
│   ├── agents/                # Agent definitions (OpenCode)
│   └── commands/              # Quick command shortcuts
├── mission-control/
│   ├── AGENTS.md              # Governance agent guide
│   ├── kanban/                # Task tracking board
│   ├── skills/                # Shared skills (code-review, security, etc.)
│   ├── architecture/          # Architecture standards
│   └── compliance/            # GDPR, DORA checklists
├── demo-backend/
│   ├── src/
│   │   ├── domain/            # DDD entities, value objects, ports
│   │   ├── application/       # CQRS use cases (vertical slices)
│   │   └── infrastructure/    # REST, DB, external adapters
│   └── kanban/
└── demo-frontend/
    ├── src/
    │   ├── contexts/          # Bounded contexts (DDD)
    │   ├── components/        # Reusable UI components
    │   ├── pages/             # Route pages
    │   └── i18n/              # Translations
    └── kanban/
```

---

## Default Workspace Repos

| Repo | Layer | Role | Regulations |
|------|-------|------|-------------|
| `mission-control` | 1 | Governance | N/A |
| `demo-backend` | 2 | REST API backend | GDPR, DORA, PSD2 |
| `demo-frontend` | 2 | SPA frontend | GDPR, WCAG |

---

## Onboarding a New Service

```bash
# 1. Copy one of the demo apps as a starting point
cp -r demo-backend my-new-service

# 2. Create kanban board
mkdir -p my-new-service/kanban

# 3. Update opencode.json with repo-specific config
# 4. Add AGENTS.md to root of new service
# 5. Update AGENTS.md workspace table above
# 6. Run: @history-mapper to create done task files in kanban/tasks/
# 7. Run: @project-scout to generate initial backlog
```

---

*Last updated: $(date +%Y-%m-%d) | Language: English | Tooling: OpenCode*
