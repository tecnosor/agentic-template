---
name: code-review
description: >-
  Structured code review workflow: architecture boundaries, business logic correctness,
  test coverage, security, language compliance, and style. Outputs categorized findings
  as BLOCKING / WARNING / PASS. Read-only — never modifies code. Use when reviewing
  PRs, auditing existing code, or validating implementation against architecture rules.
  Keywords: review, code quality, architecture, PR, pull request, clean architecture,
  DDD, CQRS, boundaries, revisión de código, calidad, arquitectura, pull request.
allowed-tools:
  - read_file
  - file_search
  - grep_search
  - semantic_search
  - run_in_terminal
---

# Code Review Skill

**This skill is read-only. It does NOT modify any code.**

---

## Review Checklist

### 1. Architecture Boundaries

#### DDD Layer Violations — BLOCKING if found
```bash
# Domain must not import from infrastructure
grep -rn "import.*infrastructure" src/domain/ --include="*.ts" 2>/dev/null

# Domain must not import framework code
grep -rn "import.*express\|import.*fastify\|import.*typeorm\|import.*prisma" \
  src/domain/ --include="*.ts" 2>/dev/null

# Application must not import from infrastructure directly (only via ports/interfaces)
grep -rn "import.*infrastructure/persistence\|import.*infrastructure/rest" \
  src/application/ --include="*.ts" 2>/dev/null
```

Expected dependency direction:
```
infrastructure/ → application/ → domain/
infrastructure/ → domain/
(reverse is NEVER allowed)
```

#### Cross-Context Imports — WARNING
```bash
# Check for direct cross-context imports (should go via shared context only)
grep -rn "from '.*contexts/[a-z]*/domain\|from '.*contexts/[a-z]*/application'" \
  src/contexts/ --include="*.ts" 2>/dev/null | \
  grep -v "shared" | head -20
```

---

### 2. CQRS Pattern Compliance

#### Commands
```bash
# Every command should have a corresponding handler
find src/application -name "*Command.ts" 2>/dev/null | while read f; do
  handler=$(echo "$f" | sed 's/Command.ts/CommandHandler.ts/')
  [ ! -f "$handler" ] && echo "MISSING HANDLER: $handler"
done

# Commands should NOT have side effects on read operations
grep -rn "readOnly\|SELECT\|find\|get" \
  src/application --include="*CommandHandler.ts" 2>/dev/null | head -10
```

#### Queries
```bash
# Queries should be read-only — no mutations
grep -rn "save\|create\|update\|delete\|insert\|remove" \
  src/application --include="*QueryHandler.ts" 2>/dev/null | head -10
```

---

### 3. Business Logic Placement

```bash
# Business logic should NOT be in controllers/REST layer
grep -rn "if\|switch\|for\|while\|calculate\|validate\|compute" \
  src/infrastructure/rest/controllers/ --include="*.ts" 2>/dev/null | head -20

# No direct database access in application or domain layer
grep -rn "prisma\.\|typeorm\.\|knex\.\|pool\.query\|db\." \
  src/domain/ src/application/ --include="*.ts" 2>/dev/null | head -10
```

---

### 4. Security Checks

```bash
# Input validation at REST boundary
grep -rn "class.*Dto\|class.*Request" src/infrastructure --include="*.ts" 2>/dev/null | head -20
# Verify each DTO has validation decorators or Zod/Joi schema

# No sensitive data in logs
grep -rn "console\.log.*password\|console\.log.*token\|logger.*secret" \
  src/ --include="*.ts" 2>/dev/null | head -10

# Parameterized queries (no raw string concat with user input)
grep -rn "query.*\+.*req\.\|exec.*\`.*\${" \
  src/infrastructure --include="*.ts" 2>/dev/null | head -10

# No secrets in code
grep -rn "api_key\s*=\s*['\"][a-zA-Z0-9]\|password\s*=\s*['\"][a-zA-Z0-9]" \
  src/ --include="*.ts" 2>/dev/null | head -10
```

---

### 5. Test Coverage

```bash
# Every handler should have a test
find src/application -name "*CommandHandler.ts" -o -name "*QueryHandler.ts" 2>/dev/null | \
  while read f; do
    base=$(basename "$f" .ts)
    testfile=$(find src -name "${base}.test.ts" 2>/dev/null)
    [ -z "$testfile" ] && echo "MISSING TEST: $f"
  done

# No SpringBootTest equivalent (no full app initialization in unit tests)
grep -rn "createApp\|startServer\|listen(" \
  src/ --include="*.test.ts" 2>/dev/null | head -10
```

---

### 6. TypeScript Strict Mode

```bash
# No 'any' type usage
grep -rn ": any\b\|as any\b" src/ --include="*.ts" --exclude-dir="*.test.ts" 2>/dev/null | head -20

# No non-null assertions without reason
grep -rn "![^=]" src/ --include="*.ts" 2>/dev/null | grep -v "!=" | grep -v "!==" | head -20
```

---

### 7. Language Compliance (English)

```bash
grep -rn "[áéíóúñüÁÉÍÓÚÑÜàèìòùâêîôû]" \
  src/ --include="*.ts" --include="*.vue" 2>/dev/null | head -10
```

---

## Output Format

```
## Code Review — {Feature/PR Title}
Date: YYYY-MM-DD
Reviewer: @code-review (automated)

### 🔴 BLOCKING (must fix before merge)

1. **Architecture Violation**: `src/domain/model/User.ts` imports from `infrastructure/persistence`
   - Rule: Domain layer must have zero framework dependencies
   - Fix: Define a repository interface in domain, inject via DI

### 🟡 WARNING (should fix, non-blocking)

1. **Missing test**: `CreateUserCommandHandler.ts` has no corresponding test file
   - Rule: Every handler MUST have a unit test
   - Suggestion: Add `CreateUserCommandHandler.test.ts` with Vitest

### ✅ PASSING

- [x] No secrets or hardcoded credentials found
- [x] Input validation present at REST boundary
- [x] No `any` types in production code
- [x] All imports respect layer boundaries
- [x] Language: English only

---

**Result**: ❌ CHANGES REQUIRED — resolve 1 blocking issue before merge
```

---

## Severity Definitions

| Level | Symbol | Meaning |
|-------|--------|---------|
| BLOCKING | 🔴 | Must be fixed before merge — architecture violation, security issue, or test missing |
| WARNING | 🟡 | Should be fixed — code smell, missing edge case, or style issue |
| PASSING | ✅ | Check passed — no action needed |
