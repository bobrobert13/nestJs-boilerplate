# Phase 1: Documentation Audit

> **Purpose:** Perform a comprehensive documentation health check. This is the FIRST phase —
> you cannot blueprint what you haven't measured. Run this before any generation.

---

## What to Scan

The audit scans every documentation surface in the project. The paths below use
placeholders from Phase 0 hydration; replace them with detected values.

### Directories to Scan

| Path Pattern                 | What It Contains                                                     | Scan Priority |
| ---------------------------- | -------------------------------------------------------------------- | ------------- |
| `{{ROOT}}/`                  | Root-level markdown (README, AGENTS, CHANGELOG, governance)          | Critical      |
| `{{SRC_DIR}}/**/*`           | JSDoc/docstrings on public exports, inline comments on complex logic | Critical      |
| `{{PKG_DIR}}/*/README.md`    | Per-package/module READMEs                                           | High          |
| `{{APP_DIR}}/*/README.md`    | Per-application READMEs                                              | High          |
| `{{DOC_DIR}}/**/*`           | Docs directory (ADRs, architecture, guides)                          | Medium        |
| `{{CI_DIR}}/*.yml`           | CI workflow files (documentation checks)                             | Medium        |
| `.github/`, `{{SETUP_DIR}}/` | Contributing guides, templates                                       | Medium        |

### Metadata Files to Check

| File                                                                  | What to Audit                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| `{{ROOT}}/package.json` (or `Cargo.toml`, `go.mod`, `pyproject.toml`) | description, version, author, license, repository, keywords |
| `{{ROOT}}/LICENSE`                                                    | Existence and correctness                                   |
| `{{ROOT}}/.env.example`                                               | Every env var from code is documented                       |
| `{{ROOT}}/.gitignore`                                                 | Documentation artifacts aren't committed by accident        |

### File Types to Scan for Docstrings

| Language              | Extensions                   | Docstring Convention                        |
| --------------------- | ---------------------------- | ------------------------------------------- |
| TypeScript/JavaScript | `.ts`, `.tsx`, `.js`, `.jsx` | JSDoc `/** ... */`                          |
| Python                | `.py`                        | Google-style or reStructuredText docstrings |
| Go                    | `.go`                        | Godoc comments above exports                |
| Rust                  | `.rs`                        | `///` doc comments                          |
| Ruby                  | `.rb`                        | RDoc/YARD                                   |
| Java/Kotlin           | `.java`, `.kt`               | Javadoc `/** ... */`                        |
| C#                    | `.cs`                        | `///` XML doc comments                      |

---

## The 5 Audit Dimensions

Each dimension has a weight, a checklist, and evidence requirements.
Score each dimension independently on a 0-10 scale, then apply weights.

### Dimension 1: Structural Coverage (25%)

> **Question:** "Do the expected documents exist _at all_?"

**Checklist — score 1 point per YES (max 10):**

1. Root `README.md` exists with >10 lines of content
2. `CHANGELOG.md` exists and follows Keep a Changelog format
3. `LICENSE` file exists at repository root
4. Agent/LLM index file exists (`AGENTS.md`, `CLAUDE.md`, or `COPILOT.md`)
5. Documentation convention file exists (`CONVENTION.md`, `DOCUMENTATION-CONVENTION.md`, or equivalent)
6. Every package/module under `{{PKG_DIR}}` has its own `README.md`
7. Every application under `{{APP_DIR}}` has its own `README.md`
8. Environment variable template exists (`.env.example`, `.env.template`, or `.env.sample`)
9. Quick reference table exists (commands, scripts, lint, test, build)
10. Architecture overview document exists (ADRs, `docs/architecture.md`, or in AGENTS)

**Evidence required:** File paths and line counts. "exists" = non-trivial content (>10 meaningful lines).

### Dimension 2: Content Quality (25%)

> **Question:** "Is the content _useful_, or is it just placeholder fluff?"

**Checklist — score 1 point per YES (max 10):**

1. Every package README has an API table (method, signature, description)
2. Every package README has a Quick Start section with copy-paste code
3. Every package README documents all its environment variables with defaults
4. Every package README has an error handling section or table
5. The AGENTS/LLM index includes a "Feature-to-File" mapping
6. The AGENTS/LLM index includes a "Package Capability Matrix" with imports/exports
7. The AGENTS/LLM index includes cross-cutting concern warnings
8. Root README has a dependency/stack table with versions
9. Code examples in docs are complete (imports, types, error handling — not snippets)
10. Every README has a "Common Issues" or "Troubleshooting" section (at package or project level)

**Evidence required:** Section existence verified by scanning markdown headings.

### Dimension 3: JSDoc/Docstrings Coverage (20%)

> **Question:** "Are public APIs documented at the code level?"

**Checklist — score 1 point per YES (max 10):**

1. All public classes/structs have docstrings with description
2. All public methods/functions have `@param` (or equivalent) for every parameter
3. All public methods/functions have `@returns` (or equivalent) when not void
4. All methods that throw have `@throws` (or equivalent) with the error type
5. All public interfaces/types have docstrings with field descriptions
6. All decorators/annotations/macros have usage docstrings
7. All exported constants/config objects have inline comments
8. All middleware/plugins/hooks have docstrings with registration context
9. Complex logic (>20 lines) has inline comments explaining _why_, not _what_
10. Deprecated exports have `@deprecated` tags with migration guidance

**Evidence required:** Count of public exports vs count of documented exports. Use `grep -c` or AST analysis.

### Dimension 4: Governance (15%)

> **Question:** "Can a newcomer contribute legally and procedurally?"

**Checklist — score 1 point per YES (max 10):**

1. `CONTRIBUTING.md` exists with setup instructions
2. `SECURITY.md` exists with vulnerability reporting process
3. `CODE_OF_CONDUCT.md` exists
4. Pull request template exists (`.github/PULL_REQUEST_TEMPLATE.md`)
5. Issue templates exist (`.github/ISSUE_TEMPLATE/`)
6. Branch naming convention is documented
7. Commit message convention is documented (e.g., conventional commits)
8. Code review expectations are documented
9. Release process is documented (how to cut a release, who to notify)
10. All governance files are referenced from the root README

**Evidence required:** File existence. Content quality is bonus (validated in manual checks).

### Dimension 5: Navigability (15%)

> **Question:** "Can a newcomer _find_ the information they need in under 30 seconds?"

**Checklist — score 1 point per YES (max 10):**

1. Root README has a "Documentation" section linking to all major docs
2. AGENTS.md has a clickable Table of Contents (GitHub-compatible anchor links)
3. Every package README has cross-references to related packages
4. Architecture diagram exists (Mermaid, ASCII, or image)
5. Dependency graph diagram exists (what imports what)
6. Feature-to-file mapping exists and is accurate
7. Quick Reference table exists (common tasks → commands)
8. Cross-cutting concern warnings exist ("if you touch X, also check Y")
9. Error handling strategy table exists per component
10. All cross-references are relative links (internal) or verified external URLs

**Evidence required:** Link checking. Relative links must resolve within the repo.

---

## Scoring Algorithm

### Per-Dimension Score

Each dimension gets a raw checklist count (0-10 items checked). Then:

```
dimension_score = (items_checked / 10) * 10
```

The scale is 0 to 10 for each dimension.

### Overall Health Score

Apply weights to get the composite score:

```
overall = (COVERAGE * 0.25) + (QUALITY * 0.25) + (DOCSTRINGS * 0.20) + (GOVERNANCE * 0.15) + (NAVIGABILITY * 0.15)
```

Result is a float between 0.0 and 10.0, rounded to one decimal place.

### Weight Rationale

Coverage and Quality share the highest weight (25% each) because if documents
don't exist or their content is useless, nothing else matters. JSDoc gets 20%
because code-level docs are the most durable (they live _next_ to the code).
Governance and Navigability get 15% because they're important but secondary —
you fix them after content exists.

### Auto-detection vs. Manual Judgment

Some checklist items (file existence) can be detected by a script. Others
(content quality, accuracy of feature-to-file) require LLM or human review.
Mark each item in the report as `[AUTO]` (scriptable) or `[MANUAL]` (requires review)
so teams can automate what's automatable.

---

## Output Format

The audit report MUST follow this exact structure. Do not deviate.

```markdown
# Documentation Audit Report — {{PROJECT_NAME}}

**Audit Date:** {{AUDIT_DATE}}
**Auditor:** {{LLM_MODEL}} (automated)
**Project Type:** {{PROJECT_TYPE}}
**Framework:** {{FRAMEWORK}}
**Language:** {{LANGUAGE}}

---

## File Inventory

| File Path | Lines | Quality                              | Issues                    |
| --------- | ----- | ------------------------------------ | ------------------------- |
| {{PATH}}  | {{N}} | ✅ Excellent / ⚠️ Adequate / ❌ Poor | List of specific problems |

> **Quality ratings:**
>
> - ✅ **Excellent:** Complete, accurate, has all required sections, includes code examples
> - ⚠️ **Adequate:** Exists but has gaps (missing sections, incomplete API table, no env vars)
> - ❌ **Poor:** Placeholder content, outdated, fewer than 10 meaningful lines, or missing

---

## Dimension Scores

| #   | Dimension           | Weight | Checklist (✓/✗) | Score | Evidence                                |
| --- | ------------------- | ------ | --------------- | ----- | --------------------------------------- |
| 1   | Structural Coverage | 25%    | 7/10            | 7.0   | 2 of 10 package READMEs missing         |
| 2   | Content Quality     | 25%    | 5/10            | 5.0   | Most READMEs lack error handling tables |
| 3   | JSDoc/Docstrings    | 20%    | 3/10            | 3.0   | 32 of 89 public exports undocumented    |
| 4   | Governance          | 15%    | 4/10            | 4.0   | Missing SECURITY.md, CODE_OF_CONDUCT    |
| 5   | Navigability        | 15%    | 5/10            | 5.0   | Feature-to-file exists but stale        |

**Overall Health Score:** `(7.0×0.25) + (5.0×0.25) + (3.0×0.20) + (4.0×0.15) + (5.0×0.15) = 4.9/10`

---

## Gap Summary

### Critical (blocks deployment)

- [ ] Missing SECURITY.md — required for public repos
- [ ] Missing CODE_OF_CONDUCT.md — required for open-source
- [ ] 2 packages have no README at all

### High (within sprint)

- [ ] AGENTS.md lacks cross-cutting concern warnings
- [ ] CHANGELOG.md has no entries for last 3 releases
- [ ] Package READMEs missing error handling tables

### Medium (within quarter)

- [ ] Architecture diagram needed in AGENTS.md
- [ ] Quick Reference table missing from root README

### Low (nice to have)

- [ ] PR template could link to AGENTS.md
- [ ] ADRs directory could be created for future decisions

---

## Decision

| Score | Range      | Action                                                     |
| ----- | ---------- | ---------------------------------------------------------- |
| 0–3   | Critical   | Full rebuild — start from Phase 2 blueprint                |
| 4–6   | Needs work | Targeted improvement — fix critical gaps, enhance existing |
| 7–8   | Good       | Polish — add missing governance, improve indexes           |
| 9–10  | Excellent  | Maintain — wire auto-sync only                             |

**Recommended action:** {{ACTION}} — because score is {{SCORE}}.
```

---

## Decision Gate

The audit score determines what Phase 2 (Blueprint) should prioritize.
This table exists to prevent analysis paralysis — a score forces a decision.

| Score Range | Label          | Action                                                                                                                                      | Effort Estimate          | Risk if Ignored                                                                                             |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 0.0 – 3.0   | **Critical**   | Full rebuild. Discard existing docs if they're all placeholder. Run Phase 2 (Blueprint) from scratch, generate all required documents.      | 2–5 days per 10 packages | Onboarding impossible. AI agents useless. Contributors waste hours.                                         |
| 3.1 – 6.0   | **Needs Work** | Targeted improvement. Keep existing docs, fix the highest-impact gaps first. Run Phase 2 but mark existing docs as "enhance," not "create." | 1–3 days                 | Missing SECURITY/CONTRIBUTING blocks open-source adoption. Missing error tables cause production incidents. |
| 6.1 – 8.0   | **Good**       | Polish. All mandatory docs exist. Focus on: adding governance, improving indexes (feature-to-file, cross-cutting), adding Mermaid diagrams. | 0.5–1 day                | Stale indexes mislead AI agents. Missing governance makes repo look incomplete.                             |
| 8.1 – 10.0  | **Excellent**  | Maintain. Wire Phase 5 auto-sync (CI checks, pre-commit hooks, PR reminders). Set up quarterly re-audits.                                   | 2–4 hours                | Docs will rot within 3 months without auto-sync enforcement.                                                |

**If score is borderline** (e.g., 5.9 vs 6.0), round UP the action tier but flag the
audit report with a `⚠️ BORDERLINE` tag. The higher tier won't hurt.

**Re-audit interval:** Every quarter OR after any of these triggers:

- New package/module added to `{{PKG_DIR}}`
- Breaking change merged
- Major version bump (`{{INGEST_MANAGER_FILE}}` updated)
- Onboarding of new team member

---

## Example from nestJs-boilerplate

> **Context:** NestJS 11 TypeScript monorepo, 10 packages in `packages/`, 1 app in `apps/nominas/`,
> MongoDB + Inngest + Playwright. npm, GitHub Actions.

> ### File Inventory (excerpt)
>
> | File                          | Lines | Quality      | Issues                                                                           |
> | ----------------------------- | ----- | ------------ | -------------------------------------------------------------------------------- |
> | `README.md`                   | 48    | ✅ Excellent | Complete; has stack table, doc links                                             |
> | `AGENTS.md`                   | ~1200 | ✅ Excellent | Feature-to-file, capability matrix, cross-cutting, error strategies, all indexes |
> | `CHANGELOG.md`                | ~60   | ⚠️ Adequate  | Follows Keep a Changelog but needs latest entries                                |
> | `BOILERPLATE.md`              | 503   | ✅ Excellent | Full Spanish-language guide                                                      |
> | `DOCUMENTATION-CONVENTION.md` | 163   | ✅ Excellent | IA-friendly convention with examples                                             |
> | `packages/database/README.md` | 368   | ✅ Excellent | Full API, transactions, error tables, diagrams                                   |
> | `packages/auth/README.md`     | ~150  | ⚠️ Adequate  | Missing 2FA/passkeys API details                                                 |
> | `packages/inngest/README.md`  | ~120  | ⚠️ Adequate  | Missing error handling section                                                   |
> | `LICENSE`                     | —     | ❌ Poor      | Missing; package.json says UNLICENSED                                            |
> | `SECURITY.md`                 | —     | ❌ Missing   | Public repo without vulnerability reporting                                      |

> ### Dimension Scores Applied
>
> | Dimension           | Weight | Score | Reason                                                                                                                                                           |
> | ------------------- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | Structural Coverage | 25%    | 8.0   | 10/10 packages have READMEs; AGENTS, BOILERPLATE, CONVENTION exist. Missing LICENSE, SECURITY.md, CODE_OF_CONDUCT.md cost 2 points.                              |
> | Content Quality     | 25%    | 7.0   | `@common/database` README is excellent benchmark. `@common/auth` and `@common/inngest` need API tables. Error handling coverage is inconsistent across packages. |
> | JSDoc/Docstrings    | 20%    | 6.0   | Core services (auth, database, AI) have good JSDoc. App modules (`usuarios`, `dynamic-schema`) have patchy coverage. ~30% of public exports undocumented.        |
> | Governance          | 15%    | 3.0   | Missing LICENSE, SECURITY.md, CODE_OF_CONDUCT.md, PR template. CONTRIBUTING.md exists but bare.                                                                  |
> | Navigability        | 15%    | 8.0   | AGENTS.md has 4 index modes (feature-to-file, capability matrix, cross-cutting, error handling). Missing Mermaid architecture diagram.                           |

> **Overall:** `(8.0×0.25) + (7.0×0.25) + (6.0×0.20) + (3.0×0.15) + (8.0×0.15) = 6.6/10`
>
> **Decision:** Good (6.1–8.0) — Polish. Fix governance gap (LICENSE, SECURITY, CODE_OF_CONDUCT),
> improve JSDoc on app modules, add architecture diagram.
