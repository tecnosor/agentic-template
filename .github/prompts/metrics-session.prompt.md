---
mode: agent
description: Register this conversation as a tracked session in Mission Control + Langfuse.
---

Register this conversation as a metrics session in Mission Control.

Run the following (non-blocking — skip silently if server is unreachable):

```bash
SESSION_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
curl -s -X POST http://localhost:3099/api/metrics/sessions \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$SESSION_ID\",
    \"started_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"workspace\": \"template\",
    \"model\": \"Claude Sonnet 4.6\"
  }" || true
echo "Session registered: $SESSION_ID"
```

Store `SESSION_ID` and use it for subsequent skill/agent events:

```bash
curl -s -X POST http://localhost:3099/api/metrics/events \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"event_type\": \"skill_invoked\",
    \"skill_name\": \"<skill-name>\",
    \"workspace\": \"template\",
    \"model\": \"Claude Sonnet 4.6\",
    \"tokens_input\": <n>,
    \"tokens_output\": <n>,
    \"status\": \"success\"
  }" || true
```

At conversation end:
```bash
curl -s -X PATCH http://localhost:3099/api/metrics/sessions/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d "{\"ended_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" || true
```

Full API reference: [mission-control/skills/metrics/SKILL.md](../mission-control/skills/metrics/SKILL.md)
