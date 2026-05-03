---
name: compliance-eu
description: >-
  EU regulatory compliance checklist covering GDPR (personal data protection), DORA
  (digital operational resilience), and PSD2 (payment services). Applies conditionally
  based on repo type — not all regulations apply to all services. Use when reviewing
  features that handle personal data, financial transactions, or digital payments.
  Keywords: GDPR, DORA, PSD2, compliance, privacy, audit, personal data, payments,
  regulation, EU, datos personales, cumplimiento normativo, privacidad, pagos.
allowed-tools:
  - read_file
  - file_search
  - grep_search
  - semantic_search
---

# Compliance EU Skill

## Applicability Matrix

| Regulation | Applies To |
|------------|-----------|
| GDPR | ALL repos handling personal data (email, name, phone, IP, device ID) |
| DORA | Infrastructure repos and all backend services with external dependencies |
| PSD2 | Backend services handling financial transactions or payment operations |

Determine which regulations apply before starting checks.

---

## GDPR Checklist

**Scope**: All repos that process or store personal data.

### Article 5 — Data Minimization
- [ ] Only collect data strictly necessary for the feature
- [ ] No extra fields "just in case" in request/response DTOs
- [ ] Database schema: no unnecessary PII columns

```bash
# Find PII field names in domain/infrastructure
grep -rn "email\|phone\|firstName\|lastName\|address\|birthDate\|ipAddress" src/ --include="*.ts" | grep -v "//\|import\|type\|interface"
```

### Article 6 — Lawful Basis for Processing
- [ ] Processing has a documented legal basis (consent, contract, legal obligation)
- [ ] Documented in `compliance/gdpr-checklist.md`

### Article 17 — Right to Erasure
- [ ] Every service with user data has a documented data deletion path
- [ ] Soft delete or anonymization strategy defined for each entity
- [ ] Cascading deletes work correctly (no orphaned PII)

### Article 20 — Data Portability
- [ ] Export endpoint documented (or noted as not applicable)

### Article 25 — Data Protection by Design
- [ ] PII encrypted at rest (DB encryption or field-level)
- [ ] PII not logged (check A09 from secure-coder)
- [ ] Role-based data access — users can only see their own data

### Article 28 — Data Processing Agreement
- [ ] Third-party identity providers (Cognito, Auth0): DPA accepted
- [ ] External APIs processing user data: DPA documented
- [ ] Self-hosted data stores: internal processing documented

### Article 30 — Records of Processing Activities
- [ ] `compliance/gdpr-checklist.md` lists all data flows

---

## DORA Checklist

**Scope**: Infrastructure and all backend services with external dependencies.

### Article 5 — ICT Risk Management
- [ ] Health checks defined for all services
- [ ] Readiness and liveness probes documented for production
- [ ] Timeouts configured on all REST clients

```bash
# Check timeout configuration
grep -rn "timeout\|connectTimeout\|readTimeout" src/ --include="*.ts" --include="*.yml"
```

### Article 10 — Backup and Recovery
- [ ] Database backup strategy documented
- [ ] RPO (Recovery Point Objective) defined
- [ ] RTO (Recovery Time Objective) defined
- [ ] Backup restoration tested (at least annually)

### Article 11 — Business Continuity
- [ ] Runbook documented for each critical service failure
- [ ] Circuit breakers configured for critical external dependencies
- [ ] Graceful degradation strategy defined (e.g., cache fallback)

```bash
# Check circuit breaker or retry configuration
grep -rn "retry\|circuitBreaker\|fallback\|ResilienceFactory" src/ --include="*.ts"
```

### Article 19 — Incident Management
- [ ] Structured logging with correlation IDs
- [ ] Alerting configured (Prometheus alerts or equivalent)
- [ ] Incident response runbook exists

### Article 25 — Third-Party Risk Management
- [ ] All third-party APIs documented with SLA and DPA status
- [ ] Fallback strategy for each critical third party
- [ ] No single point of failure through an external dependency

---

## PSD2 Checklist

**Scope**: Services handling financial transactions, payment initiation, or account information.

### Strong Customer Authentication (SCA — Article 97)
- [ ] Two-factor authentication enforced for payment initiation
- [ ] Authentication factors documented (password + OTP / biometric)
- [ ] SCA exemptions documented (low-value transactions, trusted beneficiaries)

### Transaction Risk Analysis (Article 95)
- [ ] Fraud detection mechanism in place
- [ ] Unusual transaction patterns flagged for review
- [ ] Transaction amount limits enforced

### Access Control for Account Information
- [ ] Explicit user consent required before accessing account data
- [ ] Consent recorded with timestamp and scope
- [ ] Consent withdrawal implemented

### Audit Trail (Article 6)
- [ ] All financial operations logged with: timestamp, user ID, operation type, amount, status
- [ ] Audit log is append-only (no deletes)
- [ ] Audit trail retained for minimum 5 years

```bash
# Check for audit event publishing
grep -rn "AuditEvent\|auditLog\|publishAudit\|AUDIT" src/ --include="*.ts"
```

### Data Minimization for Payments
- [ ] Only minimum data shared with payment processors
- [ ] Card/payment data never stored locally — use payment processor tokenization
- [ ] PAN (Primary Account Number) masked in logs

---

## Compliance Report Format

```
📋 EU Compliance Check — [feature/repo]

Applicable regulations: GDPR ✅ | DORA ✅ | PSD2 ⚠️ (applicable)

GDPR
  Article 5 — Data Minimization ..... ✅ PASS
  Article 17 — Right to Erasure ...... 🟡 WARN (no delete endpoint yet — tracked)
  Article 25 — Privacy by Design ..... ✅ PASS

DORA
  Article 5 — ICT Risk Management .... ✅ PASS
  Article 11 — Business Continuity ... ✅ PASS

PSD2
  SCA (Article 97) ................... ✅ PASS
  Audit Trail (Article 6) ............ ✅ PASS

🟡 COMPLIANCE GATE: 1 warning — document deletion path before next sprint
```

On critical failure:
```
🔴 COMPLIANCE GATE FAILED — cannot proceed to PR

GDPR Article 25 — Privacy by Design
  File: src/infrastructure/rest/UserController.ts
  Issue: Email address exposed in list endpoint response for all users
  Fix: Scope response to authenticated user only

All violations must be resolved before opening PR.
```

---

## Quick Compliance Checklist (Pre-PR)

- [ ] No new PII fields without documented lawful basis
- [ ] No PII in logs
- [ ] User data access scoped to authenticated user
- [ ] Deletion path documented for any new entity with PII
- [ ] Audit events published for all financial write operations
