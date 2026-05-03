---
name: secure-coder
description: >-
  BLOCKING security checklist based on OWASP Top 10. Immediately stops task progression
  if critical violations found (secrets, injections, hardcoded credentials). Checks:
  no secrets in code, input validation at boundaries, injection prevention, no PII in
  logs, dependency CVEs, least privilege access. Use before every PR or when reviewing
  security-sensitive changes. Keywords: security, OWASP, secret, vulnerability, CVE,
  injection, API key, password, credential, token, PII, seguridad, vulnerabilidad,
  secreto, inyección, credencial.
allowed-tools:
  - read_file
  - file_search
  - grep_search
  - run_in_terminal
  - semantic_search
---

# Secure Coder Skill

## CRITICAL — Immediate STOP Conditions

If any of these are found, **STOP all work immediately** and report before proceeding:

```
🔴 CRITICAL SECURITY VIOLATION DETECTED
========================================
File: [path]
Line: [N]
Issue: [description]

THIS TASK CANNOT PROCEED UNTIL THIS IS RESOLVED.
```

Critical patterns to detect:
```bash
# Hardcoded secrets, keys, tokens, passwords
grep -rn "password\s*=\s*['\"][^$]" src/ --include="*.ts" --include="*.js" --include="*.yml"
grep -rn "api[_-]key\s*=\s*['\"]" src/ --include="*.ts" --include="*.js" --include="*.yml"
grep -rn "secret\s*=\s*['\"][^$]" src/ --include="*.ts" --include="*.js" --include="*.yml"
grep -rn "private[_-]key\s*=\s*['\"]" src/ --include="*.ts" --include="*.js"
```

---

## OWASP Top 10 Checklist

### A01 — Broken Access Control
Check: Does every endpoint use authenticated user ID for data scoping?
```bash
# Find route handlers — verify each checks user context
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" src/ --include="*.ts"
```
- ✅ PASS: All data queries filter by authenticated user ID
- 🔴 FAIL: Any query returns data for all users without filtering

### A02 — Cryptographic Failures
Check:
- ✅ No plaintext passwords in DB — using bcrypt or auth provider (Cognito, Auth0, etc.)
- ✅ Tokens use cryptographically secure random (`crypto.randomBytes`, not `Math.random()`)
- 🔴 FAIL: MD5 or SHA1 for security-sensitive operations

```bash
grep -rn "Math.random()" src/ --include="*.ts" --include="*.js"
grep -rn "createHash.*md5\|createHash.*sha1" src/ --include="*.ts"
```

### A03 — Injection
```bash
# SQL injection via string concatenation
grep -rn "query\`\|\.query(.*\+\|\.query(.*\$\{" src/ --include="*.ts"

# NoSQL injection
grep -rn "\$where\|\$regex" src/ --include="*.ts"
```
- ✅ PASS: All queries use parameterized queries or an ORM (Prisma, TypeORM, Drizzle)
- 🔴 FAIL: Any string concatenation in query construction

### A04 — Insecure Design
Check:
- ✅ Rate limiting on external API calls
- ✅ Idempotency keys on financial or sensitive write operations
- ✅ Input size limits enforced (no unbounded payload acceptance)
- 🟡 WARN: No rate limiting on any REST endpoint

### A05 — Security Misconfiguration
```bash
# Dev overrides that should not reach production
grep -rn "cors.*origin.*\*\|allowedOrigins.*\*" src/ --include="*.ts"
grep -rn "NODE_ENV.*development\|skipAuth\s*=\s*true" src/ --include="*.ts"
```
- 🔴 FAIL: CORS wildcard `*` in production config
- 🔴 FAIL: Auth bypass flags in production build
- ✅ PASS: Environment-specific configs gated by `NODE_ENV`

### A06 — Vulnerable and Outdated Components
```bash
npm audit --audit-level=high
```
- 🔴 FAIL: Any CRITICAL CVE in production dependencies
- 🟡 WARN: HIGH CVEs — document and plan remediation
- ✅ PASS: No critical CVEs

### A07 — Authentication Failures
Check:
- ✅ JWT validated via trusted issuer (Cognito, Auth0, Keycloak) — not locally rolled
- ✅ Auth headers come from gateway/proxy — not user-supplied
- ✅ Token expiration enforced
- 🔴 FAIL: Custom JWT verification bypassing the identity provider

### A08 — Software and Data Integrity Failures
```bash
# Check for eval() or dynamic code execution
grep -rn "eval(\|new Function(" src/ --include="*.ts" --include="*.js"
```
- 🔴 FAIL: `eval()` or `new Function()` with user-supplied data
- ✅ PASS: All dependencies in `package-lock.json` (locked versions)

### A09 — Security Logging and Monitoring Failures
```bash
# PII in logs
grep -rn "console\.log.*email\|console\.log.*password\|logger.*email\|logger.*password" src/ --include="*.ts"
grep -rn "console\.log.*token\|console\.log.*secret\|logger.*token\|logger.*secret" src/ --include="*.ts"
```
- 🔴 FAIL: PII (email, name, phone) in log statements
- 🔴 FAIL: Secrets or tokens logged
- ✅ PASS: Logs contain correlation IDs and event types only

### A10 — Server-Side Request Forgery (SSRF)
```bash
# User-controlled URLs in HTTP requests
grep -rn "fetch(.*req\.\|axios.*req\.\|http\.get(.*req\." src/ --include="*.ts"
```
- 🔴 FAIL: User-supplied URL used directly in HTTP requests without allowlist

---

## Security Report Format

```
🛡️ Security Check — [repo/feature]
Based on: OWASP Top 10

A01 — Broken Access Control ...... ✅ PASS
A02 — Cryptographic Failures ...... ✅ PASS
A03 — Injection ................... ✅ PASS
A04 — Insecure Design ............. ✅ PASS
A05 — Security Misconfiguration ... ✅ PASS
A06 — Vulnerable Components ....... 🟡 WARN (1 HIGH CVE — tracked)
A07 — Authentication Failures ..... ✅ PASS
A08 — Data Integrity Failures ..... ✅ PASS
A09 — Logging and Monitoring ...... ✅ PASS
A10 — SSRF ........................ ✅ PASS

🟢 SECURITY GATE PASSED (1 warning — document in PR description)
```

On critical failure:
```
🔴 SECURITY GATE FAILED — cannot proceed to PR

A03 — Injection
  File: src/infrastructure/db/UserRepository.ts:47
  Issue: Raw SQL with string concatenation
  Fix: Use parameterized query or ORM

All violations must be resolved before opening PR.
```

---

## Pre-PR Minimum Security Check

Run before every PR:
```bash
npm audit --audit-level=high
grep -rn "console\.log.*password\|console\.log.*token\|console\.log.*secret" src/ --include="*.ts"
grep -rn "Math.random()" src/ --include="*.ts"
```
