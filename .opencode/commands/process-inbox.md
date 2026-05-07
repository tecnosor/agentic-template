---
description: Check agent-inbox/pending/ for queued orchestration jobs and process them one by one using the full orchestrator → builder → guardian → validator workflow.
---

# Process Agent Inbox

Check the agent inbox for pending jobs and process them.

## Step 0 — Register metrics session

```bash
SESSION_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
curl -s -X POST http://localhost:3099/api/metrics/sessions \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$SESSION_ID\",
    \"started_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"workspace\": \"template\",
    \"model\": \"$(cat opencode.json | python3 -c 'import sys,json; print(json.load(sys.stdin).get(\"model\",\"unknown\"))' 2>/dev/null || echo 'unknown')\"
  }" || true
```

## Step 1 — List pending jobs

```bash
PENDING=$(ls agent-inbox/pending/*.json 2>/dev/null | wc -l | tr -d ' ')
echo "Pending jobs: $PENDING"
ls -1 agent-inbox/pending/*.json 2>/dev/null | sort | head -10 | while read f; do
  echo "---"
  cat "$f"
done
```

If `$PENDING` is 0, reply: "No pending agent jobs. Inbox is clear ✅"

## Step 2 — Process jobs in order (oldest first)

For each pending job:

1. **Read** the job file to get `id`, `taskId`, `repo`, `action`, `context`
2. **Claim** it:
   ```bash
   curl -s -X POST http://localhost:3099/api/orchestrate/inbox/<jobId>/claim
   ```
3. **Execute** based on `action`:
   - `execute` → full workflow: `@orchestrator` → `@builder` → `@guardian` → `@validator`
   - `review` → `@guardian` reviews, adds comment, optionally queues `@builder`
   - `plan` → `@orchestrator` plans, creates sub-tasks if needed
4. **Record metrics** event:
   ```bash
   curl -s -X POST http://localhost:3099/api/metrics/events \
     -H "Content-Type: application/json" \
     -d "{\"session_id\": \"$SESSION_ID\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"event_type\": \"skill_invoked\", \"skill_name\": \"agent-inbox\", \"workspace\": \"template\", \"task_id\": \"<taskId>\", \"status\": \"success\"}" || true
   ```
5. **Finish** the job:
   ```bash
   curl -s -X POST http://localhost:3099/api/orchestrate/inbox/<jobId>/finish \
     -H "Content-Type: application/json" \
     -d '{"outcome":"done"}'
   ```
6. Repeat for next job.

## Step 3 — Close session

```bash
curl -s -X PATCH http://localhost:3099/api/metrics/sessions/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d "{\"ended_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" || true
```
