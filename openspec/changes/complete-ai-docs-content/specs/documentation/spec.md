# Delta Spec: Documentation — Content Completion

> Delta para `openspec/specs/documentation/spec.md`
> Change: `complete-ai-docs-content`
> Fecha: 2026-07-22

## ADDED Requirements

### REQ-DOC-101: JSDoc coverage MUST reach 80% on public exports

- GIVEN the codebase has 376 public exports across `packages/*/src` and `apps/*/src`
- WHEN `npm run audit:docs` is executed
- THEN the reported method-level JSDoc coverage MUST be ≥80%
- AND every public method MUST have `@param`, `@returns`, and `@throws` (if applicable)
- AND no method SHALL have duplicate JSDoc blocks (one real + one stub)

#### Scenario: AI service has clean single JSDoc per method

- GIVEN `packages/ai/src/ai.service.ts` has methods with duplicated JSDoc
- WHEN the cleanup task is applied
- THEN each method has exactly ONE JSDoc block with `@param`/`@returns`
- AND no `/** methodName (see class JSDoc for context). */` stubs remain

#### Scenario: Database service JSDoc is preserved

- GIVEN `packages/database/src/database.service.ts` already has quality JSDoc
- WHEN the JSDoc pass is applied
- THEN existing JSDoc is preserved unchanged
- AND any missing methods get new JSDoc added

### REQ-DOC-102: .llm-context.md files MUST contain real content

- GIVEN 108 `.llm-context.md` files exist across the project
- WHEN `npm run docs:context` is executed after JSDoc completion
- THEN 0 files SHALL contain the placeholder text "(Sin descripcion JSDoc"
- AND every file MUST contain the module purpose extracted from JSDoc
- AND every file MUST list dependencies and error types

#### Scenario: Regenerated context files are useful for LLM

- GIVEN a `.llm-context.md` file previously said "(Sin descripcion JSDoc)"
- WHEN regenerated after JSDoc is added to the source `.ts` file
- THEN the file contains: purpose, conventions, file table, errors, dependencies
- AND the content is ≥10 lines of meaningful information

### REQ-DOC-103: packages/inngest MUST have full documentation

- GIVEN `packages/inngest/` exists with source code but no README or package.json
- WHEN the documentation task is applied
- THEN `packages/inngest/README.md` MUST exist with: Quick Start, API Reference, Configuration, Troubleshooting
- AND `packages/inngest/package.json` MUST exist with name, version, dependencies
- AND `openspec/specs/inngest/spec.md` MUST exist with ≥5 Given/When/Then scenarios

#### Scenario: LLM can understand inngest package without reading source

- GIVEN an LLM reads `packages/inngest/README.md`
- WHEN it needs to use the Inngest integration
- THEN it can determine: what the package does, how to import it, what env vars it needs
- AND it does NOT need to read the TypeScript source to understand the API

### REQ-DOC-104: health module MUST have README

- GIVEN `apps/nominas/src/modules/health/` has only controller and module files
- WHEN the documentation task is applied
- THEN `apps/nominas/src/modules/health/README.md` MUST exist
- AND it MUST document: endpoint URL, response shape, use cases (Docker, K8s, LB)

#### Scenario: LLM knows health endpoint contract

- GIVEN an LLM reads the health module README
- WHEN it needs to configure a Docker HEALTHCHECK
- THEN it knows: GET /api/health returns `{status, timestamp, uptime}` with 200

### REQ-DOC-105: AGENTS.md and README.md MUST reflect accurate numbers

- GIVEN the project has 43 spec files, 10 packages (including inngest), and 4 app modules
- WHEN AGENTS.md and README.md are updated
- THEN all counts MUST match reality
- AND Cognitive Ranking MUST include `@common/inngest`
- AND no placeholder text ("XXX", "TODO") SHALL remain in README.md

#### Scenario: LLM trusts AGENTS.md numbers

- GIVEN an LLM reads AGENTS.md §14 Cognitive Ranking
- WHEN it counts packages listed
- THEN the count matches the actual number of packages in `packages/`
- AND `@common/inngest` is present in the ranking table

### REQ-DOC-106: docs/COVERAGE.md MUST exist and be auto-generated

- GIVEN the spec `openspec/specs/documentation/spec.md` requires a coverage report
- WHEN `npm run docs:coverage` is executed
- THEN `docs/COVERAGE.md` MUST be created/updated
- AND it MUST show per-package JSDoc coverage percentages
- AND it MUST show a global score

#### Scenario: Coverage report is current

- GIVEN JSDoc has been added to all packages
- WHEN `npm run docs:coverage` runs
- THEN `docs/COVERAGE.md` shows global coverage ≥80%
- AND each package shows its individual percentage

### REQ-DOC-107: ESLint rule MUST be promoted to error

- GIVEN `ai-readiness/require-public-jsdoc` is currently set to `warn`
- AND >14 days have passed since initial rollout
- WHEN the enforcement task is applied
- THEN `eslint.config.mjs` MUST set the rule to `error`
- AND `npm run lint` MUST pass (all public methods documented)
- AND exclusions for DTOs, schemas, guards, specs MUST remain

#### Scenario: New undocumented method fails lint

- GIVEN a developer adds a public method without JSDoc
- WHEN `npm run lint` is executed
- THEN the build FAILS with error pointing to the undocumented method
- AND the error message includes the method name and file path

### REQ-DOC-108: README language MUST be consistent (English)

- GIVEN `packages/resend/README.md` and `packages/serve-static/README.md` are in Spanish
- AND all other package READMEs are in English
- WHEN the translation task is applied
- THEN both READMEs MUST be in English
- AND code examples MUST remain unchanged
- AND status tags MUST be preserved

#### Scenario: All package READMEs are in English

- GIVEN an LLM reads any `packages/*/README.md`
- WHEN it processes the documentation
- THEN the language is consistently English across all 10 packages

### REQ-DOC-109: Completed OpenSpec changes MUST be archived

- GIVEN 5+ changes exist in `openspec/changes/` that are already complete
- WHEN the archive task is applied
- THEN completed changes MUST be moved to `openspec/changes/archive/`
- AND only truly in-progress changes SHALL remain in `openspec/changes/`

#### Scenario: Changes directory is clean

- GIVEN the archive task has been applied
- WHEN listing `openspec/changes/` (excluding `archive/`)
- THEN only `complete-ai-docs-content` (this change) remains active