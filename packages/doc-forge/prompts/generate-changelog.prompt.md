# Prompt: Generate CHANGELOG.md

## Input Required

- `{{PROJECT_NAME}}` — Project name
- `{{GIT_TAGS}}` — All git tags with dates: `v1.0.0 (2024-03-15), v1.1.0 (2024-04-20), ...`
- `{{GIT_LOG_BETWEEN_TAGS}}` — Commit messages grouped by tag range
- `{{PREVIOUS_CHANGELOG}}` — Existing CHANGELOG.md content (if any)
- `{{CONVENTIONAL_COMMITS}}` — Whether the project uses conventional commits (`feat:`, `fix:`, `chore:`)
- `{{ISSUE_TRACKER}}` — GitHub Issues, Jira, Linear, or None
- `{{RELEASE_CADENCE}}` — How often releases happen (weekly, monthly, ad-hoc)

## Output Format

A complete CHANGELOG.md following the [Keep a Changelog](https://keepachangelog.com/) format:

````markdown
<!-- {{PROJECT_NAME}}/changelog — status: active -->
<!-- Auto-generated from git history. Validated by CI. -->

# Changelog

> Automatically validated by CI (`doc-check.yml`). PRs without changelog updates get a reminder.

## [{{VERSION}}] - {{DATE}}

### Added

- {{SCOPE}}: {{DESCRIPTION}}

### Changed

- {{SCOPE}}: {{DESCRIPTION}}

### Fixed

- {{SCOPE}}: {{DESCRIPTION}}

### Removed

- {{SCOPE}}: {{DESCRIPTION}}

### Security

- {{SCOPE}}: {{DESCRIPTION}}

---

## Format

Use this template for each new entry:

```markdown
## [x.y.z] - YYYY-MM-DD

### Added

- {{SCOPE}}: description

### Changed

- {{SCOPE}}: description

### Fixed

- {{SCOPE}}: description

### Removed

- {{SCOPE}}: description

### Security

- {{SCOPE}}: description
```
````

```

## Prompt

```

You are generating the CHANGELOG.md for {{PROJECT_NAME}} from git history.

GIT CONTEXT:

- Tags: {{GIT_TAGS_LIST}}
- Uses conventional commits: {{CONVENTIONAL_COMMITS}}
- Issue tracker: {{ISSUE_TRACKER}}
- Release cadence: {{RELEASE_CADENCE}}
- Previous changelog exists: {{HAS_PREVIOUS}}
- Previous changelog content:
  {{PREVIOUS_CHANGELOG_CONTENT}}

COMMIT HISTORY (tag ranges):
{{COMMIT_HISTORY_GROUPED}}

YOUR TASK:
Generate a CHANGELOG.md from git history. Follow these rules:

1. FORMAT: Use [Keep a Changelog](https://keepachangelog.com/) format:
   - `## [version] - YYYY-MM-DD` for each release
   - Categorize entries as: Added, Changed, Fixed, Removed, Security
   - Entries are bullet points: `- scope: description`

2. STATUS TAG: First line must be: `<!-- {{PROJECT_NAME}}/changelog — status: active -->`

3. VERSION DETECTION:
   - If {{GIT_TAGS}} exist: use tag names as version headers
   - If no tags: use `[Unreleased]` for the most recent section, then
     infer versions from package.json or equivalent

4. COMMIT CLASSIFICATION:
   Parse each commit message and classify:

   a) If {{CONVENTIONAL_COMMITS}} is true, use the prefix:
   - `feat:` → Added
   - `fix:` → Fixed
   - `refactor:` → Changed
   - `perf:` → Changed
   - `docs:` → Changed (or skip if pure docs)
   - `chore:` → Changed (or skip if trivial)
   - `revert:` → Removed or Fixed
   - `BREAKING CHANGE:` → Changed (with breaking change marker)

   b) If NOT conventional commits, classify by content:
   - Words like "add", "implement", "new" → Added
   - Words like "fix", "resolve", "patch", "bug" → Fixed
   - Words like "update", "change", "refactor", "improve" → Changed
   - Words like "remove", "delete", "deprecate" → Removed
   - Words like "security", "vulnerability", "CVE" → Security

   c) EXTRACT scope from the commit message:
   - `feat(@common/auth): ...` → scope is `@common/auth`
   - `fix(database): ...` → scope is `database`
   - If no scope prefix: use the directory/file most changed
   - If multiple files changed: use the primary module name

   d) WRITE descriptions in past tense, from the user's perspective:
   - GOOD: `feat(@common/auth): added OAuth2 Google provider`
   - GOOD: `fix(@common/http): fixed timeout on large file downloads`
   - BAD: `feat: add OAuth2` (no scope)
   - BAD: `fix: bug` (no detail)

5. DEDUPLICATE: If two commits fix the same issue, merge into one entry.
   If a fix was reverted in the same release, omit both.

6. SKIP TRIVIAL COMMITS: Do not include:
   - `chore: bump version`
   - `chore: update dependencies` (unless major version change)
   - `docs: fix typo` (unless significant)
   - `style: format code`
   - `test: add missing test` (unless a critical missing test was added)
   - Merge commits (`Merge branch '...'`)

7. MERGE WITH EXISTING: If {{PREVIOUS_CHANGELOG}} exists:
   - Keep all existing entries — never delete documented history
   - Append new entries at the TOP (most recent first)
   - If the existing changelog used a different format, KEEP the existing entries
     as-is and add new entries in the new format. Add a note: "Earlier entries
     follow the previous format."

8. ADD CI NOTICE: Below the title, add:
   `> Automatically validated by CI (\`doc-check.yml\`). PRs without changelog updates get a reminder.`

9. APPEND FORMAT TEMPLATE: At the bottom, add the template for future entries.
   This teaches contributors the expected format.

10. GROUP BY VERSION: Entries are sorted by version (newest first), then by
    category (Added → Changed → Fixed → Removed → Security), then by scope.

11. SELF-VALIDATE: After writing, verify:
    - Every git tag has a version header (or at least the last 5 tags)
    - No duplicate entries for the same change
    - No trivial commits included
    - Format template present at the bottom
    - Status tag is first line
    - Version numbers match package.json (if available)

OUTPUT the complete CHANGELOG.md. Do NOT wrap in markdown code fences.

```

## Usage Context

- **Phase**: Phase 3 (Generate) — step 5 of document generation order
- **Trigger**: After all READMEs are generated, or when a new release is tagged
- **Depends on**: Phase 1 audit, git tags, commit history
- **Feeds into**: Phase 4 validation, CI changelog-reminder workflow
- **Re-run frequency**: Every release, or when the changelog-reminder CI job flags a missing update

## Real Example from nestJs-boilerplate

This prompt was applied to the NestJS 11 monorepo CHANGELOG.md:

**What existed before**: No CHANGELOG.md. The project had git tags but no structured release notes.

**What the prompt produced**: A 53-line CHANGELOG with:

1. **Status tag**: `<!-- @common/changelog — status: active -->`
2. **Version 0.2.0**: The most recent release with entries grouped by:
   - **Added (8 items)**: CI pipelines, husky hooks, doc scripts, Swagger tags, version sync
   - **Changed**: Audit completed with 4 redundant files removed
   - **Changed (from June 2026)**: A sub-section documenting work from a previous session that wasn't captured in the original changelog — Swagger decorators, http-error re-exports, dependency fixes, tsconfig paths, eslint ignores, 10 README status tags
3. **Format template**: Bottom of file shows the expected format for future entries
4. **CI integration**: The doc-check.yml CI job validates that PRs touching `src/` also update CHANGELOG.md

**Key pattern observed**: The "merge with existing" rule was critical because the project had an ad-hoc changelog format in the git history. The generator appended the structured `[0.2.0]` section but preserved the `Changed (from June 2026 session)` sub-section as-is — it contained unique historical context that no commit message could reproduce.

**CI validation**: The generated CHANGELOG is validated by `.github/workflows/changelog-reminder.yml` which comments on PRs that modify `packages/` or `apps/` but don't touch `CHANGELOG.md`. This enforces the "document breaking changes" rule automatically.
```
