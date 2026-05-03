# Naming Conventions

## Purpose

Consistent naming across all layers of the application reduces cognitive load and makes
the codebase navigable without IDE support.

---

## TypeScript / Node.js

### Files and Directories
| Type | Convention | Example |
|------|-----------|---------|
| Classes | `PascalCase.ts` | `CreateUserCommandHandler.ts` |
| Interfaces | `PascalCase.ts` | `UserRepository.ts` |
| Value Objects | `PascalCase.ts` | `Email.ts`, `UserId.ts` |
| Enums | `PascalCase.ts` | `UserStatus.ts` |
| Composables (Vue) | `camelCase` prefixed with `use` | `useNotification.ts` |
| Test files | `{OriginalName}.test.ts` | `CreateUserCommandHandler.test.ts` |
| Directories | `kebab-case` | `create-user/`, `user-repository/` |

### Identifiers
```typescript
// Classes: PascalCase
class CreateUserCommandHandler {}
class UserNotFoundError extends Error {}

// Interfaces: PascalCase (no "I" prefix)
interface UserRepository {}
interface CreateUserCommandResult {}

// Enums: PascalCase, values UPPER_SNAKE_CASE
enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// Functions/methods: camelCase (verb + noun)
function createUser() {}
async function findByEmail(email: string) {}

// Variables: camelCase
const userId = 'abc-123';
const emailAddress = new Email('alice@example.com');

// Constants: UPPER_SNAKE_CASE for module-level
const MAX_RETRY_ATTEMPTS = 3;
const USER_REPOSITORY = Symbol('UserRepository'); // DI token

// Private fields: camelCase (no underscore prefix)
class Handler {
  constructor(private readonly repository: UserRepository) {}
}
```

---

## Vue 3 Components

| Type | Convention | Example |
|------|-----------|---------|
| Component file | `PascalCase.vue` | `UserCard.vue`, `AppHeader.vue` |
| Component name | PascalCase | `<UserCard />`, `<AppHeader />` |
| Props | camelCase | `userId`, `isDisabled`, `itemCount` |
| Emits | kebab-case | `@click`, `@update:modelValue` |
| CSS classes (custom) | kebab-case | `.user-card`, `.nav-item` |

---

## Domain Layer Naming

### Entities
```typescript
// Entity = noun (represents the aggregate root)
class User {}
class Order {}
class Product {}
```

### Value Objects
```typescript
// Named after the concept, not the type
class Email {}           // ✅ not: EmailAddress, EmailString
class UserId {}          // ✅ not: UserIdentifier, Id
class Money {}           // ✅ not: Amount, Price (unless domain-specific)
```

### Domain Errors
```typescript
// Pattern: {Entity}{Reason}Error
class UserNotFoundError extends Error {}
class EmailAlreadyExistsError extends Error {}
class InsufficientPermissionsError extends Error {}
```

### Repository Interfaces
```typescript
// Pattern: {Entity}Repository
interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
}
```

---

## Application Layer Naming

### Commands
```typescript
// Pattern: {Verb}{Entity}Command
class CreateUserCommand {}
class UpdateUserProfileCommand {}
class DeleteOrderCommand {}

// Handlers
class CreateUserCommandHandler {}

// Results
interface CreateUserCommandResult {
  readonly id: string;
}
```

### Queries
```typescript
// Pattern: Get{Entity}Query, List{Entity}sQuery
class GetUserQuery {}
class ListUsersQuery {}
class GetOrderByIdQuery {}

// Handlers
class GetUserQueryHandler {}

// Results
interface GetUserQueryResult {}
interface ListUsersQueryResult {
  readonly items: UserSummary[];
  readonly total: number;
}
```

---

## Infrastructure Layer Naming

### REST Controllers
```typescript
// Pattern: {Entity}Controller
class UserController {}
class OrderController {}
```

### DTOs
```typescript
// Request DTOs: {Action}{Entity}RequestDto
class CreateUserRequestDto {}
class UpdateUserProfileRequestDto {}

// Response DTOs: {Entity}ResponseDto, {Entity}SummaryDto
class UserResponseDto {}
class UserSummaryDto {}
```

### Repository Implementations
```typescript
// Pattern: {Technology}{Entity}Repository
class PostgresUserRepository implements UserRepository {}
class InMemoryUserRepository implements UserRepository {}
class PrismaUserRepository implements UserRepository {}
```

---

## i18n Keys

```
{scope}.{feature}.{element}[.{variant}]

Examples:
  pages.home.hero.title
  pages.home.hero.subtitle
  components.header.nav.about
  common.buttons.submit
  common.errors.not-found
  common.labels.loading
```

Rules:
- Always lowercase with hyphens for multi-word segments
- English keys and values in `en.json`
- No abbreviations

---

## Git Branch Naming

```
feature/{TICKET-ID}-short-description
fix/{TICKET-ID}-short-description
chore/{TICKET-ID}-short-description
release/v1.2.0
hotfix/{TICKET-ID}-short-description
```

---

## Commit Message Format

```
{type}({scope}): {description}

Types: feat, fix, refactor, test, chore, docs, style, perf, ci
Scope: name of the feature/module (optional but recommended)
Description: imperative present tense, no period

Examples:
  feat(user): add email verification flow
  fix(auth): handle expired token gracefully
  test(user): add missing handler test for CreateUser
  chore(deps): bump vitest to 3.0.0
```
