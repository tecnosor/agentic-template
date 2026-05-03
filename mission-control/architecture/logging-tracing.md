# Logging & Tracing

## Purpose

Defines structured logging, distributed tracing, and observability standards for all
services. Consistent observability enables faster debugging and meaningful alerting.

---

## Structured Logging

### Format

All logs must be structured JSON. Never use free-form text logging.

```json
{
  "timestamp": "2025-01-15T10:30:00.123Z",
  "level": "INFO",
  "service": "user-service",
  "correlationId": "req-abc-123",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "User created successfully",
  "context": {
    "handler": "CreateUserCommandHandler",
    "durationMs": 45
  }
}
```

### Log Levels

| Level | Use Case |
|-------|---------|
| `DEBUG` | Development details (disabled in production) |
| `INFO` | Business events (entity created, operation completed) |
| `WARN` | Unexpected but recoverable situations |
| `ERROR` | Errors that need investigation (with stack trace) |
| `FATAL` | Service cannot continue (startup failures) |

---

## No PII in Logs (GDPR Rule)

**Never log:**
- Full names
- Email addresses
- Phone numbers
- Physical addresses
- National identification numbers
- IP addresses (anonymize to subnet)
- Session tokens, JWTs, API keys
- Passwords (obviously)
- Any value from `Authorization` header

**Safe to log:**
- User UUID (opaque, not personally identifiable on its own)
- Correlation IDs
- Entity IDs
- Status codes
- Duration in ms
- Error messages (without user-provided values)

```typescript
// ❌ WRONG — logs personal data
logger.info(`User created: email=${user.email.value} name=${user.name}`);

// ✅ CORRECT — logs only the opaque ID
logger.info('User created successfully', { userId: user.id.value });
```

---

## Correlation IDs

Every request must carry a `correlationId` (also called `traceId`) that propagates
through all service calls.

### Express Middleware

```typescript
import { randomUUID } from 'crypto';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) ?? randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}
```

### AsyncLocalStorage (Node.js context propagation)

```typescript
import { AsyncLocalStorage } from 'async_hooks';

const requestContext = new AsyncLocalStorage<{ correlationId: string }>();

export function getCorrelationId(): string {
  return requestContext.getStore()?.correlationId ?? 'unknown';
}
```

---

## Request/Response Logging

```typescript
// Log incoming requests
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    correlationId: req.correlationId,
  });
  next();
});

// Log outgoing responses (duration)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      correlationId: req.correlationId,
    });
  });
  next();
});
```

---

## Error Logging

```typescript
// Log with context — never just the message
logger.error('Failed to process request', {
  error: {
    name: err.name,
    message: err.message,
    stack: err.stack, // include in non-production environments
  },
  correlationId: req.correlationId,
  handler: 'CreateUserCommandHandler',
});
```

---

## Distributed Tracing (OpenTelemetry)

Use OpenTelemetry for distributed tracing across services.

### Setup (Node.js)

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Span Naming Convention

```
{layer}.{action}

Examples:
  application.CreateUserCommandHandler
  infrastructure.PostgresUserRepository.save
  infrastructure.UserController.createUser
  http.POST /users/v1/accounts
```

---

## Health Checks

Every service must expose:

```
GET /actuator/health   → { status: "UP" | "DOWN" }
GET /actuator/metrics  → Prometheus metrics format
```

### Implementation (Express)

```typescript
app.get('/actuator/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
  };
  const allUp = Object.values(checks).every(c => c === 'UP');
  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'UP' : 'DOWN',
    components: checks,
  });
});
```

---

## Metrics to Expose (Prometheus)

| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | Counter | `method`, `path`, `status` |
| `http_request_duration_ms` | Histogram | `method`, `path` |
| `command_handler_duration_ms` | Histogram | `handler` |
| `query_handler_duration_ms` | Histogram | `handler` |
| `errors_total` | Counter | `type`, `handler` |

---

## Log Aggregation

In production, logs should be shipped to a central log aggregation system:

- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **Loki + Grafana**: Lightweight alternative
- **Cloud-native**: AWS CloudWatch, Azure Monitor, GCP Cloud Logging

Regardless of provider, ensure:
- Log retention: minimum 90 days for production
- Log access: role-based (not all developers can see production logs)
- Log search: indexed on `correlationId`, `userId`, `level`, `service`
