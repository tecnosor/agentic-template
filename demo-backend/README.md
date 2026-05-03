# demo-backend

Enterprise backend skeleton — **DDD + Clean Architecture + CQRS + Vertical Slice**

Built with **Node.js + TypeScript strict + Express + TSyringe + Zod + Vitest**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 (strict) |
| Framework | Express 4 |
| Dependency Injection | TSyringe |
| Validation | Zod |
| Testing | Vitest |
| DI decorators | `reflect-metadata` |

---

## Architecture

```
src/
├── domain/                       # Pure business logic — no framework imports
│   ├── entities/                 # Aggregate roots
│   ├── value-objects/            # Immutable typed wrappers
│   ├── errors/                   # Domain exceptions (extend DomainError)
│   └── repositories/             # Port interfaces + injection tokens
│
├── application/                  # CQRS use cases (Vertical Slice)
│   └── features/
│       └── {context}/
│           ├── commands/{name}/  # Command + Handler + Result + Test
│           └── queries/{name}/   # Query + Handler + Result
│
└── infrastructure/               # Adapters (Express, persistence, etc.)
    ├── container.ts              # TSyringe registrations
    ├── persistence/              # Repository implementations
    └── rest/
        ├── controllers/          # Express route handlers
        └── middleware/           # correlationId, errorHandler
```

---

## Getting Started

```bash
# Install
npm install

# Development (hot-reload)
npm run dev

# Tests
npm test

# Type check
npm run type-check

# Build
npm run build

# Start production build
npm start
```

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/users` | Create a user |
| GET | `/v1/users/:id` | Get a user by ID |

### Create User

```bash
curl -X POST http://localhost:3000/v1/users \
  -H 'Content-Type: application/json' \
  -d '{ "name": "Alice", "email": "alice@example.com" }'
```

Response `201`:
```json
{ "id": "uuid-v4" }
```

---

## Adding a New Feature

Use the `/vertical-slice` skill (via OpenCode) or follow the pattern manually:

1. Create `src/application/features/{context}/commands/{name}/`
2. Add `{Name}Command.ts`, `{Name}CommandHandler.ts`, `{Name}CommandResult.ts`
3. Add `{Name}CommandHandler.test.ts` (co-located)
4. Register handler in `src/infrastructure/container.ts`
5. Add route in the appropriate controller

---

## Error Format

All errors follow **RFC 7807 Problem Details**:

```json
{
  "type": "urn:error:user-not-found",
  "title": "USER_NOT_FOUND",
  "status": 404,
  "detail": "User not found: abc-123",
  "instance": "/v1/users/abc-123",
  "correlationId": "uuid"
}
```

---

## Conventions

- **Static factory** `of()` on commands and queries — never expose constructors
- **Constructor injection** everywhere — no service locator
- **Domain layer** has zero framework imports (no Express, no TSyringe in entities)
- **Errors** extend `DomainError` — never throw raw `Error` from domain
- **Repository interfaces** live in `domain/repositories/` — implementations in `infrastructure/persistence/`
