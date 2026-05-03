# GDPR Compliance Checklist

## Scope

This checklist applies to all services that **collect, store, process, or transmit
personal data** about individuals in the European Union.

**Personal data includes:** name, email, IP address, user ID (if it can identify a
person), location data, device identifiers, behavioral data, financial data.

---

## Legal Basis (Article 6)

Before processing any personal data, confirm the lawful basis:

- [ ] **Consent** (Art. 6(1)(a)) — explicit, informed, withdrawable
- [ ] **Contract** (Art. 6(1)(b)) — processing necessary to fulfill a contract
- [ ] **Legal obligation** (Art. 6(1)(c)) — required by law
- [ ] **Legitimate interest** (Art. 6(1)(f)) — documented and balanced against rights

**Action:** Document the lawful basis for each data category in the Record of Processing
Activities (RoPA).

---

## Data Minimization (Article 5(1)(c))

- [ ] Only collect data that is **strictly necessary** for the stated purpose
- [ ] No collecting "just in case" fields
- [ ] Fields removed from forms when no longer needed
- [ ] Database schema reviewed — no orphaned columns storing PII

---

## Purpose Limitation (Article 5(1)(b))

- [ ] Data is only used for the purpose it was collected for
- [ ] Secondary uses documented and have separate legal basis
- [ ] Analytics/tracking uses documented and consent obtained if required

---

## Data Subject Rights

### Right to Access (Article 15)
- [ ] API endpoint or admin tool to export all data for a given user
- [ ] Response time: within 30 days
- [ ] Machine-readable format (JSON)

### Right to Erasure / Right to be Forgotten (Article 17)
- [ ] Hard delete implemented for personal data fields
- [ ] OR anonymization (replace PII with non-identifiable values)
- [ ] Deletion propagated to backups within 30 days
- [ ] Deletion propagated to any downstream services (event-driven)
- [ ] Audit log of deletion requests (without the deleted data)

### Right to Rectification (Article 16)
- [ ] Users can update their personal data via the UI or API
- [ ] Correction propagated to all stores

### Right to Data Portability (Article 20)
- [ ] User data export in structured, machine-readable format (JSON or CSV)

### Right to Object (Article 21)
- [ ] Users can opt out of processing for direct marketing
- [ ] Users can object to profiling/automated decision-making

---

## Privacy by Design (Article 25)

- [ ] Encryption at rest for PII columns (database-level or field-level)
- [ ] Encryption in transit (TLS 1.2+ for all endpoints)
- [ ] Access logs for any data store containing PII
- [ ] Role-based access control — not all roles can access PII
- [ ] Pseudonymization where possible (store user UUID, not email, in audit logs)

---

## Data Retention (Article 5(1)(e))

- [ ] Retention policy defined per data category (e.g., 2 years for logs)
- [ ] Automated deletion or anonymization after retention period
- [ ] Retention policy documented and reviewed annually

---

## Third-Party Processors (Article 28)

- [ ] Data Processing Agreements (DPAs) in place with all sub-processors
- [ ] Sub-processors listed in Privacy Policy
- [ ] Sub-processors only in EEA or countries with adequacy decisions
- [ ] If outside EEA: Standard Contractual Clauses (SCCs) in place

---

## Record of Processing Activities (Article 30)

Maintain a RoPA documenting:
- [ ] Purpose of processing
- [ ] Categories of data subjects
- [ ] Categories of personal data
- [ ] Recipients of data
- [ ] Retention periods
- [ ] Security measures

---

## No PII in Logs

- [ ] Logging policy prohibits PII in logs
- [ ] Code review checks for PII in log statements
- [ ] Log scrubbing in place if needed

See `architecture/logging-tracing.md` for implementation guidance.

---

## Incident Response (Article 33/34)

- [ ] Breach detection mechanism in place
- [ ] Incident response playbook documented
- [ ] DPA notified within **72 hours** of discovering a breach
- [ ] Affected users notified if high risk to their rights

---

## Consent Management

- [ ] Consent is **freely given, specific, informed, unambiguous**
- [ ] Consent is as easy to withdraw as to give
- [ ] Consent records stored with timestamp, version of consent text
- [ ] Marketing consent separate from service consent

---

## Cross-Border Transfers

- [ ] No transfer of personal data outside the EEA without safeguards
- [ ] Adequacy decisions or SCCs verified before using third-party services
- [ ] Cloud infrastructure region documented (prefer EU regions)
