---
mode: agent
description: Scaffold a new CQRS command or query (vertical slice) for the Node.js backend.
---

Scaffold a new vertical slice (CQRS command or query).

Read the skill first: [vertical-slice](../mission-control/skills/vertical-slice/SKILL.md)

To proceed, provide:
1. **Type**: `command` or `query`
2. **Context name** (e.g., `user`, `order`, `notification`)
3. **Use-case name** (e.g., `create-user`, `get-user-by-id`)

Generated files go to:
```
src/application/features/{context}/{commands|queries}/{use-case-name}/
  {Name}Command.ts / {Name}Query.ts
  {Name}CommandHandler.ts / {Name}QueryHandler.ts
  {Name}CommandResult.ts / {Name}QueryResult.ts
  {Name}CommandHandler.test.ts / {Name}QueryHandler.test.ts
```

Architecture rules:
- Domain layer: zero framework imports, static factory methods, immutable value objects
- Application layer: handlers only — no business logic leaking to infrastructure
- Infrastructure layer: adapters only — REST controllers, DB repositories
