<!-- Template: doc-forge/templates/CHANGELOG.template.md -->
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note for LLM generating this:** Populate entries from `git log` between the last tagged version and HEAD.
> Use conventional commit prefixes to categorize: `feat:` → Added, `fix:` → Fixed, `docs:` → Documentation,
> `refactor:` → Changed, `perf:` → Changed, `test:` → internal, `chore:` → internal (usually omitted),
> `ci:` → internal. Group by category, reference commit SHAs and PR numbers. The "Unreleased" section is
> auto-updated by CI — do not manually maintain it.

---

## [Unreleased]

> **Auto-update mechanism:** On every merge to `{{MAIN_BRANCH}}`, CI extracts conventional commits since
> the last tag and appends them here. The `{{UNRELEASED_ANCHOR}}` comment marks the auto-update boundary.
> Do NOT edit below this line manually.

### Added

- {{ADDED_ENTRIES}}

### Changed

- {{CHANGED_ENTRIES}}

### Deprecated

- {{DEPRECATED_ENTRIES}}

### Removed

- {{REMOVED_ENTRIES}}

### Fixed

- {{FIXED_ENTRIES}}

### Security

- {{SECURITY_ENTRIES}}

---

## [{{VERSION_X}}] — {{DATE_X}}

### Added

- {{ADDED_ENTRIES_FOR_VERSION_X}}

### Changed

- {{CHANGED_ENTRIES_FOR_VERSION_X}}

### Fixed

- {{FIXED_ENTRIES_FOR_VERSION_X}}

---

## [{{VERSION_Y}}] — {{DATE_Y}}

### Added

- {{ADDED_ENTRIES_FOR_VERSION_Y}}

### Changed

- {{CHANGED_ENTRIES_FOR_VERSION_Y}}

### Fixed

- {{FIXED_ENTRIES_FOR_VERSION_Y}}

---

## CI Enforcement

> **Note for LLM:** Doc-forge Phase 5 wires a GitHub Actions job (`changelog-reminder.yml`) that:
>
> 1. Checks if source files changed in a PR
> 2. Verifies that `CHANGELOG.md` was also updated
> 3. Comments on the PR if missing, blocking merge until resolved
> 4. On merge, auto-populates the `[Unreleased]` section from conventional commits
>
> Template path: `{{CHANGELOG_CHECK_JOB_PATH}}`

---

## Example

> Rendered for the `nestJs-boilerplate` project (version 0.2.0).

- **Status:** `<!-- api-nominas — status: Auto-Synced -->`
- **Format:** Keep a Changelog v1.1.0 with Semantic Versioning
- **[Unreleased]:** Auto-populated from conventional commits since last tag
- **[0.2.0] — 2025-06-15:** Added Passkeys (WebAuthn) support, Two-Factor Authentication (TOTP), Magic Links, Argon2 password hashing, Newsletter module, AI providers wrapper (OpenAI, Anthropic, Google, Moonshot, MiniMax), dynamic schema generation pipeline, document text extraction (PDF/DOCX), Docker multi-stage build. Changed: upgraded to NestJS 11, TypeScript 5.7, Mongoose 9.4, Swagger 11.3. Fixed: transaction retry on transient MongoDB errors, Playwright headless timeout on CI
- **[0.1.0] — 2025-03-10:** Initial release — NestJS monorepo scaffold, MongoDB connection, Inngest task queue, Playwright browser automation, Resend email service, EJS template engine, HTTP client with Sharp image optimization, CRUD usuarios module
- **CI Enforcement:** GitHub Actions workflow at `.github/workflows/changelog-reminder.yml` — blocks PRs without changelog entries, auto-populates Unreleased on merge
