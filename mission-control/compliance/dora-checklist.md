# DORA Compliance Checklist

## Scope

The Digital Operational Resilience Act (DORA — EU Regulation 2022/2554) applies to
**financial entities** operating in the EU, including banks, payment institutions,
investment firms, and insurance companies.

This checklist covers the core operational resilience obligations.

---

## ICT Risk Management Framework (Articles 5–14)

### Governance
- [ ] ICT risk management is part of the board's overall risk framework
- [ ] Dedicated ICT risk ownership at senior management level
- [ ] ICT risk policy reviewed at least annually
- [ ] ICT risk tolerance levels defined and documented

### Risk Identification
- [ ] ICT asset inventory maintained (systems, data, infrastructure)
- [ ] ICT assets classified by criticality
- [ ] Dependencies on third-party ICT providers documented
- [ ] Threat intelligence sources identified and monitored

### Protection
- [ ] Access control: least privilege, MFA for privileged access
- [ ] Encryption at rest and in transit (TLS 1.2+, AES-256)
- [ ] Vulnerability management: CVE scanning, patch cadence defined
- [ ] Hardened configurations for all production systems
- [ ] Network segmentation for critical systems

### Detection
- [ ] Security monitoring and alerting in place (SIEM or equivalent)
- [ ] Anomaly detection for unusual access patterns
- [ ] Log retention: minimum 1 year (5 years for critical incidents)

### Recovery
- [ ] Recovery Time Objective (RTO) defined per critical system
- [ ] Recovery Point Objective (RPO) defined per critical system
- [ ] Data backups tested quarterly
- [ ] Recovery procedures documented and rehearsed

---

## Business Continuity (Article 11)

- [ ] Business Impact Analysis (BIA) conducted for all critical functions
- [ ] Business Continuity Plan (BCP) documented
- [ ] Disaster Recovery Plan (DRP) tested at least annually
- [ ] Failover procedures for critical ICT systems
- [ ] Communication plan for stakeholders during outages

---

## ICT-Related Incident Classification (Article 15/17)

### Thresholds for a Major Incident

A major incident requires regulatory reporting when ANY of the following apply:

| Criterion | Threshold |
|-----------|-----------|
| Clients affected | High number or high-profile clients |
| Transaction volume | Significant portion of daily volume disrupted |
| Duration | More than 24 hours or repeated disruption |
| Geographical spread | Multiple EU member states affected |
| Reputational impact | Media coverage or client complaints above normal |
| Data loss | Any loss of critical or personal data |

### Minor Incident
- Handled internally
- Documented in ICT incident register
- Root cause analysis within 10 business days

---

## ICT-Related Incident Reporting (Article 19)

For **major incidents**, report to the competent authority:

| Report | Deadline | Content |
|--------|----------|---------|
| Initial notification | Within **4 hours** of classification | Incident detected, nature, initial impact |
| Intermediate report | Within **72 hours** | Updated impact, remediation progress |
| Final report | Within **1 month** | Root cause, full impact, lessons learned |

- [ ] Incident reporting procedure documented
- [ ] Competent authority contact details stored in runbook
- [ ] Templates for initial/intermediate/final reports prepared
- [ ] Incident classification criteria agreed with management

---

## Digital Operational Resilience Testing (Article 24–25)

### Annual Basic Tests
- [ ] Vulnerability assessments conducted annually (or after major changes)
- [ ] Penetration testing of critical ICT systems annually
- [ ] Results documented and remediation tracked

### TLPT (Threat-Led Penetration Testing) — Article 26
Applies to significant financial entities (check with legal/compliance):
- [ ] TLPT scope defined
- [ ] TLPT conducted by qualified testers
- [ ] Regulatory pre-approval obtained where required
- [ ] Results and remediation communicated to competent authority

---

## Third-Party ICT Provider Risk (Articles 28–44)

### Contractual Requirements
- [ ] All critical ICT providers have written contracts
- [ ] Contracts include: SLAs, audit rights, data security requirements
- [ ] Contracts include: sub-contracting notifications, exit strategy
- [ ] Contracts include: business continuity provisions

### Concentration Risk
- [ ] Concentration risk assessed (over-reliance on single provider)
- [ ] Exit strategies documented for each critical ICT provider
- [ ] Alternative providers identified for critical services

### Register of Third-Party Providers
- [ ] Register maintained with: provider name, services provided, criticality, contract dates
- [ ] Register updated when providers change
- [ ] Register available for regulatory inspection

---

## Information Sharing (Article 45)

- [ ] Participation in cyber threat intelligence sharing (voluntary)
- [ ] Information sharing arrangements documented (if applicable)

---

## DORA Program Governance

- [ ] DORA compliance program owned by CISO or equivalent
- [ ] Gap assessment completed against all DORA requirements
- [ ] Remediation roadmap with tracked milestones
- [ ] Annual review of compliance posture
- [ ] DORA training for ICT and risk management staff
