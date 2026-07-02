<!-- Template: doc-forge/templates/SECURITY.template.md -->
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

# Security Policy — {{PROJECT_NAME}}

## Supported Versions

Security updates are provided for the following versions:

| Version | Supported | Until |
| ------- | --------- | ----- |

{{SUPPORTED_VERSIONS_ROWS}}

> **Note for LLM:** Populate from `git tag` output. Mark the latest major/minor as actively supported.
> Older versions are typically marked `End of Life` unless an LTS policy exists.

## Reporting a Vulnerability

### Process

If you discover a security vulnerability, please do NOT open a public issue.
Follow this process instead:

1. **Contact:** Send details to `{{SECURITY_CONTACT}}`
2. **Encryption:** Use our PGP key to encrypt sensitive information:
   - Key ID: `{{PGP_KEY_ID}}`
   - Fingerprint: `{{PGP_FINGERPRINT}}`
   - Public key: `{{PGP_PUBLIC_KEY_URL}}`
3. **Response Time:** We aim to acknowledge reports within {{RESPONSE_TIME_HOURS}} hours
4. **Fix Timeline:** Critical vulnerabilities addressed within {{CRITICAL_FIX_DAYS}} days

### What to Include

When reporting, please provide:

- Description of the vulnerability
- Steps to reproduce (proof-of-concept if possible)
- Affected versions
- Potential impact
- Suggested fix (if available)

### Recognition

Security researchers who responsibly disclose vulnerabilities will be
acknowledged here (with permission):

| Reporter | Date | Vulnerability |
| -------- | ---- | ------------- |

{{ACKNOWLEDGEMENT_ROWS}}

---

## Security Update Process

### Triage

| Severity     | Definition                                                       | Response Time         | Fix Timeline     |
| ------------ | ---------------------------------------------------------------- | --------------------- | ---------------- |
| **Critical** | Remote code execution, auth bypass, data exfiltration            | {{CRITICAL_RESPONSE}} | {{CRITICAL_FIX}} |
| **High**     | Privilege escalation, sensitive data exposure, denial of service | {{HIGH_RESPONSE}}     | {{HIGH_FIX}}     |
| **Medium**   | Information disclosure, CSRF, open redirect                      | {{MEDIUM_RESPONSE}}   | {{MEDIUM_FIX}}   |
| **Low**      | Minor information leak, theoretical attacks                      | {{LOW_RESPONSE}}      | {{LOW_FIX}}      |

### Disclosure Timeline

1. Report received → Acknowledged within {{ACK_TIME}} hours
2. Triage completed → Reporter notified of severity within {{TRIAGE_TIME}} hours
3. Fix developed → Patch prepared and tested (varies by severity)
4. CVE requested → If applicable, {{CVE_PROCESS}}
5. Release → Security release published with advisory
6. Disclosure → Public advisory published after {{DISCLOSURE_DELAY}} days

---

## Security Best Practices

### For Contributors

{{CONTRIBUTOR_BEST_PRACTICES}}

### Secrets Management

- Never commit secrets to the repository
- Use environment variables for all credentials
- The `.env.example` file documents required variables but never contains real values
- Pre-commit hooks scan for accidental secret exposure via `{{SECRET_SCANNER}}`
- Rotate exposed credentials immediately and revoke compromised keys

### Dependency Management

| Practice               | Tool               | Frequency                 |
| ---------------------- | ------------------ | ------------------------- |
| Vulnerability scanning | `{{SCANNER_TOOL}}` | Every CI run + daily cron |
| Version pinning        | `{{LOCK_FILE}}`    | Always committed          |
| Automated updates      | `{{UPDATE_TOOL}}`  | Weekly PR                 |

### Authentication & Authorization

{{AUTH_BEST_PRACTICES}}

### Data Protection

{{DATA_PROTECTION_PRACTICES}}

---

## Dependency Scanning

### Known Vulnerabilities

Dependencies are scanned using `{{SCANNER_TOOL}}`. The current status of known
vulnerabilities is tracked via {{TRACKING_METHOD}}.

### Auditing Dependencies

```bash
{{AUDIT_COMMAND}}
```

### Policy for Vulnerable Dependencies

| Scenario                     | Action                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| Fix available (non-breaking) | Update automatically via `{{UPDATE_TOOL}}`                   |
| Fix available (breaking)     | Schedule migration, update within {{BREAKING_FIX_DAYS}} days |
| No fix available             | Assess risk, implement mitigation or replace dependency      |

### Supply Chain Security

{{SUPPLY_CHAIN_MEASURES}}

---

## Example

> Rendered for the `nestJs-boilerplate` project.

- **Status:** `<!-- api-nominas — status: Published -->`
- **Supported Versions:** `0.2.x` (actively supported, latest), `0.1.x` (end of life)
- **Reporting:** Email to `security@treborjs-dev.online`, PGP key optional, 48-hour acknowledgment, critical fixes within 7 days
- **Security Update Process:** Four severity tiers (Critical/High/Medium/Low) with defined response/fix timelines. 90-day disclosure delay after patch release.
- **Best Practices:** Never commit secrets, use `.env` for all credentials, pre-commit hook via `husky` + `gitleaks` for secret scanning. Environment variables documented in `.env.example` but never populated with real values.
- **Dependency Scanning:** `npm audit` on every CI run + daily Dependabot cron. Lock file (`package-lock.json`) always committed. Weekly automated updates via Dependabot PRs.
- **Authentication:** Argon2id for password hashing (configurable memory/time/parallelism), JWT with short-lived access tokens (15 min) and refresh token rotation (7 days), TOTP-based 2FA with backup codes, WebAuthn/Passkeys for passwordless authentication
- **Data Protection:** MongoDB connection strings in env vars only, no hardcoded URIs. API keys for Resend, Inngest, and AI providers stored as env vars. Sensitive fields excluded from logs and error responses.
