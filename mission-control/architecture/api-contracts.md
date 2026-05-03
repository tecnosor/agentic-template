# API Contracts

## Purpose

Defines the standards for designing, versioning, and documenting REST APIs across all
services. Consistent API design reduces integration errors and improves developer
experience.

---

## REST API Design Principles

### Base Path

```
/{service-name}/v{major-version}/{resource}

Examples:
  /users/v1/accounts
  /orders/v1/orders/{id}
  /notifications/v1/notifications
```

**Rules:**
- Always include version prefix (`v1`, `v2`)
- Use plural nouns for collections
- Lowercase kebab-case for multi-word resources
- Never use verbs in paths (use HTTP methods instead)

---

## HTTP Methods

| Method | Usage | Request Body | Response Body |
|--------|-------|-------------|---------------|
| `GET` | Read resource(s) | None | Resource or collection |
| `POST` | Create resource | Resource payload | Created resource |
| `PUT` | Full update | Complete resource | Updated resource |
| `PATCH` | Partial update | Partial payload | Updated resource |
| `DELETE` | Delete resource | None | 204 No Content |

---

## HTTP Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| `200 OK` | Success | GET, PUT, PATCH |
| `201 Created` | Resource created | POST |
| `204 No Content` | Success, no body | DELETE |
| `400 Bad Request` | Validation error | Invalid input |
| `401 Unauthorized` | Not authenticated | Missing/invalid token |
| `403 Forbidden` | Not authorized | Insufficient permissions |
| `404 Not Found` | Resource not found | Entity does not exist |
| `409 Conflict` | Conflict | Duplicate resource, stale data |
| `422 Unprocessable Entity` | Business rule violation | Domain error |
| `500 Internal Server Error` | Unexpected error | Unhandled exceptions |

---

## Error Response Format (RFC 7807 Problem Details)

```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "The request body is invalid.",
  "instance": "/users/v1/accounts",
  "errors": {
    "email": "must be a valid email address",
    "name": "must not be blank"
  }
}
```

**Implementation (Express / Node.js):**

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      type: 'https://api.example.com/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: err.message,
      instance: req.path,
    });
  }
  if (err instanceof DomainNotFoundError) {
    return res.status(404).json({
      type: 'https://api.example.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: err.message,
      instance: req.path,
    });
  }
  // ... other mappings
  return res.status(500).json({ title: 'Internal Server Error', status: 500 });
});
```

---

## Pagination

### Request

```
GET /users/v1/accounts?page=1&size=20&sort=createdAt&order=desc
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | `1` | — | 1-based page number |
| `size` | `20` | `100` | Items per page |
| `sort` | resource-specific | — | Field name |
| `order` | `asc` | — | `asc` or `desc` |

### Response

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Response Envelope (Collections)

```json
{
  "data": [
    { "id": "...", "name": "..." }
  ],
  "pagination": { ... }
}
```

## Response Envelope (Single Resource)

Return the resource directly — no wrapper for single-object responses:

```json
{
  "id": "abc-123",
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## Date and Time

- All timestamps in **ISO 8601 UTC**: `2025-01-15T10:30:00Z`
- Never return epoch milliseconds
- Field names: `createdAt`, `updatedAt`, `deletedAt`, `expiresAt`

---

## Identifiers

- Use **UUID v4** for all entity IDs
- Return as lowercase string: `"id": "550e8400-e29b-41d4-a716-446655440000"`
- Never expose auto-increment database IDs in APIs

---

## OpenAPI Documentation

Every service must include an OpenAPI 3.1 specification.

**Location**: `src/infrastructure/rest/openapi/openapi.yaml`

**Required sections:**
- `info.title`, `info.version`, `info.description`
- `components.schemas` for all request/response bodies
- `components.securitySchemes` for authentication
- Error response schemas using RFC 7807 format

**Validation:**
```bash
# Validate spec
npx @redocly/cli lint openapi.yaml

# Generate docs
npx @redocly/cli preview-docs openapi.yaml
```

---

## Authentication Headers

When using a gateway-forwarded auth pattern:

| Header | Description | Example |
|--------|-------------|---------|
| `X-User-Id` | Authenticated user UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `X-User-Email` | Authenticated user email | `alice@example.com` |
| `X-User-Role` | User role | `USER`, `ADMIN` |

**Security rules:**
- Never trust these headers unless they come from the internal gateway
- Strip these headers at the gateway from external requests
- In tests, use a mock middleware that injects these values

---

## Versioning Strategy

| Version | API change | Action |
|---------|-----------|--------|
| Patch (1.0.x) | Bug fix, non-breaking | No version bump |
| Minor (1.x.0) | Additive change (new field, new endpoint) | No version bump |
| Major (x.0.0) | Breaking change (removed field, changed type) | Increment `v1` → `v2` |

**Deprecation policy:**
- Announce deprecation with `Deprecation` and `Sunset` response headers
- Support deprecated version for at least 3 months
- Document migration path in changelog
