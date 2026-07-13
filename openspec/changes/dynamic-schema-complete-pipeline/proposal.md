# Proposal: dynamic-schema-complete-pipeline

## Intent

The `dynamic-schema` module is meant to convert external artifacts (PDF, DOCX, images, raw text) into a Mongoose schema that is **immediately available in the running app**, **pre-loaded with extracted data**, **correctable by an admin via the frontend**, and **able to grow with new fields over time without breaking old records**. Today, **none of that works**. The compiled `Schema` lives in a process-local `Map` (`apps/nominas/src/modules/dynamic-schema/services/schema-compiler.service.ts:8, 45`) that no other service can see, the `DynamicSchemaSchema` Mongoose model (`schemas/dynamic-schema.schema.ts`) is defined but never registered, the pipeline returns the schema JSON to the client but never inserts data, every endpoint is publicly accessible with no auth, and `collectionName` / `field.name` accept arbitrary strings. Five P0 blockers prevent the module from meeting its stated goal.

This change closes all five P0 blockers in one go, plus the minimum supporting work required for the user-correction flow the user described (PATCH endpoint, GET endpoints, schema versioning) and one AI method extension (`generateSchemaAndData`) that the user explicitly required to avoid a second LLM call.

## Why

- **Risk:** the `/pipeline` endpoint is a public OpenAI proxy. Today, anyone with network access to the service can call OpenAI on the project's bill, create arbitrary MongoDB collections, and pollute the database. P0 security + cost issue.
- **User value gap:** the user said "disponible inmediatamente" — that promise is unmet because the compiled `Schema` is orphaned in a `Map` and the Mongoose connection has no knowledge of it. No data is inserted. No frontend round-trip is possible.
- **NoSQL injection:** `collectionName` and `field.name` are not sanitized. A crafted `collectionName` like `__proto__` or a `field.name` starting with `$` is a known attack surface. P0.
- **Cost of doing nothing:** the existing `dynamic-schema` module will be the next feature the user tries to drive from the frontend, and the first attempt will fail with "model not found". Doing it now means one PR closes the gap; doing it later means three (registry → ingestion → auth) on a feature that was supposed to be done.
- **Cost of doing this now:** all needed pieces are already in this repo. `AuthModule` exposes `JwtAuthGuard` + `RolesGuard` + `@Public()` + `@Roles()` (`packages/auth/src/`). `TransactionService` is exported from `@common/database` with `withTransaction()`. `Connection` is injectable. `mongodb-memory-server` is in devDeps (verify in `apply` phase). The new work is glue + persistence wiring.

## Goals

1. The system MUST register the compiled Mongoose `Schema` with the live Mongoose `Connection` via `connection.model(name, schema)` and cache the returned `Model` so subsequent services can resolve it by collection name.
2. The system MUST persist every generated schema in the `dynamic_schemas` collection (the existing, currently-unwired `DynamicSchemaSchema`) and MUST replay all stored schemas through `SchemaCompilerService` on `OnApplicationBootstrap` so the app is restart-safe.
3. The system MUST insert at least one seed document into the new collection during the pipeline, with the document containing `{ rawText, parsedAt, source, originalFilename, schemaVersion, ...extractedData }`.
4. The system MUST expose `GET /dynamic-schema/collections/:name?limit=N` and `GET /dynamic-schema/collections/:name/:id` for the frontend read-after-write flow, and `PATCH /dynamic-schema/collections/:name/:id` for admin corrections — PATCH validation MUST reject unknown fields with HTTP 422.
5. The system MUST require authentication on every endpoint in `DynamicSchemaController`. `POST /pipeline` and `POST /compile` MUST be `@Roles('admin')`. `POST /extract` and `POST /generate-from-text` MUST be `@Public()` (anon triage is the user's explicit choice; reasoning: cost is much lower when the AI is asked for a `GeneratedSchema` only — no LLM call to write data). A global `APP_GUARD` (NestJS `JwtAuthGuard`) MUST be registered in `app.module.ts` so all controllers default to authenticated and opt out with `@Public()`.
6. The system MUST sanitize `collectionName` against the regex `^[a-z][a-z0-9_]{2,63}$` and MUST prefix the registered Mongo collection name with `dyn_`. A duplicate `collectionName` MUST return HTTP 409 Conflict unless the request sends the header `X-Force-Recreate: true`.
7. The system MUST sanitize every `field.name` against the regex `^[a-zA-Z_][a-zA-Z0-9_]{0,63}$` and MUST reject any name in the denylist `[password, token, secret, __proto__, __v, _id]`.
8. The system MUST add one new method `AiService.generateSchemaAndData(provider, text, options?)` that returns `{ schema: GeneratedSchema, data: Record<string, unknown> }` in a single LLM call. Existing `generateSchemaFromText` / `generateSchemaFromImage` MUST be left untouched.
9. The system MUST extend `SchemaFieldDefinition` (in `packages/ai/src/types/ai.types.ts`) with an optional `ui?: { widget?: string; options?: unknown[]; min?: number; max?: number; placeholder?: string; helpText?: string }` field. The `ui` field is optional and is inferred by the LLM when possible; the frontend falls back to type-based defaults when it is absent.
10. The system MUST add lightweight schema versioning: every registered `DynamicSchema` document gets a `version: number` and a `hash: string` of the canonicalized `GeneratedSchema` JSON. Re-running the pipeline on the same artifact with the same `hash` MUST be a no-op (idempotent). Re-running with a different `hash` MUST add the new version to the registry and use `schema.add()` to merge new fields into the existing Mongoose schema. **A type change on an existing field name MUST be rejected** (incompatible — Mongoose would throw at compile time anyway; we surface it as 422 upfront).
11. The system MUST add a global body limit of 12 MB in `main.ts` via `app.useBodyParser('json', { limit: '12mb' })`.
12. The system MUST have unit tests + integration tests + one e2e test that cover all 10 goals above. Strict TDD: tests are written first, fail, then implementation makes them pass.

## Non-goals

- File upload via `FileInterceptor` (still base64-in-body for P0; the change to multipart is its own PR)
- Rate limiting (`@nestjs/throttler`) — out of scope; deferred to a security-hardening change
- Helmet middleware — out of scope; deferred
- Inngest event wiring for pipeline runs — out of scope; deferred
- Full schema diff/migration system (renames, type changes) — only additive via `schema.add()`. Incompatible type changes are rejected, not migrated.
- `DELETE /dynamic-schema/collections/:name` — out of scope; not in the user's stated flow
- Multi-tenant isolation (per-user dynamic collections) — out of scope
- Configurable PDF/DOCX size limits in `@common/documents` — out of scope
- Wiring `AuthService` to read roles from the `usuarios` collection — already a known follow-up from the `usuarios-rbac` change
- Converting `BaseAdapter<T>` to abstract class (`@common/common`) — out of scope
- WebSocket / SSE for long-running pipeline progress — out of scope (frontend polls GET endpoints for now)

## Approach (high level)

**Step 1 — AI extension (`packages/ai/`).** Add `AiService.generateSchemaAndData(provider, text, options?)` that calls the LLM once with a JSON-mode prompt that asks for `{ schema: GeneratedSchema, data: Record<string, unknown> }`. Return an `AIResponse<{ schema: GeneratedSchema; data: Record<string, unknown> }>`. Add the optional `ui` field to `SchemaFieldDefinition` in `packages/ai/src/types/ai.types.ts` (Zod schema + interface + the existing `generateSchemaFromText` / `generateSchemaFromImage` parsers MUST accept the new field). Update `ai.module.ts` only if the new method requires new providers (it does not — it reuses the same `OpenAICompatibleProvider`).

**Step 2 — `DynamicModelRegistry` (new service, `apps/nominas/dynamic-schema/services/dynamic-model-registry.service.ts`).** Inject `@InjectConnection()` from `@nestjs/mongoose`. Expose `register(name: string, schema: mongoose.Schema): Model<any>`, `get(name: string): Model<any> | undefined`, `has(name: string): boolean`, and `list(): string[]`. `register` calls `this.connection.model(name, schema)` and caches the returned `Model` in a private `Map<string, Model<any>>`. Mongoose caches models by name on the connection, so re-registering with the same name is idempotent if the schema is structurally identical. This is the literal "disponibilidad inmediata" implementation.

**Step 3 — Persist schemas in `DynamicSchema` collection (`dynamic-schema.repository.ts` + `dynamic-schema.module.ts`).** Wire `MongooseModule.forFeature([{ name: DynamicSchema.name, schema: DynamicSchemaSchema }])` in `dynamic-schema.module.ts`. Extend `DynamicSchemaSchema` with `version: number`, `hash: string`, `createdBy: string`, `createdAt: Date`. Add a unique compound index on `(collectionName, version)`. Replace the stub `DynamicSchemaRepository` with a real one that wraps the model (`upsert(collectionName, version, hash, schemaJson, createdBy)`). In `DynamicSchemaModule.onApplicationBootstrap`, read all rows, pass them to `SchemaCompilerService.compileSchema`, then call `DynamicModelRegistry.register` for each. The compile-and-register is wrapped in a `try/catch` per collection so a single corrupt row does not poison the entire boot.

**Step 4 — Seed ingestion (extend `DynamicSchemaService.fullPipeline`).** After the LLM call, the result now includes `data`. The pipeline: (a) calls `SchemaCompilerService.compileSchema` (existing) with the LLM's `schema`, (b) calls `DynamicModelRegistry.register(name, compiled)` (new), (c) inside `TransactionService.withTransaction`, calls `Model.create({ rawText, parsedAt: new Date(), source: 'pipeline', originalFilename, schemaVersion, ...data })`, (d) commits, (e) returns `{ collectionName, schema, documentContent, insertedId }`. The `model` registration is intentionally **outside** the transaction because Mongoose model registration is a Node-side `connection.model()` call, not a Mongo write — it cannot participate in a transaction. This is a known Mongoose limitation and is documented in the code comment.

**Step 5 — `PATCH /collections/:name/:id` for corrections.** New endpoint in `DynamicSchemaController`. Resolves the `Model` via `DynamicModelRegistry.get(name)`. Validates the body against the **active** schema: `schema.paths` is enumerated; any key in the body that is not a path returns HTTP 422 with `{ code: 'UNKNOWN_FIELD', field: '...' }`. This enforces "PATCH is for corrections, not invention" — adding new fields goes through the full pipeline. Internally, `Model.findByIdAndUpdate(id, body, { new: true, runValidators: true })`.

**Step 6 — `GET /collections/:name?limit=N` and `GET /collections/:name/:id`.** Two new endpoints, both `@Roles('admin')`. The first returns `Model.find().limit(N).lean()`. The second returns `Model.findById(id).lean()` or 404.

**Step 7 — Auth + body limit (cross-cutting).** In `apps/nominas/src/app.module.ts`: add `AuthModule` to `imports`, add `{ provide: APP_GUARD, useClass: JwtAuthGuard }` to `providers`. In `DynamicSchemaController`: add `@UseGuards(JwtAuthGuard, RolesGuard)` at class level, `@Public()` on `extract` and `generate-from-text`, `@Roles('admin')` on `pipeline`, `compile`, the new collection endpoints. In `apps/nominas/src/main.ts`: `app.useBodyParser('json', { limit: '12mb' })`.

**Step 8 — Sanitization (cross-cutting).** Add `SanitizationService` (`apps/nominas/dynamic-schema/services/sanitization.service.ts`) with `sanitizeCollectionName(raw: string): string` (throws on regex fail) and `sanitizeFieldName(raw: string): string` (throws on regex fail or denylist hit). Call it at the boundary of `SchemaCompilerService.compileSchema` (rejecting invalid names) and at the boundary of `DynamicSchemaController` (rejecting invalid PATCH payloads). Throw `UnprocessableEntityException` with `{ code: 'INVALID_NAME' }` on fail.

**Step 9 — Tests (strict TDD).** All written BEFORE the corresponding implementation:
- `schema-compiler.service.spec.ts` — happy path, invalid collectionName, invalid field name, denylist hit, invalid `ui` shape, 60+ field names (huge schema).
- `dynamic-model-registry.service.spec.ts` — register returns Model, get returns same Model, has/list round-trip, idempotent re-register.
- `dynamic-schema.repository.spec.ts` — upsert, findAll, findByCollection, version+hash uniqueness.
- `dynamic-schema.service.spec.ts` — `fullPipeline` with mocked `AiService` and `DocumentProcessorService`, mocked `Connection` and `TransactionService`. Asserts the model is registered, the seed is inserted, the response shape is correct.
- `sanitization.service.spec.ts` — exhaustive table of valid/invalid collection names, field names, denylist hits.
- `dynamic-schema.controller.spec.ts` — every route returns the right status code (200, 401, 403, 404, 409, 422) with the right headers (`X-Force-Recreate` behavior, etc.).
- `apps/nominas/test/dynamic-schema.e2e-spec.ts` — full HTTP round-trip with a real Mongo (`mongodb-memory-server`): admin login → POST /pipeline with a base64 PDF → assert 201 + insertedId → GET /collections/:name/:id returns the same doc → PATCH a field → assert 200 → PATCH unknown field → assert 422.

## Scope

### In Scope

**`packages/ai/` (1 method added, 1 type extended)**
- `packages/ai/src/ai.service.ts` — new `generateSchemaAndData(provider, text, options?)` method (~50 LOC + tests).
- `packages/ai/src/types/ai.types.ts` — extend `SchemaFieldDefinition` with optional `ui` field; extend `GeneratedSchema.metadata` typing to allow `ui` info.
- `packages/ai/src/interfaces/provider.interface.ts` — extend the schema parsing layer to accept `ui`.
- `packages/ai/src/ai.service.spec.ts` — new tests for the new method.
- `packages/ai/README.md` — document the new method and the `ui` field.

**`apps/nominas/dynamic-schema/` (5 P0 items + corrections flow)**
- `dynamic-schema.module.ts` — register `MongooseModule.forFeature` for `DynamicSchema`, add `DynamicModelRegistry` and the real `DynamicSchemaRepository` to providers, wire `onApplicationBootstrap` for replay.
- `dynamic-schema.controller.ts` — add `@UseGuards` + `@Public()` + `@Roles('admin')` decorators, add the 3 new endpoints (GET list, GET one, PATCH one), the 409-on-duplicate logic with `X-Force-Recreate: true` header.
- `dynamic-schema.service.ts` — extend `fullPipeline` to ingest seed data, return `insertedId`, use `generateSchemaAndData` instead of two separate calls.
- `services/dynamic-model-registry.service.ts` — **NEW** — runtime `Model` registration, in-memory cache, `@InjectConnection()`.
- `services/schema-compiler.service.ts` — add `compileSchemaAndData` that returns the compiled `mongoose.Schema` AND the `GeneratedSchema` (the version + hash get computed here).
- `services/sanitization.service.ts` — **NEW** — `sanitizeCollectionName`, `sanitizeFieldName`, denylist.
- `dynamic-schema.repository.ts` — replace stub with a real repository bound to the `DynamicSchema` model.
- `schemas/dynamic-schema.schema.ts` — extend with `version`, `hash`, `createdBy`, `createdAt`; add unique compound index on `(collectionName, version)`.
- `dto/` — extend `ExtractDocumentDto` with `@MaxLength` on `document` and `@IsIn` on `format`; new `PatchDocumentDto` (forbidNonWhitelisted, partial of the active schema); new `CollectionPathParamsDto`.
- `__tests__/` — new spec files (listed in Step 9).
- `apps/nominas/test/dynamic-schema.e2e-spec.ts` — **NEW** — full HTTP round-trip test.

**`apps/nominas/` (cross-cutting wiring)**
- `app.module.ts` — import `AuthModule`, register `APP_GUARD: JwtAuthGuard`, import the new `DynamicModelRegistry` is implicit (it's in `DynamicSchemaModule`'s exports).
- `main.ts` — `app.useBodyParser('json', { limit: '12mb' })`.
- `AGENTS.md` §8 — document the dynamic-schema endpoint surface, the new `generateSchemaAndData` method, the `ui` field, the `dyn_` collection prefix, the `X-Force-Recreate` header.

### Out of Scope

- File upload via `FileInterceptor` — base64-in-body stays for P0
- Rate limiting (`@nestjs/throttler`) — deferred
- Helmet middleware — deferred
- Inngest event wiring for pipeline runs — deferred
- Full schema migration with diffing (renames, type coercion) — only additive
- `DELETE /dynamic-schema/collections/:name` — deferred
- Multi-tenant isolation — deferred
- Configurable PDF/DOCX size limits — deferred
- Wiring `AuthService` to read roles from `usuarios` — already a known follow-up
- WebSocket / SSE for pipeline progress — deferred
- Cross-process schema registry (e.g., Redis-backed) — out of scope; the Mongo `dynamic_schemas` collection already serves this purpose for single-instance deployments
- Test updates for the `usuarios` module's pre-existing 3 spec files that reference the pre-RBAC signatures — already a known follow-up from `usuarios-rbac`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/ai/src/ai.service.ts` | Modified | Add `generateSchemaAndData()` method |
| `packages/ai/src/types/ai.types.ts` | Modified | Add `ui?: {...}` to `SchemaFieldDefinition` |
| `packages/ai/src/interfaces/provider.interface.ts` | Modified | Parser tolerates `ui` field |
| `packages/ai/src/ai.service.spec.ts` | Modified | Tests for new method |
| `packages/ai/README.md` | Modified | Document new method + `ui` field |
| `apps/nominas/src/modules/dynamic-schema/dynamic-schema.module.ts` | Modified | Register `MongooseModule.forFeature`, add `DynamicModelRegistry` + real repository, wire `onApplicationBootstrap` |
| `apps/nominas/src/modules/dynamic-schema/dynamic-schema.controller.ts` | Modified | Auth + 3 new endpoints + 409 logic |
| `apps/nominas/src/modules/dynamic-schema/dynamic-schema.service.ts` | Modified | `fullPipeline` ingests seed, returns `insertedId` |
| `apps/nominas/src/modules/dynamic-schema/services/dynamic-model-registry.service.ts` | **New** | Runtime `Model` registration + cache |
| `apps/nominas/src/modules/dynamic-schema/services/schema-compiler.service.ts` | Modified | Compute `version` + `hash`, expose `compileSchemaAndData` |
| `apps/nominas/src/modules/dynamic-schema/services/sanitization.service.ts` | **New** | Collection/field name sanitization + denylist |
| `apps/nominas/src/modules/dynamic-schema/dynamic-schema.repository.ts` | **Modified** (was stub) | Real repository bound to `DynamicSchema` model |
| `apps/nominas/src/modules/dynamic-schema/schemas/dynamic-schema.schema.ts` | Modified | Add `version`, `hash`, `createdBy`, `createdAt`; unique compound index |
| `apps/nominas/src/modules/dynamic-schema/dto/generate-schema.dto.ts` | Modified | `@MaxLength` + `@IsIn` on extract; new `PatchDocumentDto` + `CollectionPathParamsDto` |
| `apps/nominas/src/modules/dynamic-schema/__tests__/schema-compiler.service.spec.ts` | **New** | Compile happy path + invalid inputs |
| `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-model-registry.service.spec.ts` | **New** | Register/get/has/list round-trip |
| `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-schema.repository.spec.ts` | **New** | upsert / findAll / findByCollection / uniqueness |
| `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-schema.service.spec.ts` | **New** | `fullPipeline` orchestration with mocks |
| `apps/nominas/src/modules/dynamic-schema/__tests__/sanitization.service.spec.ts` | **New** | Exhaustive valid/invalid table |
| `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-schema.controller.spec.ts` | **New** | Status code matrix (200/401/403/404/409/422) |
| `apps/nominas/test/dynamic-schema.e2e-spec.ts` | **New** | Full HTTP round-trip with `mongodb-memory-server` |
| `apps/nominas/src/app.module.ts` | Modified | Import `AuthModule`; add `APP_GUARD: JwtAuthGuard` |
| `apps/nominas/src/main.ts` | Modified | `app.useBodyParser('json', { limit: '12mb' })` |
| `AGENTS.md` §8 | Modified | Document the new dynamic-schema surface, the `dyn_` prefix, the `X-Force-Recreate` header, the `ui` field |

**Estimated LOC**: ~800-1000 new + modified production code, ~600-800 test code. **Total change is likely 1400-1800 lines** — this will trigger the chained-PR review guard in `sdd-tasks` and `branch-pr`. Expect a request to split into 2-3 chained PRs (likely: PR1 = persistence + registry, PR2 = ingestion + endpoints, PR3 = auth + sanitization + tests).

## Decisions taken (with rationale)

1. **Collection naming pattern: `dyn_<collectionName>` with regex `^[a-z][a-z0-9_]{2,63}$`** — prevents collision with internal collections (`usuarios`, `dynamic_schemas`); ops can grep for `dyn_` to find all user-generated collections; the regex is a SQL/NoSQL injection guard.
2. **On duplicate `collectionName`: 409 Conflict unless `X-Force-Recreate: true`** — explicit, safe, no accidental data loss. The user explicitly said "no romper registros viejos" — the default is preservation, the opt-in is recreation.
3. **Schema evolution: versioned registry + `schema.add()` for new fields; reject incompatible type changes** — preserves data, allows growth, doesn't try to be a full migration system. The user said "agregar campos, no romper registros viejos" — `schema.add()` with new fields is the Mongoose-native way to do this. New fields are `null` for old records, which is exactly the behavior requested.
4. **One LLM call returns `{ schema, data }`** — the user explicitly said "no waste tokens on a second call". The implementation uses OpenAI's `response_format: { type: 'json_object' }` with a prompt that asks for both keys.
5. **Seed document = `{ rawText, parsedAt, source, originalFilename, schemaVersion }` + LLM-extracted `data`** — honest about what was extracted (the LLM's `data` is one field-level representation) + the raw fallback is available for re-extraction or audit.
6. **PATCH validates against the active schema (no new fields, 422 on unknown)** — type-safe corrections. PATCH is for fixing what the LLM got wrong, not for inventing new fields. New fields go through the full pipeline.
7. **Optional `ui` field inferred by LLM; frontend falls back to type-based defaults** — the user said "renderizar el formulario sin configuración manual". The `ui` field is the LLM's best guess; if it guesses wrong, the frontend can override (e.g., a `string` field with no `ui` renders as `<input type="text">`).
8. **Auth: `JwtAuthGuard` global via `APP_GUARD`, `@Roles('admin')` on `/pipeline` and `/compile`; `/extract` and `/generate-from-text` are `@Public()`** — the user said "el admin debe poder revisar y corregir". `/extract` and `/generate-from-text` are read-only-ish (low cost, no data write), so they stay public for anon triage.
9. **Body limit: 12mb global in `main.ts`** — 10MB raw base64 + headroom for the schema JSON. Hard limit prevents memory bombs.
10. **Persistence: register `DynamicSchemaSchema` in `MongooseModule.forFeature`; replay on `OnApplicationBootstrap`** — restart-safe. The `DynamicSchema` collection is the single source of truth for which collections exist; on every boot, the app rebuilds its in-memory `Model` cache from this collection.
11. **Seed insert wrapped in `TransactionService.withTransaction`; model registration is pre-transaction (Mongoose limitation)** — atomic seed insert; the model registration is a connection-level operation that cannot participate in a transaction. This is a known Mongoose limitation and is documented inline.
12. **Field name sanitization: `^[a-zA-Z_][a-zA-Z0-9_]{0,63}$`, denylist: `[password, token, secret, __proto__, __v, _id]`** — prevents NoSQL operator injection (`$where`, `$ne`, etc.), schema poisoning, and accidental storage of credentials in unencrypted fields.
13. **PATCH validation rejects unknown fields with 422** — type-safe corrections only. Same rationale as Decision 6.

## Capabilities

> This section is the CONTRACT between proposal and specs phases. The `sdd-spec` agent reads this to know which spec files to create or update.

### New Capabilities
- `dynamic-schema-runtime-registry`: runtime registration of compiled Mongoose `Schema` objects with the live `Connection`; persistent registry (`dynamic_schemas` collection); boot-time replay. Located in `apps/nominas/src/modules/dynamic-schema/`.
- `dynamic-schema-ingestion`: pipeline step that inserts a seed document into the newly-registered collection; transaction-wrapped; merges raw metadata with LLM-extracted data.
- `dynamic-schema-corrections`: PATCH endpoint that validates a correction against the active schema (no new fields); GET endpoints for read-after-write; admin-only.
- `dynamic-schema-sanitization`: collection name and field name sanitization with regex + denylist; rejects invalid input at the boundary.
- `ai-schema-and-data`: one-shot LLM call that returns `{ schema, data }` together (token-efficient).
- `ai-field-ui-metadata`: optional `ui` field on `SchemaFieldDefinition` (widget, options, min/max, placeholder, helpText); inferred by LLM, falls back to type-based defaults on the frontend.

### Modified Capabilities
- `dynamic-schema-module` (existing capability in `openspec/specs/dynamic-schema-module/`): auth, sanitization, persistence, ingestion, GET/PATCH endpoints, and the `dyn_` collection prefix all change the spec-level contract. A **delta spec** is required in this change folder.
- `ai-schema-generation` (existing capability in `openspec/specs/ai-schema-generation/`): the `ui` field addition and the new `generateSchemaAndData` method extend the contract. A **delta spec** is required.
- `auth` (existing capability, indirectly): this change is the first feature-module consumer of the global `APP_GUARD` pattern. The auth spec's wording around "guards must be applied at the controller level" needs to be relaxed to "or globally via `APP_GUARD` + `@Public()`" — a **delta spec** is required. Small wording change only.

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|------------|------------|
| 1 | **Process-local `Model` cache is single-instance only** — load-balanced multi-instance deployments will have different registered models on different nodes | Medium | The persistence layer (Decision 10) makes it restart-safe on a single instance. Multi-instance is out of scope for P0; documented as a future change (Redis-backed or shared MongoDB pubsub). |
| 2 | **LLM hallucination of field types or collection names** — the LLM can return garbage and we trust it | High | Post-parse Zod validation (in `SchemaCompilerService`) rejects invalid `type` values; sanitization rejects invalid names. The LLM is NOT the source of truth — the schema and sanitization are. |
| 3 | **Seed insert happens AFTER model registration, not inside the transaction** — Mongoose limitation | Certain (documented) | Model registration is a connection-level operation that cannot participate in a transaction. The pattern is: (1) register the model, (2) inside the transaction, insert the seed, (3) commit, (4) outside the transaction, the response is sent. If step 2 fails, the model is registered with no data; the caller gets 5xx; the registry doc exists. A retry from the client re-uses the registered model. This is documented inline in the code. |
| 4 | **`Schema.add()` is permissive** — adding a field with the same name but different type throws at runtime | Medium | `SchemaCompilerService.compileSchemaAndData` checks the existing field type before adding; rejects incompatible changes with 422. The Mongoose throw is a defense-in-depth check. |
| 5 | **Strict TDD requires tests up front** — `DynamicModelRegistry` needs a real Mongo connection in tests | High | Use `mongodb-memory-server` (verify in devDeps during `apply` phase; add as a devDep if missing). The e2e test uses the same. |
| 6 | **Chained-PR review guard will fire** — 1400-1800 LOC is over the 400-line threshold | Certain | `sdd-tasks` will request a split. The natural seams are: (PR1) `DynamicModelRegistry` + persistence + boot replay, (PR2) `fullPipeline` ingestion + GET/PATCH endpoints, (PR3) auth + sanitization + 409 + tests for the AI extension. Each PR has a clear deliverable. |
| 7 | **Global `APP_GUARD` breaks any existing anonymous client** | High (if any exist) | The `dynamic-schema` controller is the only known public controller (audit found zero `@Public()` decorators anywhere). Adding the global guard with `@Public()` opt-outs is backward-compatible. Document in CHANGELOG. |
| 8 | **`@Public()` on `extract` and `generate-from-text` is a cost-amplification vector** — an attacker can still call the LLM with no auth | Medium | Both endpoints do a single small LLM call (one JSON object, low token count). The cost is bounded. Future change adds `@nestjs/throttler`. |
| 9 | **`DynamicSchemaSchema` index migration** — adding `version` + `hash` to a schema that has no current data | Low | The collection is currently empty (the file is dead code). No migration needed; Mongoose will create the index on first write. |
| 10 | **`Schema.add()` field reordering** — Mongoose uses insertion order for field ordering in the UI; adding a field in the middle breaks ordering | Low | `schema.add()` appends new fields at the end. Documented behavior; acceptable. |

## Rollback Plan

1. **Code-level:** `git revert` the merge commit(s). All changes are additive or replace-guarded — no destructive migrations. The `version` and `hash` fields on `DynamicSchemaSchema` are non-breaking additive schema changes (Mongoose tolerates missing fields, default applies on next write). The `ui` field on `SchemaFieldDefinition` is optional. The new endpoints are additive. The auth guard is the most "breaking" change — but `@Public()` is used on the only endpoints that were anonymously accessible before, so rollback is a one-line change: remove the `APP_GUARD` provider and the `@UseGuards` decorator on the controller.
2. **Database-level:** no migration needed. The `dynamic_schemas` collection is new; on rollback, the collection can be dropped without affecting the `usuarios` collection or any other existing collection. Any user-created `dyn_*` collections (which contain only data the user uploaded themselves) are also safe to drop. Existing `usuarios` and other collections are untouched.
3. **Config-level:** remove the `useBodyParser('json', { limit: '12mb' })` line in `main.ts` if it causes issues. Default 100kb limit returns.
4. **AuthModule wiring:** if removing the global guard breaks the `usuarios` module (which has its own RBAC), the per-controller `@UseGuards(JwtAuthGuard, RolesGuard)` on `UsuariosController` is unchanged by this PR and continues to work without the global guard.
5. **Hotfix path:** if a single endpoint misbehaves in production, disable it by setting `@Roles('admin')` and rolling the env — the endpoint becomes 403 for all users and 0% of traffic hits it. This is the safest immediate mitigation.

## Dependencies

- `sdd/dynamic-schema-audit/explore` (Engram #137) — completed; the 5 P0 blockers are documented
- `sdd/usuarios-rbac/proposal` (Engram #103) — completed; `RolesGuard` + `@Roles()` + `JwtAuthGuard` are available
- `@common/auth` — `AuthModule`, `JwtAuthGuard`, `RolesGuard`, `@Public()`, `@Roles()` (all already exported)
- `@common/database` — `TransactionService.withTransaction()` (already exported)
- `@common/ai` — `AiService.generateSchemaAndData()` (new, this change adds it)
- `mongodb-memory-server` — verify in devDeps; add if missing
- `mongoose` 9.x — `connection.model(name, schema)`, `Schema.add()` (both stable APIs)

## Success Criteria

- [ ] `apps/nominas/src/modules/dynamic-schema/services/dynamic-model-registry.service.ts` exists, has `register`, `get`, `has`, `list` methods, and is wired into `DynamicSchemaModule.providers`
- [ ] `apps/nominas/src/modules/dynamic-schema/dynamic-schema.module.ts` registers `MongooseModule.forFeature([{ name: DynamicSchema.name, schema: DynamicSchemaSchema }])` with the extended schema (version, hash, createdBy, createdAt, unique compound index)
- [ ] `DynamicSchemaModule.onApplicationBootstrap` reads all stored schemas and registers them with `DynamicModelRegistry`; a single corrupt row does not crash the boot
- [ ] `POST /dynamic-schema/pipeline` returns `{ collectionName, schema, insertedId, documentContent }` and the inserted document is queryable via `GET /dynamic-schema/collections/:name/:id`
- [ ] `POST /dynamic-schema/pipeline` without an admin JWT returns 403; with a non-admin JWT returns 403; with no JWT returns 401
- [ ] `POST /dynamic-schema/pipeline` with a `collectionName` that already exists returns 409 unless the request sends `X-Force-Recreate: true`
- [ ] `POST /dynamic-schema/pipeline` with a `collectionName` that fails the regex `^[a-z][a-z0-9_]{2,63}$` returns 422
- [ ] `POST /dynamic-schema/pipeline` with a field name that fails the regex `^[a-zA-Z_][a-zA-Z0-9_]{0,63}$` returns 422
- [ ] `POST /dynamic-schema/pipeline` with a field name in the denylist (`password`, `token`, `secret`, `__proto__`, `__v`, `_id`) returns 422
- [ ] `PATCH /dynamic-schema/collections/:name/:id` with a field not in the active schema returns 422
- [ ] `PATCH /dynamic-schema/collections/:name/:id` with a field in the active schema returns 200 and the updated document
- [ ] `GET /dynamic-schema/collections/:name?limit=10` returns up to 10 documents
- [ ] `GET /dynamic-schema/collections/:name/:id` returns the document or 404
- [ ] The Mongo collection for a user-created schema is named `dyn_<collectionName>` (verified in the e2e test by reading `mongoose.connection.db.listCollections()`)
- [ ] `AiService.generateSchemaAndData('openai', 'some text')` returns `{ schema, data }` in a single LLM call (verified by a unit test that asserts the LLM provider is called exactly once)
- [ ] `SchemaFieldDefinition.ui` is optional, can be omitted, and the LLM is free to include or exclude it
- [ ] On app restart, the previously-registered dynamic collections are queryable without re-running the pipeline (boot replay works)
- [ ] `main.ts` has `app.useBodyParser('json', { limit: '12mb' })`
- [ ] `app.module.ts` has `AuthModule` in `imports` and `{ provide: APP_GUARD, useClass: JwtAuthGuard }` in `providers`
- [ ] All unit tests in `__tests__/` pass: `schema-compiler.service.spec.ts`, `dynamic-model-registry.service.spec.ts`, `dynamic-schema.repository.spec.ts`, `dynamic-schema.service.spec.ts`, `sanitization.service.spec.ts`, `dynamic-schema.controller.spec.ts`, `ai.service.spec.ts` (extended)
- [ ] The e2e test `apps/nominas/test/dynamic-schema.e2e-spec.ts` passes: admin login → POST /pipeline → GET /collections/:name/:id → PATCH a field → PATCH unknown field (422)
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run test:e2e` passes
- [ ] `AGENTS.md` §8 documents: (a) the 3 new endpoints, (b) the `dyn_` prefix, (c) the `X-Force-Recreate` header, (d) the new `generateSchemaAndData` method, (e) the `ui` field, (f) the global `APP_GUARD` pattern
