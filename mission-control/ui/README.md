# Kanban UI — Mission Control

## Status

> **Live** — Mission Control is fully implemented and running.
> Source of truth for tasks: `{repo}/kanban/tasks/*.md` files.

---

## Overview

A web-based multi-repo kanban board and metrics dashboard for workspace governance.

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Vue 3.5+ (Composition API) |
| State | Pinia |
| Styling | Tailwind CSS 4 |
| Build | Vite 6 |
| Language | TypeScript strict |
| Server | Node.js 22+ + Express |
| Database | SQLite (node:sqlite built-in) |

---

## Getting Started

```bash
# From repo root
cd mission-control/ui

# Install all dependencies (server + app)
npm run install:all

# Start both server (port 3099) and app (port 5174) concurrently
npm run dev
```

Open **http://localhost:5174** in your browser.

> **Requires Node.js 22+** (uses `node:sqlite` built-in module)

---

## Features

### Kanban Board (`/`)

- **7-column board**: BACKLOG → TODO → READY → DOING → TESTING → HUMAN_VALIDATION → DONE
- **Manual task creation** from the UI (`+ New Task`)
- **Move tasks from the modal** with server-side WIP and DONE guards
- **Comments** stored in `kanban/comments.json`
- **GitHub issue sync** per task
- **Filter by Repo** and **Filter by Origin**
- **Live refresh** for task create/update events via SSE, with polling fallback
- **Source of truth remains markdown files**, not a separate kanban database

### Metrics Dashboard (`📊 Metrics` tab)

- Summary cards: total tokens, sessions, skills invoked, agents invoked
- 30-day daily token usage bar chart
- Per-skill, per-agent, per-model usage tables
- Recent sessions and events feed
- **Live metrics updates via SSE**
- REST API at `http://localhost:3099/api/metrics`

---

## Configuration

Edit `server/src/config.ts` to match your workspace:

```ts
// Repos to scan for kanban tasks
export const REPOS = ['my-service', 'my-frontend', 'mission-control']

// GitHub org for PR/issue links (optional)
export const GITHUB_ORG = process.env.GITHUB_ORG ?? ''
```

Or copy `server/.env.example` → `server/.env` and set env vars.

---

## Data Source

Tasks are read from `{WORKSPACE_ROOT}/{repo}/kanban/tasks/*.md` files using YAML frontmatter plus markdown body sections.
Schema: see `ui/kanban-schema.md`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + app concurrently |
| `npm run dev:server` | Server only (port 3099) |
| `npm run dev:client` | Vue app only (port 5174) |
| `npm run build` | Build Vue app to `app/dist/` |
| `npm run install:all` | Install deps for server + app |

---

## Notes

- No authentication — this is an internal dev tool
- Kanban data lives in markdown files; metrics live in SQLite
- Task moves and manual task creation from UI write back to the markdown files
