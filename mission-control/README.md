# Mission Control

Workspace governance repository for this project template.

Contains no production code. Manages agents, skills, kanban, compliance, and architecture standards.

## Structure

```
mission-control/
├── AGENTS.md              # Agent guide and workflow reference
├── README.md              # This file
├── docker-compose.yml     # Full Langfuse v3 stack + MC server
├── .env.example           # Environment variables template
├── kanban/                # Workspace-wide kanban board
│   └── tasks/             # One .md file per task (status in YAML frontmatter)
├── skills/                # Shared skill definitions
│   ├── metrics/           # Langfuse observability bridge
│   ├── metrics-agent/     # Lightweight metrics for agents
│   ├── build-check/
│   ├── code-review/
│   ├── compliance-eu/
│   ├── git-flow/
│   ├── github-cli/
│   ├── gitlab-cli/
│   ├── history-scan/
│   ├── kanban-sync/
│   ├── lang-enforcer/
│   ├── project-status/
│   ├── secure-coder/
│   ├── test-driven/
│   └── vertical-slice/
├── ui/                    # Mission Control dashboard
│   ├── app/               # Vue 3 frontend (port 3098)
│   └── server/            # Express API server (port 3099)
└── architecture/
    └── standards.md       # DDD, Clean Architecture, CQRS standards
```

## Quick Start

```bash
# Check current project status
# Invoke @project-scout

# Start a new task
# Invoke @orchestrator

# Run security audit
# Invoke @guardian

# Run build check
# Invoke @validator
```

## Observability Setup

### Option A — Langfuse Cloud (simplest)

1. Create a free account at <https://cloud.langfuse.com>
2. Create a project and copy Public + Secret keys
3. Set vars in `mission-control/ui/server/.env`:
   ```env
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   LANGFUSE_HOST=https://cloud.langfuse.com
   ```
4. Start the MC server: `cd ui/server && npm install && npm run dev`
5. Open `http://localhost:3098` → **🔍 Traces** tab

### Option B — Self-hosted (full docker stack)

```bash
cd mission-control
cp .env.example .env          # fill in secrets (only first time)
docker compose up -d
```

Services started:

| Service | URL |
|---------|-----|
| Mission Control UI | http://localhost:3098 |
| Mission Control API | http://localhost:3099 |
| Langfuse UI | http://localhost:3001 |
| MinIO (S3) | http://localhost:9001 |

First-run admin login: credentials from `LANGFUSE_INIT_*` in `.env` (default: `admin@mission-control.local` / `Admin1234!`).

> Everything is dockerized. No Node.js or npm required on the host.

## Core Rules

1. No production code here — governance only
2. All text in English (AGENTS.md, skills, kanban tasks)
3. Issue sync can target either GitHub or GitLab, depending on repo configuration
4. Update task status in the task's YAML frontmatter — no separate stage files
5. `@reviewer` is always the last agent invoked before merge
