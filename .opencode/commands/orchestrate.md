---
description: Invoke the orchestrator to start or resume the active task from kanban.
---

# Orchestrate

Start the task lifecycle for the current branch or active kanban ticket.

Invoke `@orchestrator` with the following context:

1. Check which task files currently have `status: doing` in `kanban/tasks/` (if any)
2. If no task is active, check for task files with `status: ready` to pick up
3. If no READY tasks, report kanban status and wait for human input
4. Run the full orchestration workflow: context → lang-enforcer → builder + guardian → validator → reviewer

The orchestrator will coordinate all sub-agents in the correct order.
