---
description: Check agent-inbox/pending/ and process queued orchestration jobs using the full workflow.
---

# Process Agent Inbox

Check for pending orchestration jobs and execute them.

## Instructions

1. Register a metrics session (see metrics-session.prompt.md).
2. Check pending jobs:
   ```bash
   PENDING=$(ls agent-inbox/pending/*.json 2>/dev/null | wc -l | tr -d ' ')
   echo "Pending: $PENDING"
   ls -1 agent-inbox/pending/*.json 2>/dev/null | sort | head -5 | xargs -I{} cat {}
   ```
3. For each job (oldest first):
   - Claim: `curl -s -X POST http://localhost:3099/api/orchestrate/inbox/<jobId>/claim`
   - Execute based on `action`:
     - `execute` → full workflow via `@orchestrator`
     - `review` → `@guardian` reviews, adds comment
     - `plan` → `@orchestrator` plans + subtasks
   - Emit `skill_invoked` metric event with `skill_name: "agent-inbox"` and `task_id: "<taskId>"`
   - Finish: `curl -s -X POST http://localhost:3099/api/orchestrate/inbox/<jobId>/finish -d '{"outcome":"done"}'`
4. Close session.

Run this prompt via `#process-inbox` in chat to process the queue.
