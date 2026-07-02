# Phase 4: Documentation Validation

> **Purpose:** Score the generated/enhanced documentation against the rubric.
> This is the QUALITY GATE — you don't ship docs without validating them.

---

## Rubric Table

The rubric has 5 dimensions, each with a weight, a max score, and detailed
checklist items. This is the SAME rubric used in Phase 1 (Audit), applied
AGAIN after generation to measure improvement.

| #   | Dimension               | Weight | Max Score | Checklist                    |
| --- | ----------------------- | ------ | --------- | ---------------------------- |
| 1   | **Structural Coverage** | 25%    | 2.5       | See § Coverage Checklist     |
| 2   | **Content Quality**     | 25%    | 2.5       | See § Quality Checklist      |
| 3   | **JSDoc/Docstrings**    | 20%    | 2.0       | See § Docstring Checklist    |
| 4   | **Governance**          | 15%    | 1.5       | See § Governance Checklist   |
| 5   | **Navigability**        | 15%    | 1.5       | See § Navigability Checklist |

### Coverage Checklist (10 items, 0.25 each)

| #    | Check                                                 | [AUTO/MANUAL] | Pass Condition                                  |
| ---- | ----------------------------------------------------- | ------------- | ----------------------------------------------- |
| 1.1  | Root README.md exists with >10 lines                  | AUTO          | File size > 300 bytes                           |
| 1.2  | CHANGELOG.md exists with Keep a Changelog format      | AUTO          | Has `## [version]` pattern                      |
| 1.3  | LICENSE file exists at root                           | AUTO          | File exists with >100 bytes                     |
| 1.4  | AGENTS.md (or equivalent) exists                      | AUTO          | File exists with >500 bytes                     |
| 1.5  | CONVENTION.md (or equivalent) exists                  | AUTO          | File exists with >200 bytes                     |
| 1.6  | Every package/module has README.md                    | AUTO          | `{{PKG_DIR}}/*/README.md` count = package count |
| 1.7  | Every app has README.md                               | AUTO          | `{{APP_DIR}}/*/README.md` count = app count     |
| 1.8  | .env.example exists                                   | AUTO          | File exists with >100 bytes                     |
| 1.9  | Quick Reference table exists in AGENTS or README      | MANUAL        | Table with commands present                     |
| 1.10 | Architecture overview exists (AGENTS or separate doc) | MANUAL        | Diagram or prose description                    |

### Quality Checklist (10 items, 0.25 each)

| #    | Check                                                | [AUTO/MANUAL] | Pass Condition                                       |
| ---- | ---------------------------------------------------- | ------------- | ---------------------------------------------------- |
| 2.1  | Every package README has API table                   | MANUAL        | Table with method/signature/description columns      |
| 2.2  | Every package README has Quick Start code block      | MANUAL        | Copy-paste-able code with imports                    |
| 2.3  | Every package README has env vars table              | MANUAL        | Table with variable/default/description columns      |
| 2.4  | Every package README has error handling section      | MANUAL        | Table or prose listing error types                   |
| 2.5  | AGENTS.md has Feature-to-File index                  | MANUAL        | Table with "If user asks / Read / May need" columns  |
| 2.6  | AGENTS.md has Capability Matrix (if monorepo)        | MANUAL        | Table with Package/Import/Exports/Documented columns |
| 2.7  | AGENTS.md has Cross-Cutting warnings                 | MANUAL        | Table with "If touches / Also check / Why" columns   |
| 2.8  | Root README has dependency/stack table with versions | MANUAL        | Technology + Version columns                         |
| 2.9  | Code examples include imports, types, error handling | MANUAL        | Examples >5 lines and complete                       |
| 2.10 | Every README has Troubleshooting or Common Issues    | MANUAL        | Section with issues table                            |

### Docstring Checklist (10 items, 0.20 each)

| #    | Check                                              | [AUTO/MANUAL] | Pass Condition                                |
| ---- | -------------------------------------------------- | ------------- | --------------------------------------------- |
| 3.1  | All public classes/structs have docstrings         | AUTO          | AST scan of exports vs docstrings             |
| 3.2  | All public methods have @param for every parameter | AUTO          | AST scan or `grep` for `@param`               |
| 3.3  | All public methods have @returns (non-void)        | AUTO          | AST scan or `grep` for `@returns`             |
| 3.4  | All throwing methods have @throws                  | AUTO          | AST scan or `grep` for `@throws`              |
| 3.5  | All public interfaces/types have field docs        | AUTO          | AST scan                                      |
| 3.6  | All decorators/annotations have usage docs         | MANUAL        | Manual review of decorator files              |
| 3.7  | All exported constants have inline comments        | AUTO          | `grep` for `export const` followed by comment |
| 3.8  | Middleware/plugins/hooks have registration docs    | MANUAL        | Review middleware registration files          |
| 3.9  | Complex logic (>20 lines) has why-comments         | MANUAL        | Spot-check of 5 longest functions             |
| 3.10 | Deprecated exports have @deprecated tags           | AUTO          | `grep` for `@deprecated`                      |

### Governance Checklist (10 items, 0.15 each)

| #    | Check                                            | [AUTO/MANUAL] | Pass Condition                                    |
| ---- | ------------------------------------------------ | ------------- | ------------------------------------------------- |
| 4.1  | CONTRIBUTING.md exists with setup instructions   | MANUAL        | Has "git clone", install, run sections            |
| 4.2  | SECURITY.md exists with reporting process        | AUTO          | File exists; has email or form link               |
| 4.3  | CODE_OF_CONDUCT.md exists                        | AUTO          | File exists                                       |
| 4.4  | PR template exists                               | AUTO          | `.github/PULL_REQUEST_TEMPLATE.md` exists         |
| 4.5  | Issue templates exist                            | AUTO          | `.github/ISSUE_TEMPLATE/` has files               |
| 4.6  | Branch naming convention documented              | MANUAL        | Documented in CONTRIBUTING or CONVENTION          |
| 4.7  | Commit convention documented                     | MANUAL        | Documented in CONTRIBUTING or CONVENTION          |
| 4.8  | Code review expectations documented              | MANUAL        | Documented in CONTRIBUTING                        |
| 4.9  | Release process documented                       | MANUAL        | Documented in CONTRIBUTING or separate RELEASE.md |
| 4.10 | All governance files referenced from root README | MANUAL        | Links exist in README                             |

### Navigability Checklist (10 items, 0.15 each)

| #    | Check                                                         | [AUTO/MANUAL] | Pass Condition                      |
| ---- | ------------------------------------------------------------- | ------------- | ----------------------------------- |
| 5.1  | Root README has Documentation section (links to sub-docs)     | MANUAL        | Section with 3+ links               |
| 5.2  | AGENTS.md has clickable Table of Contents                     | MANUAL        | Anchor links to headings            |
| 5.3  | Every package README has cross-references to related packages | MANUAL        | Links to at least 1 sibling package |
| 5.4  | Architecture diagram exists (Mermaid or image)                | MANUAL        | Diagram in AGENTS or separate doc   |
| 5.5  | Dependency graph exists (what imports what)                   | MANUAL        | Diagram in AGENTS or separate doc   |
| 5.6  | Feature-to-file mapping is accurate                           | MANUAL        | Verify 5 random entries resolve     |
| 5.7  | Quick Reference table exists (commands)                       | MANUAL        | Table in AGENTS or README           |
| 5.8  | Cross-cutting warnings exist                                  | MANUAL        | Table in AGENTS.md                  |
| 5.9  | Error handling strategy table per component                   | MANUAL        | Table in AGENTS.md                  |
| 5.10 | All cross-references are relative and resolve                 | AUTO          | Link checker script                 |

---

## Automated Checks

These checks run in CI (Phase 5) on every PR. They must pass for merge.

### Check 1: Status Tag Presence

**Script:** `grep -L '<!--.*status:' {{PKG_DIR}}/*/README.md`

**Pass:** Every `{{PKG_DIR}}/<name>/README.md` file has a status tag comment
within the first 5 lines.

**Fail:** A `critical` status in any non-stub README blocks the PR.

### Check 2: README Presence

**Script:** For each directory in `{{PKG_DIR}}/`, verify `README.md` exists
and has >100 bytes.

**Pass:** All packages have a README.

**Fail:** Missing README blocks the PR.

### Check 3: Root Metadata

**Script:** Parse `{{INGEST_MANAGER_FILE}}` (e.g., `package.json`) and verify:

- `description` is non-empty and >10 chars
- `author` is non-empty
- `version` follows semver

**Pass:** All fields present and valid.

**Fail:** Empty fields produce a warning; for version, a mismatch with
CHANGELOG is a hard failure.

### Check 4: Version Sync

**Script:** Extract version from:

1. `{{INGEST_MANAGER_FILE}}` (e.g., `package.json`)
2. `CHANGELOG.md` (latest `## [x.y.z]` entry)
3. API docs / Swagger (if applicable)

**Pass:** All three match OR differ only by documented policy.

**Fail:** Mismatch blocks the PR with a "sync versions" message.

### Check 5: Broken Links

**Script:** Extract all `[text](path)` patterns from markdown files. For relative
paths, verify the file exists. For absolute paths within the repo, verify the
file exists. For external URLs, perform a HEAD request.

**Pass:** All links resolve (200 or 301 for external, file exists for internal).

**Fail:** Broken internal links block the PR. Broken external links produce warnings.

### Check 6: JSDoc Coverage (TypeScript only)

**Script:** Use `typescript-eslint` with `eslint-plugin-jsdoc` to enforce:

- All exported functions have JSDoc
- All exported classes have JSDoc
- All exported interfaces have JSDoc
- @param tags match actual parameters
- @returns present for non-void functions

**Pass:** 0 eslint warnings in `jsdoc` rules.

**Fail:** Warnings block the PR at the linter level.

### Check 7: Changelog Reminder (PR Bot)

**Script:** When a PR changes source files under `{{SRC_DIR}}/` or `{{APP_DIR}}/`,
check if it also modifies `CHANGELOG.md`. If not, post a comment:

> ⚠️ This PR changes source files but doesn't update `CHANGELOG.md`.
> If this is a user-facing change, add an entry to the Unreleased section.

---

## Manual Checks

Some checks require human or LLM judgment. These are run:

- During Phase 4 validation (LLM review)
- During PR review (human reviewer)
- Quarterly during re-validation

### Manual Check: Content Quality

**Process:** Read each README and verify:

1. Quick Start code is copy-paste-able and works
2. API tables are complete (all public methods listed)
3. Environment variable table matches actual env vars in code
4. Error handling table covers all error types in code
5. Examples are not trivial (they show realistic usage, not `console.log`)

### Manual Check: Accuracy

**Process:** For 5 random entries in the Feature-to-File index:

1. Locate the feature description (e.g., "Login / JWT")
2. Open the listed files
3. Verify those files actually contain the described functionality
4. Verify "May also need" files are relevant

### Manual Check: Completeness

**Process:** Scan `{{SRC_DIR}}/` for:

1. Any public module/package without a README
2. Any public export without a docstring on one of: class, main function, interface
3. Any env var used in code but missing from `.env.example` and README tables

### Manual Check: Tone & Consistency

**Process:** Verify across all READMEs:

1. Same heading hierarchy (## sections match across all READMEs)
2. Same table format (columns, alignment)
3. Same code example style (syntax highlighting, indentation)
4. Same terminology (not "config" in one doc and "options" in another)

---

## Scoring Worksheet

Copy this template into a new file (e.g., `docs/validation-{{DATE}}.md`) and fill
it in during validation. The worksheet creates a permanent record of what passed
and what didn't.

```markdown
# Documentation Validation — {{PROJECT_NAME}}

**Validation Date:** {{VALIDATION_DATE}}
**Validator:** {{LLM_MODEL}} or {{HUMAN_NAME}}
**Phase 1 Audit Score:** {{AUDIT_SCORE}} (baseline)
**Phase 4 Validation Score:** {{VALIDATION_SCORE}} (after generation)

---

## Dimension Scores

### 1. Structural Coverage (max 2.5)

| #                   | Check              | Result  | Score                    |
| ------------------- | ------------------ | ------- | ------------------------ |
| 1.1                 | Root README exists | ✅ / ❌ | 0.25 / 0                 |
| 1.2                 | CHANGELOG exists   | ✅ / ❌ | 0.25 / 0                 |
| ...                 | ...                | ...     | ...                      |
| **Dimension Score** |                    |         | {{COVERAGE_SCORE}} / 2.5 |

### 2. Content Quality (max 2.5)

| #                   | Check                     | Result  | Score                   |
| ------------------- | ------------------------- | ------- | ----------------------- |
| 2.1                 | API tables in all READMEs | ✅ / ❌ | 0.25 / 0                |
| ...                 | ...                       | ...     | ...                     |
| **Dimension Score** |                           |         | {{QUALITY_SCORE}} / 2.5 |

### 3. JSDoc/Docstrings (max 2.0)

| #                   | Check                     | Result  | Score                      |
| ------------------- | ------------------------- | ------- | -------------------------- |
| 3.1                 | Public classes documented | ✅ / ❌ | 0.20 / 0                   |
| ...                 | ...                       | ...     | ...                        |
| **Dimension Score** |                           |         | {{DOCSTRINGS_SCORE}} / 2.0 |

### 4. Governance (max 1.5)

| #                   | Check               | Result  | Score                      |
| ------------------- | ------------------- | ------- | -------------------------- |
| 4.1                 | CONTRIBUTING exists | ✅ / ❌ | 0.15 / 0                   |
| ...                 | ...                 | ...     | ...                        |
| **Dimension Score** |                     |         | {{GOVERNANCE_SCORE}} / 1.5 |

### 5. Navigability (max 1.5)

| #                   | Check                     | Result  | Score                        |
| ------------------- | ------------------------- | ------- | ---------------------------- |
| 5.1                 | Root README has doc links | ✅ / ❌ | 0.15 / 0                     |
| ...                 | ...                       | ...     | ...                          |
| **Dimension Score** |                           |         | {{NAVIGABILITY_SCORE}} / 1.5 |

---

## Overall Health Score

| Dimension           | Weight   | Score | Weighted           |
| ------------------- | -------- | ----- | ------------------ |
| Structural Coverage | 25%      | {{C}} | {{C × 0.25}}       |
| Content Quality     | 25%      | {{Q}} | {{Q × 0.25}}       |
| JSDoc/Docstrings    | 20%      | {{D}} | {{D × 0.20}}       |
| Governance          | 15%      | {{G}} | {{G × 0.15}}       |
| Navigability        | 15%      | {{N}} | {{N × 0.15}}       |
| **TOTAL**           | **100%** | —     | **{{TOTAL}} / 10** |

---

## Automated Checks

| Check           | Result            | Details                   |
| --------------- | ----------------- | ------------------------- |
| Status tags     | ✅ PASS / ❌ FAIL | {{N}} missing status tags |
| README presence | ✅ PASS / ❌ FAIL | {{N}} missing READMEs     |
| Root metadata   | ✅ PASS / ❌ FAIL | {{DETAIL}}                |
| Version sync    | ✅ PASS / ❌ FAIL | {{DETAIL}}                |
| Broken links    | ✅ PASS / ❌ FAIL | {{N}} broken links        |
| JSDoc coverage  | ✅ PASS / ❌ FAIL | {{N}} warnings            |

---

## Manual Review

| Area                     | Reviewer | Findings     |
| ------------------------ | -------- | ------------ |
| Content quality          | {{NAME}} | {{FINDINGS}} |
| Accuracy (5 spot checks) | {{NAME}} | {{FINDINGS}} |
| Completeness             | {{NAME}} | {{FINDINGS}} |
| Tone & consistency       | {{NAME}} | {{FINDINGS}} |

---

## Improvement Plan

| #   | Gap     | Priority                       | Effort       | Owner     |
| --- | ------- | ------------------------------ | ------------ | --------- |
| 1   | {{GAP}} | Critical / High / Medium / Low | {{ESTIMATE}} | {{OWNER}} |
```

---

## Health Score Interpretation

The final score is the same 0–10 scale as Phase 1. Here's what it means AFTER
generation (different from the audit interpretation, where low scores trigger
rebuilds — here, low scores mean the generation failed).

| Score      | Label                            | Meaning                                                                                                                                    | Action                                                                                                                                |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0 – 3.0  | **Generation Failed**            | The generation phase produced documents that are worse than nothing — placeholder stubs, broken links, or inconsistent content.            | Re-run Phase 3 with a different approach (different templates, more manual review). Something went wrong with the generation process. |
| 3.1 – 6.0  | **Needs Rework**                 | Documents were generated but significant gaps remain. Missing sections, incomplete API tables, or low JSDoc coverage.                      | Go back to Phase 3 and re-generate the failing documents. Use the scoring worksheet to identify which specific sections failed.       |
| 6.1 – 8.0  | **Good — Ready for Use**         | All mandatory documents exist with substantial content. Minor gaps remain (governance, some JSDoc on edge modules, optional indexes).      | Accept and move to Phase 5 (Maintain). File the remaining gaps as issues with `doc:gap` label.                                        |
| 8.1 – 10.0 | **Excellent — Production Grade** | Documentation is comprehensive, consistent, and accurate. All indexes are verified, all examples are complete, all governance files exist. | Move to Phase 5 with confidence. This is the target state.                                                                            |

### What a 7.0 Looks Like (the line between "Needs Rework" and "Good")

- **Coverage:** All mandatory docs exist. 90%+ of packages have READMEs. Quick Reference and architecture exist.
- **Quality:** Most READMEs have API tables, Quick Start, and env var docs. The AGENTS.md has Feature-to-File.
- **JSDoc:** 70%+ of public exports documented. Core services well-documented, edge modules patchy.
- **Governance:** CONTRIBUTING, CHANGELOG exist. May be missing SECURITY, CODE_OF_CONDUCT, PR template.
- **Navigability:** Feature-to-file exists and is mostly accurate. Cross-cutting may be partial. Diagrams exist but could be better.

---

## Re-validation Triggers

Documentation validation is not a one-time event. Re-run Phase 4 when:

| Trigger                                | Frequency      | Scope                                                                         |
| -------------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| **New package/module added**           | Per addition   | Validate the new README + update AGENTS indexes                               |
| **Breaking change merged**             | Per change     | Re-validate Feature-to-File, API tables, error handling for affected packages |
| **Major version bump**                 | Per release    | Full re-validation before cutting the release                                 |
| **Quarterly health check**             | Every 3 months | Full re-validation. Compare to previous quarter's worksheet.                  |
| **New team member joins**              | Per onboarding | If onboarding takes >1 hour, docs have failed. Run full re-validation.        |
| **CI validation starts failing**       | As needed      | Investigate which check is failing and re-validate the affected documents     |
| **User reports stale/inaccurate docs** | Per report     | Spot-check the reported section + run the accuracy manual check               |

### Partial vs Full Re-validation

- **Partial:** Run only 1-2 dimensions affected by the change. Use a mini-worksheet
  (just those dimensions' checklist items).
- **Full:** Run all 5 dimensions. Use the complete scoring worksheet. Compare to
  the last full validation result to measure drift.

---

## Example from nestJs-boilerplate

> **Context:** NestJS 11 monorepo, post-generation validation.

> ### Rubric Scores Applied
>
> | Dimension           | Checklist | Score    | Evidence                                                                                                                                                                                         |
> | ------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
> | Structural Coverage | 8/10      | 2.0/2.5  | 10/10 package READMEs, AGENTS.md, BOILERPLATE.md, CONVENTION, CHANGELOG all exist. Missing LICENSE, SECURITY.md, CODE_OF_CONDUCT.md costs 2 checklist points.                                    |
> | Content Quality     | 7/10      | 1.75/2.5 | `@common/database` README is the gold standard (full API, transaction docs, error tables). `@common/auth` and `@common/inngest` READMEs need API table enhancement. Root README has stack table. |
> | JSDoc/Docstrings    | 6/10      | 1.2/2.0  | Core packages (auth, database, AI) have good JSDoc. App modules (`usuarios`, `dynamic-schema`) have ~30% undocumented public exports. No `@deprecated` tags on deprecated methods.               |
> | Governance          | 3/10      | 0.45/1.5 | CONTRIBUTING.md exists but bare. Missing LICENSE, SECURITY.md, CODE_OF_CONDUCT.md, PR template, issue templates. No documented release process.                                                  |
> | Navigability        | 8/10      | 1.2/1.5  | AGENTS.md has 4 index modes, cross-refs. Missing Mermaid architecture diagram. Feature-to-file entries verified accurate (5/5 spot checks passed).                                               |

> **Overall:** `2.0 + 1.75 + 1.2 + 0.45 + 1.2 = 6.6/10`
>
> **Interpretation:** Good (6.1–8.0) — Ready for Use. Move to Phase 5.
>
> **Automated checks run:** `npm run docs:check` passed with 0 errors and 4 warnings
> (missing LICENSE, SECURITY, CODE_OF_CONDUCT, CONTRIBUTING bare).
>
> **Manual review findings:**
>
> - Content quality: `@common/database` README (368 lines) is the benchmark.
>   `@common/auth` README needs 2FA/passkeys API tables.
> - Accuracy: 5/5 Feature-to-File entries verified (checked `auth.service.ts`,
>   `jwt.strategy.ts`, `database.service.ts`, `playwright.service.ts`, `resend.service.ts`).
>   All entries resolve to correct files.
> - Completeness: App modules (`usuarios`, `dynamic-schema`) lack READMEs.
>   They're documented in AGENTS.md but not in standalone files.
> - Tone: Consistent across all 10 package READMEs — same heading hierarchy,
>   same table format, same code example style.
>
> **Improvement plan filed:** 4 issues created with `doc:gap` label:
>
> - LICENSE file (critical)
> - SECURITY.md (critical)
> - @common/auth README 2FA/passkeys API tables (high)
> - Mermaid architecture diagram (medium)
