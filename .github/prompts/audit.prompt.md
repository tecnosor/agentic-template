---
mode: agent
description: Security and compliance audit — OWASP Top 10, GDPR, DORA, PSD2.
---

Run a full security and compliance audit on the current repository.

Read the skill first: [secure-coder](../mission-control/skills/secure-coder/SKILL.md)
Also read: [compliance-eu](../mission-control/skills/compliance-eu/SKILL.md)

Scope:
1. OWASP Top 10 checklist on all source files
2. GDPR checklist if personal data is handled
3. DORA checklist for resilience patterns
4. PSD2 checklist if financial transactions are present
5. Architecture boundary check (domain importing from infrastructure?)

Output a structured Guardian Report:
- **CRITICAL BLOCKING** — must fix before any PR
- **WARNINGS** — should fix
- **PASSED** — checks that are clean
- **Final verdict**: PROCEED or BLOCKED

Report only — do not modify any code.
