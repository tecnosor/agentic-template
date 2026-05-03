# PSD2 Compliance Checklist

## Scope

The Revised Payment Services Directive (PSD2 — EU Directive 2015/2366) and its
Regulatory Technical Standards (RTS on SCA & CSC) apply to **payment service providers**
(PSPs) operating in the EU: banks, payment institutions, e-money institutions, and
services that initiate or facilitate payments.

---

## Strong Customer Authentication (SCA) — Article 97 + RTS

SCA requires at least **two independent factors** from different categories:

| Factor | Examples |
|--------|---------|
| **Knowledge** (something you know) | Password, PIN, passphrase |
| **Possession** (something you have) | Mobile device (TOTP/push), hardware token |
| **Inherence** (something you are) | Fingerprint, face recognition |

### SCA Implementation Checklist

- [ ] Two-factor authentication implemented for:
  - User login
  - Payment initiation
  - Sensitive data access (view full card number, change password)
- [ ] Factors are **independent**: compromise of one factor does not compromise others
- [ ] SCA applied on re-authentication when session expires
- [ ] SCA session timeout: maximum **5 minutes** of inactivity for payment operations
- [ ] SCA code is **dynamic and transaction-specific** for payment initiation (not static OTP)
- [ ] Failed SCA attempts locked after 5 consecutive failures

---

## Transaction Risk Analysis (TRA) — RTS Article 18

TRA exemptions may allow skipping SCA for low-risk transactions:

| Transaction Threshold | PSP Fraud Rate Requirement |
|----------------------|---------------------------|
| Up to €100 | ≤ 0.13% fraud rate |
| Up to €250 | ≤ 0.06% fraud rate |
| Up to €500 | ≤ 0.01% fraud rate |

### TRA Checklist
- [ ] Fraud rate monitored and reported quarterly
- [ ] TRA exemption applied only within approved thresholds
- [ ] Exempt transactions logged for audit
- [ ] Real-time risk signals considered (device, velocity, behavior)
- [ ] TRA exemption disabled automatically if fraud rate exceeds threshold

---

## SCA Exemptions (Other)

- [ ] **Contactless low value** (≤€50 per transaction, cumulative limit €150): implemented with correct cumulative limit tracking
- [ ] **Recurring transactions** (same amount, same merchant): only first transaction requires SCA
- [ ] **Trusted beneficiaries**: user-whitelisted payees, SCA applied when adding to whitelist
- [ ] **Corporate payments**: documented business-level authentication in place

---

## Open Banking / Third-Party Provider (TPP) APIs

If providing access to account or payment initiation to licensed TPPs:

- [ ] Dedicated open banking API (no screen-scraping allowed)
- [ ] TPP authentication via eIDAS certificates
- [ ] Consent management: explicit user consent for each TPP data access scope
- [ ] Consent records stored with: scope, timestamp, TPP identity, expiry
- [ ] Consent revocation implemented and effective within 24 hours
- [ ] API availability: ≥99.5% monthly uptime
- [ ] Contingency mechanism available if dedicated interface is unavailable

---

## Secure Communication

- [ ] TLS 1.2+ enforced for all API endpoints (TLS 1.3 recommended)
- [ ] Certificate pinning for mobile applications
- [ ] HSTS header set (`Strict-Transport-Security: max-age=31536000; includeSubDomains`)
- [ ] OAuth 2.0 with PKCE for authorization flows
- [ ] Short-lived access tokens (max 5 minutes for payment operations)
- [ ] Refresh token rotation on each use

---

## Audit Trail

- [ ] All payment operations logged with:
  - Timestamp (UTC)
  - User identifier (opaque)
  - SCA method used
  - Amount and currency
  - Beneficiary reference
  - Outcome (success / failure)
- [ ] Audit logs immutable (append-only, no updates)
- [ ] Audit log retention: minimum **5 years**
- [ ] Audit logs accessible for regulatory inspection within 24 hours

---

## Fraud Monitoring and Reporting

- [ ] Real-time transaction monitoring in place
- [ ] Fraud detection rules documented
- [ ] Fraud rate calculated and reported quarterly to competent authority
- [ ] Statistical data on fraud reported: format per EBA guidelines
- [ ] Incident escalation procedure for fraud spikes

---

## User Notifications

- [ ] Push notification or SMS for every payment transaction above €30
- [ ] Notification includes: amount, currency, merchant name
- [ ] Notification sent within 30 seconds of transaction completion
- [ ] Notification opt-out: not allowed for high-value transactions

---

## Credential Management

- [ ] Passwords never stored in plaintext (bcrypt/argon2id with cost factor ≥12)
- [ ] Personalised security credentials (PSC) never transmitted in plaintext
- [ ] Password reset via secure out-of-band channel (email + token)
- [ ] Session tokens are cryptographically random (min 128 bits)
- [ ] Logout invalidates session server-side

---

## Liability Framework

- [ ] Payer liability documented for unauthorized transactions
- [ ] PSP liability documented for failure to apply SCA
- [ ] Refund timelines defined: unauthorized transactions refunded by end of next business day
- [ ] Dispute process documented and accessible to users
