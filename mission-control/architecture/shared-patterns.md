# Shared Patterns

## Purpose

Describes the core architectural patterns used across all services in this workspace.
These patterns apply regardless of runtime (Node.js backend or Vue 3 frontend).

---

## Domain-Driven Design (DDD)

### Aggregate Root

An aggregate root is the only entry point to a cluster of domain objects.

```typescript
// ✅ Correct — all mutations go through the aggregate root
class Order {
  private readonly _id: OrderId;
  private _status: OrderStatus;
  private _items: OrderItem[] = [];

  private constructor(id: OrderId) {
    this._id = id;
    this._status = OrderStatus.PENDING;
  }

  static create(input: CreateOrderInput): Order {
    const order = new Order(OrderId.generate());
    // validate input
    return order;
  }

  addItem(product: Product, quantity: number): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new OrderAlreadyConfirmedError(this._id.value);
    }
    this._items.push(OrderItem.create(product, quantity));
  }

  get id(): OrderId { return this._id; }
  get status(): OrderStatus { return this._status; }
  get items(): readonly OrderItem[] { return Object.freeze([...this._items]); }
}
```

### Value Objects

Immutable, self-validating types that represent concepts without identity.

```typescript
class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static of(raw: string): Email {
    const normalized = raw.toLowerCase().trim();
    if (!normalized.includes('@')) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
```

**Rules:**
- Immutable: no setters, all fields `readonly`
- Self-validating: throw domain error in `of()` factory if invalid
- Implement `equals()` for structural comparison
- Implement `toString()` for serialization

### Domain Errors

```typescript
// Base class
abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Entity errors
class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super(`User not found: ${id}`);
  }
}

class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
  }
}
```

**Rules:**
- Never throw `new Error()` directly from domain logic
- One error class per distinct business rule violation
- Error name = class name (via `this.name = this.constructor.name`)

---

## Clean Architecture Layers

```
┌─────────────────────────────────────┐
│  Infrastructure (REST, DB, Cache)   │
│  ┌───────────────────────────────┐  │
│  │      Application (CQRS)       │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │     Domain (pure TS)    │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Dependency rule: outer layers depend on inner layers.
Inner layers NEVER import from outer layers.
```

### Layer Imports (enforced)

| Layer | Can import | Cannot import |
|-------|-----------|---------------|
| Domain | Nothing (pure TS) | Application, Infrastructure |
| Application | Domain only | Infrastructure |
| Infrastructure | Application, Domain | N/A |

Verify with:
```bash
# Detect infrastructure imports in domain layer
grep -r "infrastructure" src/domain/ && echo "❌ violation" || echo "✅ clean"

# Detect framework imports in domain layer  
grep -r "express\|fastify\|prisma\|redis" src/domain/ && echo "❌ violation" || echo "✅ clean"
```

---

## CQRS (Command Query Responsibility Segregation)

### Commands (Write Operations)

- Change state
- Return only the ID of the created/updated entity (or void for deletes)
- Use `@Transactional` semantics (one unit of work per command)
- Publish domain events when needed

### Queries (Read Operations)

- Never mutate state
- Return read models (DTOs), not domain entities
- Can bypass the domain layer for performance (read directly from DB)
- Use `readOnly: true` transactions

### Handlers

```typescript
// Command handler — write, return minimal result
@injectable()
export class CreateUserCommandHandler {
  async handle(command: CreateUserCommand): Promise<CreateUserCommandResult> {
    // 1. Validate via domain
    // 2. Persist
    // 3. Publish events (optional)
    // 4. Return { id }
  }
}

// Query handler — read, return full DTO
@injectable()
export class GetUserQueryHandler {
  async handle(query: GetUserQuery): Promise<GetUserQueryResult> {
    // Read-only — fetch and map to DTO
  }
}
```

---

## Repository Pattern

```typescript
// Domain interface (no framework dependencies)
interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  delete(id: UserId): Promise<void>;
}

// Infrastructure implementation
class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(user: User): Promise<void> {
    await this.db.query(
      'INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET email = $2',
      [user.id.value, user.email.value]
    );
  }
}
```

---

## Dependency Injection (TSyringe)

### Registration tokens

```typescript
// src/domain/repositories/tokens.ts
export const USER_REPOSITORY = Symbol('UserRepository');
export const EMAIL_SERVICE = Symbol('EmailService');
```

### Registration (composition root)

```typescript
// src/infrastructure/container.ts
import { container } from 'tsyringe';
import { PostgresUserRepository } from './persistence/PostgresUserRepository';
import { USER_REPOSITORY } from '../domain/repositories/tokens';

container.registerSingleton<UserRepository>(USER_REPOSITORY, PostgresUserRepository);
```

### Injection in handlers

```typescript
@injectable()
export class CreateUserCommandHandler {
  constructor(
    @inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}
}
```

---

## Vertical Slice Architecture

Each use case lives in its own self-contained directory:

```
src/application/features/{context}/{commands|queries}/{use-case-name}/
├── {Name}Command.ts
├── {Name}CommandHandler.ts
├── {Name}CommandResult.ts
└── {Name}CommandHandler.test.ts
```

**Benefits:**
- Change cohesion: all code for a feature is in one place
- Easy to delete a feature (remove one folder)
- No shared state between slices
