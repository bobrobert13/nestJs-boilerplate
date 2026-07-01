# Tasks: Document APIs Missing from AGENTS.md

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~385 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: AGENTS.md Core Documentation (4 sections)

- [x] 1.1 Add `### @common/dynamic-schema` to AGENTS.md §6 after `@common/ai`: file layout (7 files), module imports (AiModule, DocumentsModule), 5-endpoint table (POST extract/generate-from-text/generate-from-image/compile/pipeline with request/response shapes), service split (DynamicSchemaService vs SchemaCompilerService), error handling (BadRequestException on success:false), usage example with constructor DI
- [x] 1.2 Add `### @common/http` to AGENTS.md §6: HttpError hierarchy table (7 classes: BadRequestError 400 → ServiceUnavailableError 503), `createHttpError(status, message, url, data?)` factory, `HttpError.toJSON()` method, DownloadService with 3 methods (`file()`, `image()` with Sharp ImageOptimizationOptions, `video()`), DownloadOptions interface, HttpModule import path
- [x] 1.3 Extend `### @common/ai` Key Methods list: append `generateSchemaFromImage(provider, imageData, options?)` and `generateSchemaFromText(provider, text, options?)` with AIResponse<GeneratedSchema> return type, usage example checking `result.success`, cross-reference to dynamic-schema module
- [x] 1.4 Extend `### @common/database` Transaction Support: add `@Transaction({ retry, maxRetries })` decorator usage, `@TransactionParam()` for injecting ClientSession, `TransactionManager` (REQUEST-scoped) with `start()/commit()/abort()/end()/getSession()`, decision table comparing Decorator vs withTransaction vs TransactionManager

## Phase 2: Package README Updates

- [x] 2.1 Update `packages/ai/README.md`: add "Schema Generation from Image/Text" section with both method signatures, SchemaGenerationOptions interface, GeneratedSchema type (`{ fields, collectionName, metadata }`), code examples for each, error handling pattern (`SCHEMA_GENERATION_ERROR:` prefix), cross-reference to dynamic-schema pipeline
- [x] 2.2 Update `packages/database/README.md`: add "Declarative Transaction API" section after existing Transaction Support, covering `@Transaction()` with options table, TransactionManager lifecycle API code example, API comparison table (Decorator vs withTransaction vs TransactionManager), import path `@common/database`

## Phase 3: App-Level Documentation

- [x] 3.1 Update `BOILERPLATE.md` §3 project structure tree: add `dynamic-schema/` entry under `apps/nominas/src/modules/` (next to `usuarios/`)
- [x] 3.2 Create `apps/nominas/README.md`: header with app purpose, module composition table (6 imported modules from app.module.ts), local module index (usuarios CRUD, dynamic-schema AI pipeline), setup instructions (Node 20+, MongoDB, env vars, `npm install`, `npm run start:dev`), Swagger at `/api` and health at `/api/usuarios`, navigation links to AGENTS.md, BOILERPLATE.md, and package READMEs

## Phase 4: Verification

- [x] 4.1 Cross-check all 5 spec domains against modified files: verify endpoint tables match source controller signatures, decorator signatures match transaction source, method signatures match ai.service.ts, download options match download.service.ts
- [x] 4.2 Run `npm run lint` and `npm run build` — confirm zero regressions from documentation-only changes
