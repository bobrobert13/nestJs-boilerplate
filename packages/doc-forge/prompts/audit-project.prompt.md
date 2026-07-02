# Prompt: Audit Project Documentation

## Input Required

- `{{HYDRATION_MAP}}` — Phase 0 hydration output: project type, source dir, package manager, language, framework, git remote, CI system
- `{{EXISTING_DOCS}}` — List of all existing documentation files (paths + line counts) from Phase 0.2
- `{{WORKSPACE_ROOT}}` — Absolute path to the project root

## Output Format

A structured audit report with the following sections:

```markdown
# Documentation Audit: {{PROJECT_NAME}}

## Health Score: {{SCORE}}/10 — {{RATING}}

## File Inventory

| File          | Lines     | Quality     | Issues     |
| ------------- | --------- | ----------- | ---------- |
| {{FILE_PATH}} | {{LINES}} | {{QUALITY}} | {{ISSUES}} |

...

## Dimension Scores

| Dimension           | Score/{{MAX}}    | Weight   | Weighted               | Evidence     |
| ------------------- | ---------------- | -------- | ---------------------- | ------------ |
| Structural Coverage | {{SCORE}}/2.5    | 25%      | {{WEIGHTED}}           | {{EVIDENCE}} |
| Content Quality     | {{SCORE}}/2.5    | 25%      | {{WEIGHTED}}           | {{EVIDENCE}} |
| JSDoc/Docstrings    | {{SCORE}}/2.0    | 20%      | {{WEIGHTED}}           | {{EVIDENCE}} |
| Governance          | {{SCORE}}/1.5    | 15%      | {{WEIGHTED}}           | {{EVIDENCE}} |
| Navigability        | {{SCORE}}/1.5    | 15%      | {{WEIGHTED}}           | {{EVIDENCE}} |
| **Total**           | **{{TOTAL}}/10** | **100%** | **{{WEIGHTED_TOTAL}}** | —            |

## Gap Analysis

### Critical (must fix before next release)

- {{GAP_1}}

### High (should fix this sprint)

- {{GAP_2}}

### Medium (nice to have)

- {{GAP_3}}

### Low (cosmetic)

- {{GAP_4}}

## Decision Gate

| Score | Recommended Action                                         |
| ----- | ---------------------------------------------------------- |
| 0-3   | Full rebuild — start from blueprint                        |
| 4-6   | Targeted improvement — fix critical gaps, enhance existing |
| 7-8   | Polish — add missing governance, improve indexes           |
| 9-10  | Maintain — wire auto-sync only                             |

## Missing Critical Documents

- {{MISSING_DOC_1}}
- {{MISSING_DOC_2}}

## Stale/Outdated Documents

| File     | Issue     | Last Updated |
| -------- | --------- | ------------ |
| {{FILE}} | {{ISSUE}} | {{DATE}}     |
```

## Prompt

```
You are auditing the documentation health of a {{PROJECT_TYPE}} project.

PROJECT CONTEXT:
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Package manager: {{PKG_MANAGER}}
- Monorepo: {{IS_MONOREPO}}
- CI/CD: {{CI_SYSTEM}}
- Git remote: {{GIT_REMOTE}}
- Source directory: {{SRC_DIR}}
- Test command: {{TEST_CMD}}

EXISTING DOCUMENTATION:
{{EXISTING_DOCS_LIST}}

YOUR TASK:
Perform a complete documentation health audit. Follow these steps:

1. ENUMERATE every documentation file. For each file:
   - Read the file (or first 200 lines if over 200) and assess quality
   - Rate quality as: Excellent, Good, Adequate, Poor, or Missing
   - Note specific issues (missing sections, outdated info, broken links, no code examples)

2. SCORE 5 dimensions. For each, provide evidence (specific file:line references):

   a) Structural Coverage (max 2.5, weight 25%):
      - README.md exists? Has Description, Installation, Quick Start, API, Env Vars?
      - AGENTS.md exists (if monorepo)? Has feature-to-file index?
      - CHANGELOG.md exists? Updated in last 30 days?
      - CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, LICENSE exist?
      - Package/module READMEs exist for all non-trivial packages?
      - .env.example exists with all required vars?

   b) Content Quality (max 2.5, weight 25%):
      - READMEs have working code examples (copy-paste and run)?
      - API tables list methods, params, returns, errors?
      - Env var tables list variable, default, required, description?
      - Architecture section includes Mermaid diagram?
      - Examples are tested/verified?

   c) JSDoc/Docstrings (max 2.0, weight 20%):
      - Count public exports (classes, functions, decorators)
      - Count documented exports (has JSDoc/docstring)
      - Calculate coverage percentage
      - Spot-check 5 random exports for quality (has @param, @returns, @throws?)

   d) Governance (max 1.5, weight 15%):
      - LICENSE exists with valid content?
      - SECURITY.md with vulnerability reporting process?
      - CODE_OF_CONDUCT.md?
      - CONTRIBUTING.md with setup instructions?
      - PR/issue templates in .github/?

   e) Navigability (max 1.5, weight 15%):
      - Feature-to-file index present?
      - Cross-references between documents?
      - Table of contents in long documents?
      - Ctrl+F-friendly anchor links?
      - Architecture diagram showing component relationships?

3. IDENTIFY gaps. For each missing or poor document, classify priority:
   - Critical: missing LICENSE, broken README, no .env.example
   - High: missing AGENTS.md (monorepo), no CHANGELOG, no package READMEs
   - Medium: missing CONTRIBUTING.md, poor JSDoc coverage
   - Low: missing CODE_OF_CONDUCT.md, minor formatting issues

4. DETECT stale documents:
   - Compare CHANGELOG dates vs git log dates
   - Check if documented features exist in current source
   - Flag any README that references removed files/functions

5. CALCULATE the overall health score as: sum of (dimension_score * weight) rounded to 1 decimal.

6. MAP the score to the decision gate and recommend next action.

OUTPUT the complete audit report using the format specified above.
Replace all {{PLACEHOLDER}} variables with detected values.
```

## Usage Context

- **Phase**: Phase 1 (Audit) — must run before any generation
- **Trigger**: When DocForge is first placed in a project, or when `docs:check` CI job runs
- **Depends on**: Phase 0 hydration complete
- **Feeds into**: Phase 2 (Blueprint) — the blueprint uses audit results to decide what docs to generate
- **Re-run frequency**: Every sprint, before release, or when a new package is added

## Real Example from nestJs-boilerplate

This prompt was used to audit the NestJS 11 monorepo. Key findings from that audit:

- **Health Score**: 6.3/10 → "Targeted improvement" gate
- **Critical gaps found**: No LICENSE file (fixed), .env.example was incomplete (fixed), 4 redundant/stale files removed
- **Structural Coverage scored 1.8/2.5**: All 10 package READMEs existed but lacked standardized sections (Error Handling, Common Pitfalls, Env Var tables)
- **Content Quality scored 1.5/2.5**: READMEs had code examples but they weren't tested, API tables were inconsistent across packages
- **JSDoc scored 1.2/2.0**: Auth controllers had zero Swagger decorators, several public exports on `@common/database` had no JSDoc
- **Governance scored 1.0/1.5**: LICENSE and SECURITY.md were missing entirely
- **Navigability scored 0.8/1.5**: AGENTS.md existed but had no feature-to-file index, no capability matrix, no error handling table

The audit directly informed Phase 2, which prioritized: (1) Add LICENSE + SECURITY.md, (2) Restructure AGENTS.md with all 4 index modes, (3) Standardize 10 package READMEs, (4) Add JSDoc to auth controllers and database exports.
