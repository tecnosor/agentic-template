---
name: new-slice
description: Scaffold a new CQRS command or query (vertical slice)
---

# Scaffold New Vertical Slice

Use the `/vertical-slice` skill to scaffold a new CQRS command or query.

## Usage

1. Tell me: **command** or **query**?
2. Provide the **context name** (e.g., `user`, `order`, `notification`)
3. Provide the **use-case name** (e.g., `create-user`, `get-user-by-id`)

The skill will generate:
- `{Name}Command.ts` / `{Name}Query.ts`
- `{Name}CommandHandler.ts` / `{Name}QueryHandler.ts`
- `{Name}CommandResult.ts` / `{Name}QueryResult.ts`
- `{Name}CommandHandler.test.ts` / `{Name}QueryHandler.test.ts`

Located at:
```
src/application/features/{context}/{commands|queries}/{use-case-name}/
```

## Read the skill for full templates and rules

@/mission-control/skills/vertical-slice/SKILL.md
