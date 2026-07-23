# Testing Specification

## Purpose

Define la estrategia de testing del boilerplate: cobertura unitaria por
paquete, infraestructura E2E, y pipeline CI/CD. Garantiza que todo cambio
en el código se valida automáticamente antes de merge.

Documentación asociada: `AGENTS.md` §1 (comandos), §4 (matriz de paquetes),
§14 (Cognitive Ranking)

## Requirements

### Unit Test Coverage

The system MUST maintain unit tests for every `@common/*` package with a
minimum coverage of public API surface.

#### Scenario: Database package tests

- GIVEN the `@common/database` package with `DatabaseService`, `TransactionManager`, and retry logic
- WHEN `npm run test -- packages/database` is executed
- THEN all tests pass and cover: connection retry with backoff, transaction commit/abort, `@Transactional` decorator, disconnect cleanup

#### Scenario: AI package tests

- GIVEN the `@common/ai` package with `AiService` and multi-provider support
- WHEN `npm run test -- packages/ai` is executed
- THEN all tests pass and cover: `chat()` with mocked providers, `generateSchema()` structured output, `generateSchemaFromImage()` vision serialization, provider capability checks, error handling for invalid JSON responses

#### Scenario: HTTP package tests

- GIVEN the `@common/http` package with HTTP client and download service
- WHEN `npm run test -- packages/http` is executed
- THEN all tests pass and cover: GET/POST requests with mocked axios, download with sharp optimization, error handling for network failures, timeout configuration

#### Scenario: Documents package tests

- GIVEN the `@common/documents` package with PDF and DOCX extraction
- WHEN `npm run test -- packages/documents` is executed
- THEN all tests pass and cover: PDF text extraction (mocked pdf-parse), DOCX extraction (mocked mammoth), unsupported format error, parser interface extensibility

#### Scenario: Resend package tests

- GIVEN the `@common/resend` package with email and newsletter services
- WHEN `npm run test -- packages/resend` is executed
- THEN all tests pass and cover: email sending (mocked Resend API), template rendering, newsletter subscribe/unsubscribe, missing API key error handling

#### Scenario: Serve-static package tests

- GIVEN the `@common/serve-static` package with EJS rendering
- WHEN `npm run test -- packages/serve-static` is executed
- THEN all tests pass and cover: template rendering with data, layout + partials composition, 60-second cache behavior, missing template error handling

### E2E Test Infrastructure

The system MUST provide reusable E2E test infrastructure with an ephemeral
MongoDB instance.

#### Scenario: Test app creation

- GIVEN the `createTestApp()` helper in `apps/nominas/test/utils.ts`
- WHEN called in a test suite
- THEN it returns a configured NestJS application with: ephemeral MongoDB (ReplicaSet), all modules loaded, Supertest agent ready for HTTP assertions

#### Scenario: Test app teardown

- GIVEN a running test app from `createTestApp()`
- WHEN `afterAll()` calls `app.close()`
- THEN the MongoDB container is stopped and removed, no orphan processes remain

#### Scenario: E2E tests for health endpoint

- GIVEN a running test app
- WHEN `GET /api/health` is requested
- THEN the response is 200 with `{ data: { status: 'ok' } }`

### CI/CD Pipeline

The system MUST validate every pull request and push to `main` via an
automated CI pipeline.

#### Scenario: PR pipeline execution

- GIVEN a pull request targeting `main`
- WHEN the PR is opened or updated
- THEN the CI pipeline runs: lint → test → build → e2e, and blocks merge if any job fails

#### Scenario: Lint job

- GIVEN the CI pipeline
- WHEN the `lint` job executes
- THEN `npm run lint` runs with zero errors (warnings allowed)

#### Scenario: Test job with coverage

- GIVEN the CI pipeline
- WHEN the `test` job executes
- THEN `npm run test:cov` runs, all tests pass, and coverage report is generated

#### Scenario: Build job

- GIVEN the CI pipeline
- WHEN the `build` job executes
- THEN `npm run build` completes with zero TypeScript errors

#### Scenario: E2E job with MongoDB

- GIVEN the CI pipeline with Docker available
- WHEN the `e2e` job executes
- THEN MongoDB 7.0 starts as a ReplicaSet, `npm run test:e2e` runs, and all E2E tests pass

### Test Conventions

The system MUST follow consistent test file conventions across all packages.

#### Scenario: Unit test file naming

- GIVEN a source file `packages/foo/src/bar.service.ts`
- WHEN a unit test is created for it
- THEN the test file is `packages/foo/src/bar.service.spec.ts` (co-located) or `packages/foo/src/__tests__/bar.service.spec.ts`

#### Scenario: E2E test file naming

- GIVEN an E2E test for the auth flow
- WHEN the test file is created
- THEN it is named `apps/nominas/test/auth.e2e-spec.ts`

#### Scenario: Test isolation

- GIVEN any unit test
- WHEN it executes
- THEN it MUST NOT depend on external services (MongoDB, network, filesystem) — all dependencies are mocked

#### Scenario: LLM context for test files

- GIVEN a new test file in a package
- WHEN it is created
- THEN a `.llm-context.md` file SHOULD be co-located explaining what the tests cover and how to extend them

## Affected Documentation

| Document | Change |
|----------|--------|
| `AGENTS.md` §4 | Update Tests column: ❌ → ✅ for 6 packages |
| `AGENTS.md` §12 | Update dashboard with testing status |
| `AGENTS.md` §14 | Recalculate Cognitive Ranking with test scores |
| `packages/*/README.md` | Add "Testing" section to each package README |
| `apps/nominas/test/` | New `README.md` for E2E infrastructure |
