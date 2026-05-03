---
description: Invoke the guardian agent to run a security and compliance audit on the current repository.
---

# Audit

Run a full security and compliance audit on the current repository.

Invoke `@guardian` with the following scope:

1. Run OWASP Top 10 checklist on all source files
2. Run GDPR checklist if personal data is handled
3. Run DORA checklist for resilience patterns
4. Run PSD2 checklist if financial transactions are present
5. Run architecture boundary check

Produce a full Guardian Report with:
- CRITICAL BLOCKING items (must fix before any PR)
- WARNINGS (should fix)
- PASSED checks
- Final recommendation: PROCEED or BLOCKED
