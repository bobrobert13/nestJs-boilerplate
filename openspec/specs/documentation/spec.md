# Documentation Specification (Cross-cutting Quality Bar)

## Purpose

Define el **quality bar** para la documentacion de todo el monorepo, de modo que agentes IA (LLMs) puedan operar de forma confiable. Aplica transversalmente a:`packages/*`, `apps/*`, scripts y specs mismas.

Esta spec captura los requisitos que el script `scripts/audit-docs.js` y la regla ESLint `ai-readiness/require-public-jsdoc` enforcen automatico.

Documentacion asociada: `AGENTS.md` (seccion 13), `DOCUMENTATION-CONVENTION.md`, `docs/COVERAGE.md`.

## Requirements

### README Coverage en Packages

The system MUST have a `README.md` in every `packages/<name>/` directory.

#### Scenario: Count matches package count

- GIVEN the project contains N packages in `packages/*/`
- WHEN `ls packages/*/README.md | wc -l` is executed
- THEN the count equals N

#### Scenario: Every README declares a status tag

- GIVEN a `packages/<name>/README.md`
- WHEN the first 5 lines are read
- THEN an HTML comment with the package status tag is present: `<!-- @common/<name> — status: ... -->`

### JSDoc Coverage on Public APIs

The system MUST have JSDoc on all publicly exported methods, classes, and interfaces. Coverage MUST be measured and reported by `scripts/audit-docs.js`.

#### Scenario: Method coverage threshold enforced

- GIVEN `npm run audit:docs -- --strict` is executed
- WHEN the script reports coverage
- THEN the global method coverage MUST be at least 80%
  - AND exit code is 0 if it meets the threshold
  - AND exit code is 1 if it does not

#### Scenario: ESLint warns on missing JSDoc for new code

- GIVEN a new TypeScript file with a public method lacking JSDoc
- WHEN `npx eslint` is executed on that file
- THEN the `ai-readiness/require-public-jsdoc` rule reports a warning with the method name

#### Scenario: Properly documented code passes silently

- GIVEN a public method with `/** ... */` block immediately above
- WHEN `npx eslint` runs
- THEN no warning is emitted for that method

### OpenSpec Specs Exist for Each Domain

The system MUST have an OpenSpec spec for every package in `packages/*/`.

#### Scenario: Specs directory mirrors packages

- GIVEN a package `packages/<name>/` exists
- WHEN `ls openspec/specs/` is executed
- THEN `openspec/specs/<name>/spec.md` exists for each package

#### Scenario: Each spec has minimum content

- GIVEN a `openspec/specs/<name>/spec.md`
- WHEN the file is read
- THEN it contains at least 5 `#### Scenario:` blocks
  - AND the total word count is at least 300

### Documentation Coverage Report

The system MUST publish an auto-generated coverage report at `docs/COVERAGE.md`.

#### Scenario: Generate report

- GIVEN `npm run docs:coverage` is executed
- WHEN the script finishes
- THEN `docs/COVERAGE.md` is created or updated
  - AND it contains a markdown table with per-package coverage
  - AND a global score is shown

### App Modules Documentation

The system MUST have documentation for business modules under `apps/*/src/modules/`.

#### Scenario: Each app module has README

- GIVEN a module at `apps/nominas/src/modules/<name>/`
- WHEN the directory is listed
- THEN a `README.md` file exists alongside the `.ts` files

#### Scenario: Each app module has .llm-context.md

- GIVEN a module at `apps/nominas/src/modules/<name>/`
- WHEN the directory is listed
- THEN a `.llm-context.md` file exists alongside the `.ts` files

### LLM Context Sidecar Files

The system MUST generate `.llm-context.md` files adjacent to every TypeScript file in `packages/*/src` and `apps/*/src`.

#### Scenario: Generate context files

- GIVEN `npm run docs:context` is executed
- WHEN the script finishes
- THEN each `.ts` file has a sibling `.llm-context.md`
  - AND the context file lists: purpose (from JSDoc), class name, injected dependencies, and thrown error types

#### Scenario: Skip already-generated files

- GIVEN a `.llm-context.md` is newer than its source `.ts`
- WHEN `npm run docs:context` runs WITHOUT `--force`
- THEN the existing context file is preserved

## Enforcement

### Lint Rule Warning Mode (Initial)

The custom ESLint rule `ai-readiness/require-public-jsdoc` MUST be configured as `warn` (not `error`) for the first 14 days after rollout, to avoid blocking PRs during the migration period.

#### Scenario: Warn mode does not fail CI

- GIVEN the rule is set to `warn` in `eslint.config.mjs`
- WHEN `npm run lint` runs
- THEN exit code is 0 even when warnings exist

### Lint Rule Promotion to Error

After the migration period, the rule MUST be escalated to `error` to prevent regressions.

#### Scenario: Promotion criteria

- GIVEN the rule has been `warn` for at least 14 days
  - AND global JSDoc coverage is at least 70%
- WHEN the maintainer decides to promote
- THEN `ai-readiness/require-public-jsdoc` is changed to `error`
  - AND CI blocks new PRs that introduce undocumented public methods

## Affected Documentation

- `AGENTS.md` — section 13 (Documentation Index)
- `DOCUMENTATION-CONVENTION.md`
- `docs/COVERAGE.md` (new, auto-generated)
- All `packages/*/README.md`
- All `apps/*/src/modules/*/README.md`
- All `.llm-context.md` files (auto-generated)
