# Mission Control

Workspace governance repository for this project template.

Contains no production code. Manages agents, skills, kanban, compliance, and architecture standards.

## Structure

```
mission-control/
├── AGENTS.md           # Agent guide and workflow reference
├── README.md           # This file
├── kanban/             # Workspace-wide kanban board
│   └── tasks/          # One .md file per task (status in YAML frontmatter)
├── skills/             # Shared skill definitions
│   ├── build-check/
│   ├── code-review/
│   ├── compliance-eu/
│   ├── git-flow/
│   ├── github-cli/
│   ├── history-scan/
│   ├── kanban-sync/
│   ├── lang-enforcer/
│   ├── project-status/
│   ├── secure-coder/
│   ├── test-driven/
│   └── vertical-slice/
└── architecture/
    └── standards.md    # DDD, Clean Architecture, CQRS standards
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

## Core Rules

1. No production code here — governance only
2. All text in English (AGENTS.md, skills, kanban tasks)
3. Max 2 tasks with `status: doing` at any time
4. Update task status in the task's YAML frontmatter — no separate stage files
5. `@reviewer` is always the last agent invoked before merge
