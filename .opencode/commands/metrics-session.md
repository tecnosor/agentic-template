---
description: Register a new metrics session with Mission Control at the start of a conversation.
---

# Start Metrics Session

Register this conversation as a tracked session in Mission Control + Langfuse.

Run the following at the beginning of every conversation (non-blocking — skip silently if server is unreachable):

```bash
SESSION_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
echo "METRICS_SESSION_ID=$SESSION_ID"
curl -s -X POST http://localhost:3099/api/metrics/sessions \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$SESSION_ID\",
    \"started_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"workspace\": \"template\",
    \"model\": \"$(echo $OPENCODE_MODEL | sed 's|.*/||' || echo 'unknown')\"
  }" || true
```

Store `$SESSION_ID` for all subsequent `skill_invoked` and `agent_invoked` events in this session.

**Alternative (Node.js helper)**:
```bash
OPENCODE_SESSION_ID=$SESSION_ID node .opencode/utils/metrics-reporter.js session_start \
  '{"model":"claude-sonnet-4-5","workspace":"template"}'
```

Full API reference: `mission-control/skills/metrics/SKILL.md`
