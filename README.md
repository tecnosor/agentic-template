# Enterprise App Template

A production-ready, public project template for enterprise applications built with **OpenCode**.

**Architecture**: DDD + Clean Architecture + CQRS + Vertical Slice  
**Standards**: GDPR, DORA, PSD2, ISO 20022, OWASP Top 10, WCAG 2.1 AA

---

## What's Inside

| Workspace | Role | Tech |
|-----------|------|------|
| `demo-backend/` | REST API backend (replace with your service) | Node.js + TypeScript + Express + TSyringe |
| `demo-frontend/` | SPA frontend (replace with your frontend) | Vue 3 + TypeScript + Pinia + Vue-i18n |
| `mission-control/` | Governance: kanban, agents, skills, compliance | OpenCode agents + Vue 3 dashboard |

---

## Quick Start

### 1. Clone and configure

```bash
git clone <this-repo> my-project
cd my-project
```

### 2. Install OpenCode skills

```bash
chmod +x mission-control/scripts/install-shared-skills.sh
./mission-control/scripts/install-shared-skills.sh
```

### 3. Start the demo backend

```bash
cd demo-backend
npm install
npm run dev        # http://localhost:3000
npm test           # run tests
```

### 4. Start the demo frontend

```bash
cd demo-frontend
npm install
npm run dev        # http://localhost:5173
```

### 5. Start Mission Control UI

```bash
cd mission-control/ui
npm run install:all
npm run dev        # http://localhost:5174
```

> **Requires Node.js 22+** for `mission-control/ui` (uses `node:sqlite` built-in)

---

## OpenCode Agents

This template ships with 8 pre-configured agents in `opencode.json`:

| Agent | Role |
|-------|------|
| `@orchestrator` | Task lifecycle coordinator — start here |
| `@builder` | Code implementation, bug fixes, refactoring |
| `@guardian` | Security and compliance review (OWASP, GDPR, DORA) |
| `@validator` | Build and test gate before PRs |
| `@reviewer` | PR creation — always the last step |
| `@project-scout` | Backlog analysis and task proposals |
| `@history-mapper` | Maps git history to kanban `done` tasks |
| `@lang-enforcer` | Detects and fixes non-English content |

### Workflow

```
@orchestrator
    ├── @builder     (implement code)
    └── @guardian    (security + compliance, parallel)
              └── @validator  (build + tests gate)
                        └── @reviewer  (create PR)
```

---

## OpenCode Skills

After running `install-shared-skills.sh`, these skills are available:

| Skill | Purpose |
|-------|---------|
| `build-check` | Validate build before PR |
| `code-review` | Quality gate, code review checklist |
| `compliance-eu` | GDPR, DORA, PSD2, privacy audit |
| `git-flow` | Branch, commit, PR, release conventions |
| `github-cli` | GitHub interactions via `gh` CLI |
| `history-scan` | Map existing work to kanban `done` files |
| `kanban-sync` | Create or move kanban task files |
| `lang-enforcer` | Enforce English language standard |
| `metrics` | Report metrics to the metrics API |
| `metrics-agent` | Metrics collector agent skill |
| `page-component` | Scaffold Vue 3 page/component with i18n + a11y |
| `project-status` | Project state, backlog health report |
| `secure-coder` | Security review, vulnerability scanning |
| `test-driven` | TDD, test quality, coverage |
| `vertical-slice` | Scaffold CQRS command/query (Node.js/TypeScript) |

---

## Kanban Board

Tasks live in `{repo}/kanban/tasks/*.md` files using a standardized schema.

See [`mission-control/ui/kanban-schema.md`](mission-control/ui/kanban-schema.md) for the full schema.

The Mission Control UI reads these files and renders them as a 7-column board:

```
BACKLOG → TODO → READY → DOING → TESTING → HUMAN_VALIDATION → DONE
```

---

## Metrics

OpenCode session metrics (tokens, skill invocations, agent calls) are tracked in a local SQLite database.

```bash
# Start the metrics server + dashboard
cd mission-control/ui && npm run dev

# CLI report
cd mission-control && ./scripts/metrics-report.sh
```

See [`mission-control/metrics/README.md`](mission-control/metrics/README.md) for full API docs.

---

## Adapting This Template

1. **Replace `demo-backend/`** with your actual backend service
2. **Replace `demo-frontend/`** with your actual frontend
3. **Update `mission-control/ui/server/src/config.ts`** — set `REPOS` to your repo folder names
4. **Update `opencode.json`** — adjust `model` to your preferred AI model
5. **Run `@history-mapper`** to create `done` kanban tasks from your existing git history
6. **Run `@project-scout`** to generate an initial backlog

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| npm | 10+ |
| OpenCode | latest |

---

## License

MIT — free to use as a base for any project.
