---
name: vertical-slice
description: >-
  Scaffolds a new CQRS command or query following the Vertical Slice pattern with
  handler, result, and test. TypeScript / Node.js version. Generates all files for a
  feature slice in src/application/features/. Use when implementing a new use case,
  feature, or business operation. Keywords: vertical slice, command, query, CQRS,
  handler, feature, use case, scaffold, vertical slice, comando, consulta, caso de uso.
allowed-tools:
  - create_file
  - read_file
  - file_search
---

# Vertical Slice Skill

## Purpose

Scaffold a complete **Command** or **Query** vertical slice with:
- The command/query class
- The handler
- The result type
- A unit test

---

## File Structure

```
src/application/features/{context}/{commands|queries}/{name}/
├── {Name}Command.ts            (or {Name}Query.ts)
├── {Name}CommandHandler.ts     (or {Name}QueryHandler.ts)
├── {Name}CommandResult.ts      (or {Name}QueryResult.ts)
└── {Name}CommandHandler.test.ts
```

---

## Command Template

### `{Name}Command.ts`

```typescript
export interface {Name}CommandInput {
  // Add properties here
}

export class {Name}Command {
  private constructor(
    public readonly property: string,
    // Add more properties
  ) {}

  static of(input: {Name}CommandInput): {Name}Command {
    // Validate input here if needed
    return new {Name}Command(
      input.property,
    );
  }
}
```

### `{Name}CommandResult.ts`

```typescript
export interface {Name}CommandResult {
  readonly id: string;
  // Add result properties
}
```

### `{Name}CommandHandler.ts`

```typescript
import { injectable, inject } from 'tsyringe';
import { {Name}Command } from './{Name}Command';
import { {Name}CommandResult } from './{Name}CommandResult';
import { {Entity}Repository } from '../../../../domain/repositories/{Entity}Repository';
import { {ENTITY}_REPOSITORY } from '../../../../domain/repositories/tokens';

@injectable()
export class {Name}CommandHandler {
  constructor(
    @inject({ENTITY}_REPOSITORY)
    private readonly repository: {Entity}Repository,
  ) {}

  async handle(command: {Name}Command): Promise<{Name}CommandResult> {
    // 1. Build domain entity
    // 2. Persist
    // 3. Return result
    throw new Error('Not implemented');
  }
}
```

### `{Name}CommandHandler.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { {Name}CommandHandler } from './{Name}CommandHandler';
import { {Name}Command } from './{Name}Command';
import type { {Entity}Repository } from '../../../../domain/repositories/{Entity}Repository';

describe('{Name}CommandHandler', () => {
  let repository: {Entity}Repository;
  let handler: {Name}CommandHandler;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      // Add other methods
    } as unknown as {Entity}Repository;
    handler = new {Name}CommandHandler(repository);
  });

  describe('when input is valid', () => {
    it('should execute successfully and return an ID', async () => {
      // Arrange
      const command = {Name}Command.of({
        // Set valid input
      });

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.id).toBeDefined();
      expect(repository.save).toHaveBeenCalledOnce();
    });
  });

  describe('when input is invalid', () => {
    it('should throw a domain error', async () => {
      // Arrange
      const command = {Name}Command.of({
        // Set invalid input
      });

      // Act + Assert
      await expect(handler.handle(command)).rejects.toThrow();
    });
  });
});
```

---

## Query Template

### `{Name}Query.ts`

```typescript
export interface {Name}QueryInput {
  id: string;
}

export class {Name}Query {
  private constructor(
    public readonly id: string,
  ) {}

  static of(input: {Name}QueryInput): {Name}Query {
    return new {Name}Query(input.id);
  }
}
```

### `{Name}QueryResult.ts`

```typescript
export interface {Name}QueryResult {
  readonly id: string;
  // Add more fields — read model
}
```

### `{Name}QueryHandler.ts`

```typescript
import { injectable, inject } from 'tsyringe';
import { {Name}Query } from './{Name}Query';
import { {Name}QueryResult } from './{Name}QueryResult';
import { {Entity}Repository } from '../../../../domain/repositories/{Entity}Repository';
import { {ENTITY}_REPOSITORY } from '../../../../domain/repositories/tokens';
import { {Entity}NotFoundError } from '../../../../domain/errors/{Entity}NotFoundError';

@injectable()
export class {Name}QueryHandler {
  constructor(
    @inject({ENTITY}_REPOSITORY)
    private readonly repository: {Entity}Repository,
  ) {}

  async handle(query: {Name}Query): Promise<{Name}QueryResult> {
    const entity = await this.repository.findById(query.id);
    if (!entity) {
      throw new {Entity}NotFoundError(query.id);
    }
    return {
      id: entity.id,
      // Map fields
    };
  }
}
```

---

## Scaffold Command

When asked to create a slice, ask:

1. **Type**: Command or Query?
2. **Context name** (e.g., `user`, `order`, `product`)
3. **Action name** (e.g., `CreateUser`, `UpdateOrder`, `GetProduct`)
4. **Entity/domain** the slice operates on

Then generate all files from the templates above, replacing placeholders.

---

## Conventions

- Use **static factory method** `of()` — never expose constructors directly
- **Constructor injection** always — no service locator, no global state
- **Read-only properties** in commands and queries
- **No framework code** (no Express req/res) in handlers — only domain types
- **Co-located tests** — test file in the same directory as the handler
