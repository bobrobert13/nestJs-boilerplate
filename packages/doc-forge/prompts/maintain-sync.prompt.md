# Prompt: Maintain Documentation Sync

## Input Required

- `{{CHANGED_FILES}}` — List of files changed in the current PR/commit:
  ```
  packages/auth/src/services/auth.service.ts (modified)
  packages/auth/src/strategies/oauth.strategy.ts (new file)
  apps/nominas/.env.example (modified)
  ```
- `{{CHANGE_TYPE}}` — pr, commit, release, manual-check
- `{{DOC_FILES}}` — List of all documentation files in the project:
  ```
  README.md
  AGENTS.md
  CHANGELOG.md
  DOCUMENTATION-CONVENTION.md
  packages/auth/README.md
  packages/database/README.md
  ...
  ```
- `{{TRIGGER_TABLE}}` — The sync trigger table from DOCUMENTATION-CONVENTION.md:
  | Code Change | Doc Update Required |
  |-------------|-------------------|
  | New package/module | README.md + JSDoc + AGENTS.md index |
  | New public method | JSDoc on method |
  | New env var | README.md + .env.example |
  | New endpoint | Swagger/OpenAPI + README API table |
  | Breaking change | CHANGELOG.md |
  | New dependency | README dependencies section |
  | Removed/renamed export | Update cross-references |
- `{{IS_CI}}` — Whether this is running in CI (true) or invoked manually (false)
- `{{STRICT_MODE}}` — Whether to fail on missing docs (true) or warn (false)

## Output Format

### If running in CI ({{IS_CI}} = true):

```markdown
## Documentation Sync Check

### Status: {{PASS_FAIL_WARN}}

### Files Changed

| File       | Change Type       | Docs Affected       | Status                                          |
| ---------- | ----------------- | ------------------- | ----------------------------------------------- |
| {{FILE_1}} | {{CHANGE_TYPE_1}} | {{DOCS_AFFECTED_1}} | ✅ Updated / ⚠️ Missing / ❌ Missing (blocking) |
| {{FILE_2}} | {{CHANGE_TYPE_2}} | {{DOCS_AFFECTED_2}} | ✅ Updated / ⚠️ Missing / ❌ Missing (blocking) |

### Required Documentation Updates

{{REQUIRED_UPDATES_LIST}}

### Action Required

{{ACTION_REQUIRED_MESSAGE}}
```

### If running manually ({{IS_CI}} = false):

```markdown
## Documentation Sync Report — {{CHANGE_TYPE}}

### Code Changes Detected

{{CHANGED_FILES_LIST}}

### Documentation Impact

{{DOC_IMPACT_LIST}}

### Files That Need Updating

{{FILES_TO_UPDATE_LIST}}
```

## Prompt

```
You are checking whether documentation changes are in sync with code changes
for {{PROJECT_NAME}}.

CHANGE CONTEXT:
- Change type: {{CHANGE_TYPE}}
- Files changed: {{CHANGED_FILES_LIST}}
- Running in CI: {{IS_CI}}
- Strict mode: {{STRICT_MODE}}

DOCUMENTATION FILES:
{{DOC_FILES_LIST}}

SYNC TRIGGER TABLE (from DOCUMENTATION-CONVENTION.md):
{{TRIGGER_TABLE_CONTENT}}

YOUR TASK:
Compare code changes against documentation and determine if docs need updating.

---

## STEP 1: Classify Each Changed File

For each file in {{CHANGED_FILES}}, classify the change type:

| Pattern | Change Type |
|---------|-------------|
| NEW file in `{{SRC_DIR}}/` that has `{{MODULE_INDICATOR}}` | New package/module |
| NEW file in `{{SRC_DIR}}/{{PACKAGE}}/src/services/` or similar | New public method/service |
| NEW file in `{{SRC_DIR}}/{{PACKAGE}}/src/` with `export` | New public export |
| MODIFIED file adding `export const/function/class` | New public export |
| MODIFIED file changing function signature | API change (breaking?) |
| MODIFIED `.env.example` or config with `process.env.` | New/removed env var |
| DELETED file that was previously exported | Removed export |
| MODIFIED `package.json` adding/removing dependencies | Dependency change |
| MODIFIED `package.json` changing version | Version bump |
| NEW/MODIFIED controller file with `@Post/@Get/...` | New endpoint |

---

## STEP 2: Map Changes to Required Doc Updates

For EACH classified change, look up the trigger table:

```

IF change is "New package/module":

- DOES {{PACKAGE}}/README.md EXIST? (check {{DOC_FILES}})
- DOES AGENTS.md HAVE a new row in the capability matrix?
- DOES AGENTS.md HAVE a new row in the feature-to-file index?
- DO all public exports in the new package HAVE JSDoc?
- DOES the new package appear in AGENTS.md §External Services (if applicable)?

IF change is "New public method/export":

- DOES the method/export HAVE a JSDoc/docstring?
- DOES the package README API table INCLUDE this export?
- DOES the error matrix NEED updating if the error strategy changed?

IF change is "New env var":

- DOES .env.example INCLUDE the new variable with documentation comment?
- DOES the package README env var table INCLUDE it?
- DOES AGENTS.md env section INCLUDE it?

IF change is "New endpoint":

- DOES the controller method HAVE Swagger/OpenAPI decorators?
- DOES the package README API table INCLUDE the endpoint?

IF change is "Breaking change":

- DOES CHANGELOG.md HAVE an entry for this change?
- Is the entry in the correct category (Added/Changed/Fixed/Removed)?
- DOES the entry INCLUDE the scope (e.g., `@common/auth`)?

IF change is "New dependency":

- DOES the package README dependencies section INCLUDE it?
- Is the purpose of the dependency explained?

IF change is "Removed/renamed export":

- Have ALL cross-references been updated?
- Search {{DOC_FILES}} for the old name — any matches MUST be updated

````

---

## STEP 3: Check What Already Exists

For each required doc update, check if it was already done:

- Read the relevant doc file
- Search for the expected content
- If found AND correct → Status = ✅ Updated
- If found but incomplete (wrong version, missing details) → Status = ⚠️ Partial
- If not found → Status = ❌ Missing

---

## STEP 4: Determine Severity

| Status | In Strict CI | In Warning CI | Manual |
|--------|-------------|---------------|--------|
| ✅ Updated | Pass | Pass | Info |
| ⚠️ Partial | Pass with warning | Warning | Warning |
| ❌ Missing (non-critical) | Pass with warning | Warning | Warning |
| ❌ Missing (critical: LICENSE, SECURITY, breaking CHANGELOG) | FAIL | Warning | Error |

Critical missing docs (ALWAYS block):
- No CHANGELOG entry for a BREAKING CHANGE
- No LICENSE file in a public repo
- No .env.example update when required env vars added
- No JSDoc on public exports of a new package

---

## STEP 5: Generate the Report

### If {{IS_CI}}:

Output a CI-friendly report:

```markdown
## Documentation Sync Check

### Status: {{PASS}} / {{WARN}} / {{FAIL}}

### Files Changed
| File | Change Type | Docs Affected | Status |
|------|-------------|---------------|--------|
{{CHANGED_FILES_TABLE}}

### Required Documentation Updates
{{#each missing_doc}}
- [ ] {{DOC_FILE}}: {{WHAT_NEEDS_UPDATING}} (because {{SOURCE_FILE}} {{CHANGE_TYPE}})
{{/each}}

### Action Required
{{#if status == FAIL}}
❌ **Documentation sync failed.** The following critical docs are missing:
{{CRITICAL_MISSING_LIST}}
Please update them and push again.
{{else if status == WARN}}
⚠️ **Some documentation is out of sync.** The following docs should be updated:
{{WARNING_LIST}}
Consider updating them before merging.
{{else}}
✅ **All documentation is in sync.** No updates required.
{{/if}}
````

### If NOT CI (manual invocation):

Generate a human-friendly checklist:

```markdown
## Documentation Sync Report — {{CHANGE_TYPE}}

### Code Changes Detected

{{CHANGED_FILES_BULLET_LIST}}

### Files That Need Updating

{{CHECKLIST}}

### How to Fix

{{FIX_INSTRUCTIONS}}
```

---

## STEP 6: Provide Fix Instructions

For each missing doc, tell the developer/agent EXACTLY what to do:

```
TO FIX: Add a JSDoc to {{FILE}}:{{LINE}}
Template:
/**
 * {{SUGGESTED_DESCRIPTION}}
 * @param {{PARAM}} - {{DESCRIPTION}}
 * @returns {{DESCRIPTION}}
 */

TO FIX: Add to CHANGELOG.md under [Unreleased]:
### Added
- {{SCOPE}}: {{SUGGESTED_DESCRIPTION}}

TO FIX: Add to {{PACKAGE}}/README.md ## API Reference:
| {{EXPORT_NAME}} | {{TYPE}} | {{SUGGESTED_DESCRIPTION}} | `{{USAGE_EXAMPLE}}` |
```

---

## GLOBAL RULES:

1. NEVER report false positives. If a file changed but the change doesn't match
   any trigger (e.g., fixing a typo in a comment), don't flag it.

2. SEARCH for content before reporting it missing. The doc update may have been
   done in a different format or location than expected.

3. CROSS-CHECK: If {{CHANGED_FILES}} includes BOTH the code change AND the
   corresponding doc update in the same PR, mark it as ✅ Updated.

4. CONTEXT-AWARE: A new `export const` in a test file doesn't need JSDoc.
   A new `export const` in a library barrel file DOES.

5. BE SPECIFIC: Never say "update the README." Say "add a row to the API table
   in packages/auth/README.md for the new `validateSession()` method."

6. SELF-VALIDATE: After generating the report, ask:
   - Did every changed file get classified?
   - Did every classification map to the correct trigger?
   - Are the fix instructions copy-paste actionable?
   - Are there any false positives (changes that shouldn't trigger doc updates)?

OUTPUT the complete sync report using the format for {{IS_CI}} mode.

````

## Usage Context

- **Phase**: Phase 5 (Maintain) — runs continuously
- **Trigger**: On every PR (CI job), on every commit (pre-commit hook), manually via `npm run docs:check`
- **Depends on**: Phase 3 generated docs, DOCUMENTATION-CONVENTION.md trigger table, git diff
- **Feeds into**: CI pipeline (pass/fail), PR comments (suggestions), developer workflow
- **Re-run frequency**: Every PR/push, or manually before release

## Real Example from nestJs-boilerplate

This prompt is embodied in two CI workflows in the NestJS 11 monorepo:

### CI Workflow 1: `doc-check.yml` (runs on every PR)

A 6-job pipeline:

| Job | What It Checks | Fails If |
|-----|---------------|----------|
| `status-tags` | Every README has `<!-- name — status: X -->` tag | Any README missing or invalid tag |
| `readme-presence` | README exists for every package | Package has no README |
| `jsdoc-coverage` | Count documented vs undocumented public exports | Coverage < 70% |
| `version-sync` | CHANGELOG.md latest version matches package.json | Versions don't match |
| `broken-links` | All relative links in markdown resolve to existing files | Any broken link |
| `convention` | AGENTS.md has all 4 index modes | Any index missing |

### CI Workflow 2: `changelog-reminder.yml` (runs on PRs)

```yaml
# Triggers when PR modifies packages/ or apps/ but NOT CHANGELOG.md
on:
  pull_request:
    paths:
      - 'packages/**'
      - 'apps/**'
      - '!CHANGELOG.md'
````

The bot comments:

> ⚠️ This PR modifies source code but doesn't update CHANGELOG.md.
> If this PR introduces a breaking change, new feature, or notable fix,
> please add an entry to CHANGELOG.md under `[Unreleased]`.

### Pre-commit Hooks (husky + lint-staged)

In `.husky/pre-commit`:

```bash
npx lint-staged
```

In `lint-staged` config (package.json):

```json
{
  "lint-staged": {
    "*.ts": ["npm run docs:check -- --jsdoc-only"],
    "*.md": ["npm run docs:check -- --links-only"]
  }
}
```

### Manual Check Script

`scripts/check-doc-status.js` mirrors the CI jobs for local use:

```bash
npm run docs:check        # Full check (all 6 jobs)
npm run docs:check -- --jsdoc-only   # Only JSDoc coverage
npm run docs:check -- --links-only   # Only broken links
```

**Key pattern observed**: The sync is enforced at THREE levels:

1. **Pre-commit** (husky) — fast checks on changed files only
2. **CI on PR** (doc-check.yml) — full audit, blocks merge on failure
3. **Post-merge** (changelog-reminder.yml) — nudge PRs that forgot the changelog

This three-layer defense ensures documentation doesn't rot — a code change CANNOT reach production without passing documentation validation.

**Real failure example**: A PR added `oauth.strategy.ts` (new file in `packages/auth/src/strategies/`) without updating `packages/auth/README.md`. The CI `readme-presence` job didn't fail (README existed), but the `jsdoc-coverage` job failed because the new `OAuthStrategy` class had no JSDoc. The PR was blocked until the developer added:

```typescript
/**
 * Validates OAuth tokens from external providers (Google, GitHub).
 * Used by AuthService for social login flows.
 * @param accessToken - OAuth access token from the provider
 * @param refreshToken - OAuth refresh token (optional)
 * @param profile - User profile data from the provider
 * @returns Validated user object or null
 */
```
