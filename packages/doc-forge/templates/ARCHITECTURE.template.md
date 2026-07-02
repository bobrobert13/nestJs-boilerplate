<!-- Template: doc-forge/templates/ARCHITECTURE.template.md -->
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

# Architecture Decision Record — {{ADR_TITLE}}

> **ADR:** {{ADR_NUMBER}}
> **Date:** {{ADR_DATE}}
> **Status:** {{ADR_STATUS}}

---

## Title

{{ADR_TITLE}}

---

## Status

**{{ADR_STATUS}}**

> **Valid statuses:** `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-{{SUPERSEDING_NUMBER}}`

| Date              | Status       | Author       | Notes       |
| ----------------- | ------------ | ------------ | ----------- |
| {{STATUS_DATE_1}} | {{STATUS_1}} | {{AUTHOR_1}} | {{NOTES_1}} |
| {{STATUS_DATE_2}} | {{STATUS_2}} | {{AUTHOR_2}} | {{NOTES_2}} |

---

## Context

### Problem Statement

{{PROBLEM_STATEMENT}}

### Current State

{{CURRENT_STATE_DESCRIPTION}}

### Constraints

| Constraint | Type | Impact |
| ---------- | ---- | ------ |

{{CONSTRAINT_ROWS}}

### Stakeholders

| Role | Name/Team | Interest |
| ---- | --------- | -------- |

{{STAKEHOLDER_ROWS}}

---

## Decision

### What We Decided

{{DECISION_DESCRIPTION}}

### Technical Approach

{{TECHNICAL_APPROACH}}

### Implementation Details

```{{LANGUAGE}}
{{IMPLEMENTATION_EXAMPLE}}
```

### Architecture Diagram

```mermaid
{{ARCHITECTURE_DIAGRAM}}
```

### Key Design Choices

| Decision | Rationale | Trade-off |
| -------- | --------- | --------- |

{{DESIGN_CHOICE_ROWS}}

---

## Consequences

### Positive

{{POSITIVE_CONSEQUENCES}}

### Negative

{{NEGATIVE_CONSEQUENCES}}

### Risks

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |

{{RISK_ROWS}}

### Migration Path

{{MIGRATION_PATH}}

### Monitoring & Metrics

{{MONITORING_PLAN}}

---

## Alternatives Considered

### Alternative 1: {{ALT_1_NAME}}

**Description:** {{ALT_1_DESCRIPTION}}

**Pros:**
{{ALT_1_PROS}}

**Cons:**
{{ALT_1_CONS}}

**Why Rejected:** {{ALT_1_REJECTION_REASON}}

### Alternative 2: {{ALT_2_NAME}}

**Description:** {{ALT_2_DESCRIPTION}}

**Pros:**
{{ALT_2_PROS}}

**Cons:**
{{ALT_2_CONS}}

**Why Rejected:** {{ALT_2_REJECTION_REASON}}

### Alternative 3: {{ALT_3_NAME}}

**Description:** {{ALT_3_DESCRIPTION}}

**Pros:**
{{ALT_3_PROS}}

**Cons:**
{{ALT_3_CONS}}

**Why Rejected:** {{ALT_3_REJECTION_REASON}}

---

## References

- {{REFERENCE_1}}
- {{REFERENCE_2}}
- {{REFERENCE_3}}

> **Related ADRs:** {{RELATED_ADRS}}

> **Note for LLM generating this:** This template follows the [MADR](https://adr.github.io/madr/) format
> (Markdown Architecture Decision Records). Each ADR should be a self-contained, dated decision document.
> When superseding an ADR, update the original's status to `Superseded by ADR-{{NEW_NUMBER}}` and create
> a new ADR. Store all ADRs in `docs/adr/` with filenames like `{{ADR_PATTERN}}.md`.

---

## Example

> Rendered for an ADR in the `nestJs-boilerplate` project.

- **Status:** `<!-- api-nominas — status: Accepted -->`
- **ADR:** `ADR-001` — "Use Argon2id Instead of bcrypt for Password Hashing"
- **Date:** 2025-05-20
- **Context:** NestJS monorepo needed password hashing. bcrypt is the default in NestJS docs, but Argon2id is the OWASP-recommended algorithm and won the Password Hashing Competition. MongoDB already stores the hash, no migration burden.
- **Decision:** Use `argon2` npm package with type=2 (argon2id), memory=65536, timeCost=3, parallelism=4. Implement via `AuthService.hashPassword()` and `AuthService.comparePassword()` methods exposed from `@common/auth`.
- **Consequences:** Positive: Memory-hard algorithm resists GPU/ASIC attacks, configurable parameters allow scaling with hardware, future-proof (OWASP top recommendation). Negative: Slightly slower than bcrypt (~50ms vs ~10ms per hash on average hardware), adds one npm dependency, not the NestJS default so tutorials won't match. Risks: Configuration parameters may need tuning across deployment environments.
- **Alternatives Considered:**
  1. **bcrypt** — Rejected because Argon2id provides stronger resistance to GPU/ASIC attacks and is the current OWASP recommendation. bcrypt's 72-byte input limit is a theoretical concern.
  2. **scrypt** — Rejected because Argon2id is more configurable (3 tunable dimensions vs scrypt's 2) and has stronger academic backing.
  3. **PBKDF2** — Rejected because it's FIPS-140 compliant but lacks memory-hardness. Suitable if FIPS compliance becomes a requirement.
- **ADR stored at:** `docs/adr/001-argon2id-password-hashing.md`
