---
name: test-driven
description: >-
  Enforces TDD practices and test quality standards. Validates naming conventions,
  AAA structure, test isolation, and coverage minimums. Backend: Vitest. Frontend:
  Vitest + @vue/test-utils. Use when writing tests, reviewing test quality, or setting
  up a TDD workflow. Keywords: test, TDD, coverage, vitest, unit test, integration test,
  mock, prueba, cobertura, prueba unitaria, test-driven, AAA, arrange-act-assert.
allowed-tools:
  - read_file
  - create_file
  - replace_string_in_file
  - file_search
  - run_in_terminal
---

# Test-Driven Skill

## Test Framework

| Layer | Framework | Runner |
|-------|-----------|--------|
| Backend (Node.js) | Vitest | `vitest run` |
| Frontend (Vue 3) | Vitest + `@vue/test-utils` | `vitest run` |
| Integration | Vitest + Testcontainers (optional) | `vitest run --config vitest.integration.config.ts` |

---

## Naming Convention

```typescript
// File: CreateUserCommandHandler.test.ts
// Location: mirror of src/ structure in tests/

describe('CreateUserCommandHandler', () => {
  describe('when user data is valid', () => {
    it('should create a user and return the ID', async () => { /* ... */ });
    it('should publish a UserCreatedEvent', async () => { /* ... */ });
  });

  describe('when email is already taken', () => {
    it('should throw EmailAlreadyExistsError', async () => { /* ... */ });
  });
});
```

Rules:
- `describe` block: class or function name (exact match)
- Inner `describe`: scenario / condition (`when ...`)
- `it` block: expected outcome (`should ...`)
- No abbreviations in test names

---

## AAA Structure (Arrange-Act-Assert)

```typescript
it('should create a user and return the ID', async () => {
  // Arrange
  const repository = {
    save: vi.fn().mockResolvedValue(undefined),
    findByEmail: vi.fn().mockResolvedValue(null),
  } satisfies UserRepository;
  const handler = new CreateUserCommandHandler(repository);
  const command = CreateUserCommand.of({
    email: 'alice@example.com',
    name: 'Alice',
  });

  // Act
  const result = await handler.handle(command);

  // Assert
  expect(result.userId).toBeDefined();
  expect(repository.save).toHaveBeenCalledOnce();
});
```

---

## Test Isolation Rules

- **No shared mutable state** between tests
- **Reset mocks** between tests: use `vi.clearAllMocks()` in `beforeEach`
- **No real I/O** in unit tests (no real DB, no real HTTP calls, no file system)
- **No app initialization** in unit tests (no `createApp()`, no `startServer()`)
- **One concern per test**: each `it` block tests exactly one behavior

```typescript
describe('CreateUserCommandHandler', () => {
  let repository: UserRepository;
  let handler: CreateUserCommandHandler;

  beforeEach(() => {
    // Fresh mocks for every test
    repository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
    };
    handler = new CreateUserCommandHandler(repository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
```

---

## What to Test vs What to Skip

### ✅ Always test
- Command handlers (every one must have a test)
- Query handlers (every one must have a test)
- Domain entities (business rules, invariants)
- Value objects (validation, equality)
- Domain services (complex orchestration)

### ⚠️ Test with integration test (not unit)
- Database repositories (use real DB via Testcontainers, or in-memory)
- HTTP controllers (use Supertest against a test app instance)
- External API adapters (mock the HTTP client, test the adapter logic)

### ❌ Do NOT test
- DTOs (data classes with no logic)
- Framework configuration files
- Auto-generated code
- Trivial getters/setters

---

## Vue 3 Component Testing

```typescript
// ExampleComponent.test.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ExampleComponent from '@/components/ExampleComponent.vue';

describe('ExampleComponent', () => {
  it('should render the title prop', () => {
    // Arrange + Act
    const wrapper = mount(ExampleComponent, {
      props: { title: 'Hello World' },
    });

    // Assert
    expect(wrapper.find('h1').text()).toBe('Hello World');
  });

  it('should emit click event when button is pressed', async () => {
    const wrapper = mount(ExampleComponent);

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
```

---

## Coverage Minimums

| Layer | Minimum Coverage |
|-------|-----------------|
| Domain (entities, value objects, services) | 90% |
| Application (command/query handlers) | 85% |
| Infrastructure (adapters) | 60% |
| Overall | 75% |

```bash
# Check coverage
npx vitest run --coverage
```

---

## TDD Workflow

```
1. Write failing test (RED)
   ↓
2. Write minimal code to pass (GREEN)
   ↓
3. Refactor with tests still passing (REFACTOR)
   ↓
4. Repeat for next behavior
```

---

## Running Tests

```bash
# All unit tests
npm run test

# Watch mode (TDD cycle)
npm run test -- --watch

# With coverage
npm run test -- --coverage

# Single file
npm run test -- CreateUserCommandHandler.test.ts

# Single test
npm run test -- -t "should create a user"
```

---

## Test File Location Convention

```
src/
└── application/
    └── features/
        └── user/
            └── commands/
                └── create-user/
                    ├── CreateUserCommand.ts
                    ├── CreateUserCommandHandler.ts
                    ├── CreateUserCommandResult.ts
                    └── CreateUserCommandHandler.test.ts  ← co-located
```

Tests are **co-located** with the code they test (same directory).
