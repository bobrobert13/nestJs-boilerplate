# Documentation Specification (NEW - Cross-cutting)

## Purpose

Define the **quality bar** for documentation across all packages and modules
to ensure AI agents (LLMs) can operate reliably on the codebase. This spec
establishes measurable, enforceable documentation requirements.

## Requirements

### README Coverage

The system MUST have a `README.md` in every `packages/<name>/` directory.

#### Scenario: All packages have README

- GIVEN the project contains 10 packages in `packages/*/`
- WHEN `ls packages/*/README.md | wc -l` is executed
- THEN the count equals 10

#### Scenario: Each README declares a status tag

- GIVEN a `packages/<name>/README.md` file
- WHEN the first 5 lines are read
- THEN a status tag is present: `<!-- @common/<name> — status: ... -->`

### JSDoc Coverage on Public APIs

The system MUST have JSDoc on all publicly exported methods, classes, and interfaces.

#### Scenario: Coverage threshold met

- GIVEN `npm run audit:docs` is executed against the entire codebase
- WHEN the script reports coverage percentage
- THEN the global coverage is ≥80%
- AND the script exits with code 0 only if threshold is met

#### Scenario: Lint rule warns on missing JSDoc

- GIVEN a new `.ts` file with a public method lacking JSDoc
- WHEN `npm run lint` is executed
- THEN the `require-public-jsdoc` rule reports a warning
- AND identifies the file path + method name

#### Scenario: Lint rule silent for properly documented code

- GIVEN a public method with `/** ... */` block above it
- WHEN `npm run lint` is executed
- THEN no warning is emitted for that method

### Specs OpenSpec Existentes

The system MUST have an OpenSpec spec for every package in `packages/*/`.

#### Scenario: Specs directory mirrors packages

- GIVEN `packages/<name>/` exists
- WHEN `ls openspec/specs/` is checked
- THEN `openspec/specs/<name>/spec.md` exists for each package

#### Scenario: Each spec has minimum content

- GIVEN a `openspec/specs/<name>/spec.md` file
- WHEN the file is read
- THEN it contains ≥5 `#### Scenario:` blocks
- AND total word count is ≥300

### Documentation Coverage Report

The system MUST publish a coverage report at `docs/COVERAGE.md`.

#### Scenario: Report is auto-generated

- GIVEN `npm run docs:coverage` is executed
- WHEN the script finishes
- THEN `docs/COVERAGE.md` is created or updated
- AND it contains a markdown table with per-package coverage

#### Scenario: Report includes global score

- GIVEN the report is generated
- WHEN read
- THEN a global score is shown (e.g., `**Global: 85%**`)

### App Modules Documentation

The system MUST have documentation for modules in `apps/*/src/modules/`.

#### Scenario: Each module has README

- GIVEN a module at `apps/nominas/src/modules/<name>/`
- WHEN the directory is listed
- THEN a `README.md` file exists alongside the `.ts` files

#### Scenario: Each module has .llm-context.md

- GIVEN a module at `apps/nominas/src/modules/<name>/`
- WHEN the directory is listed
- THEN a `.llm-context.md` file exists alongside the `.ts` files

#### Scenario: App module JSDoc coverage

- GIVEN a module in `apps/*/src/modules/`
- WHEN `npm run audit:docs` runs
- THEN the module reports ≥60% JSDoc coverage (lower threshold than packages)

## Enforcement

### Lint Rule as Error (Post-Rollout)

After 2 weeks of `warn`-only mode, the lint rule MUST escalate to `error`.

#### Scenario: Promotion criteria

- GIVEN the rule has been `warn` for 14+ days
- AND global JSDoc coverage is ≥70%
- WHEN the team decides to promote
- THEN `require-public-jsdoc` is changed from `warn` to `error`
- AND CI blocks new PRs that introduce undocumented public methods

## Affected Documentation

- `AGENTS.md` — section 13 (Documentation Index)
- `docs/COVERAGE.md` (new, auto-generated)
- All `packages/*/README.md`
- All `apps/*/src/modules/*/README.md`
- `.llm-context.md` files (new, generated)