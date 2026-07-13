# Tasks: dynamic-schema-complete-pipeline

## Summary

Closes 5 P0 blockers in `apps/nominas/src/modules/dynamic-schema/` (orphan schema in process-local Map, unwired `DynamicSchemaSchema`, no data insertion, public OpenAI proxy, no input sanitization) and adds the minimum supporting surface (runtime registry + persistence + boot replay, seed ingestion, GET/PATCH corrections, `ui` field metadata, global `APP_GUARD`, 409 on duplicate, 12 MB body limit). 5 chained PRs, ~1400-1800 LOC, each PR independently reviewable in ~60 minutes.

## Delivery Decision (awaiting user input)

The estimated change is **1400-1800 LOC**, which exceeds the 400-line threshold from `chained-pr` skill. A single PR is not reviewable in ~60 minutes.

**Question 1 — Delivery strategy**:

- (A) **Single PR with `size:exception`** — one PR, requires explicit maintainer approval, easier to review as a whole, harder to revert surgically.
- (B) **Chained PRs (5 PRs as per design §9)** — each PR is ≤600 LOC, independently reviewable, but requires picking a chain strategy.

**Question 2 — If you pick (B), chain strategy**:

- (i) **stacked-to-main** — each PR merges to main in order; fast iteration, fix on the go; best for speed-first teams and independent slices.
- (ii) **feature-branch-chain** — a tracker branch accumulates integration; PR1 targets the tracker, later child PRs target the immediate parent branch; only the tracker merges to main; best for rollback control and coordinated releases.

**Recommended default** (if the user says "lo que tú digas"):

- (B) + (i) stacked-to-main, because each slice is genuinely independent (foundation → AI extension → pipeline → cross-cutting → e2e+docs), and the foundation slice is required for the others but they don't depend on each other.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1400-1800 (total) / ≤600 (per PR) |
| 400-line budget risk | Low (per-PR) / High (total) |
| Chained PRs recommended | Yes |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |
| Decision needed before apply | Yes |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main|feature-branch-chain|pending
400-line budget risk: Low (per PR), High (total)

## Chained PR Map

### Dependency diagram

```
PR1: Foundation (registry + persistence + boot replay)   📍 READY
  └─► PR2: AI extension (generateSchemaAndData + ui field)
        └─► PR3: Pipeline + corrections (ingestion + GET/PATCH + sanitization at compiler)
              └─► PR4: Cross-cutting (auth + sanitization at controller + 409 + main.ts)
                    └─► PR5: E2E + AGENTS.md
```

### PR1 — Foundation: registry + persistence + boot replay

- **Scope**: `DynamicModelRegistry` (new service, ~80 LOC), `DynamicSchemaSchema` extension with `version`/`hash`/`createdBy`/`createdAt` + unique compound index (~30 LOC), `DynamicSchemaRepository` real implementation bound to the Mongoose model (~90 LOC), `DynamicSchemaModule` `onApplicationBootstrap` for boot replay (~50 LOC), `MongooseModule.forFeature` registration (~5 LOC).
- **Files**:
  - `apps/nominas/src/modules/dynamic-schema/services/dynamic-model-registry.service.ts` (NEW)
  - `apps/nominas/src/modules/dynamic-schema/schemas/dynamic-schema.schema.ts` (MOD)
  - `apps/nominas/src/modules/dynamic-schema/dynamic-schema.repository.ts` (MOD — was stub)
  - `apps/nominas/src/modules/dynamic-schema/dynamic-schema.module.ts` (MOD)
- **Tests**:
  - `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-model-registry.service.spec.ts` (NEW, ~150 LOC)
  - `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-schema.repository.spec.ts` (NEW, ~120 LOC)
- **Estimated LOC**: ~400-500 (production + tests).
- **Spec files covered**: `dynamic-schema-runtime-registry/spec.md` (full), `dynamic-schema-module/spec.md` (delta on persistence + module structure).
- **Dependencies**: none.
- **Risk**: low (pure infrastructure; no controller changes; no auth).

### PR2 — AI extension: one-shot schema + data + ui field

- **Scope**: `AiService.generateSchemaAndData` method (~80 LOC), `SchemaFieldDefinition.ui?` field with all sub-properties optional + Zod schema extension (~10 LOC), parser tolerance in `generateSchemaFromText` / `generateSchemaFromImage` for the new `ui` field (~5 LOC), `packages/ai/README.md` update with the new method + fallback table (~30 lines).
- **Files**:
  - `packages/ai/src/ai.service.ts` (MOD — add `generateSchemaAndData`)
  - `packages/ai/src/types/ai.types.ts` (MOD — extend `SchemaFieldDefinition`)
  - `packages/ai/README.md` (MOD)
- **Tests**:
  - `packages/ai/src/ai.service.spec.ts` (NEW, ~150 LOC) — covers all 4 failure modes, the success path, and the warning-on-mismatch behavior.
- **Estimated LOC**: ~150-200 (production + tests + docs).
- **Spec files covered**: `ai-schema-and-data/spec.md` (full), `ai-field-ui-metadata/spec.md` (full), `ai-schema-generation/spec.md` (delta on parser tolerance + deprecation note).
- **Dependencies**: PR1 (because PR3 uses `generateSchemaAndData` and the `ui` field in the pipeline).
- **Risk**: low (additive only; existing methods untouched).

### PR3 — Pipeline + corrections (ingestion + GET/PATCH + RESERVED_KEY)

- **Scope**: `fullPipeline` rewrite to ingest seed + return `insertedId` (~100 LOC, with inline comment about Mongoose transaction limitation), `RESERVED_PATCH_KEYS` constant + check (~20 LOC), `GET /collections/:name?limit=N` (~30 LOC), `GET /collections/:name/:id` (~30 LOC), `PATCH /collections/:name/:id` with schema validation + reserved-key check + unknown-field check (~80 LOC), DTOs (`PatchDocumentDto`, `CollectionPathParamsDto`) (~50 LOC), `SanitizationService` (new, ~80 LOC), `SchemaCompilerService.compileSchemaAndData` with `version` + `hash` computation + sanitization at the compiler boundary (~60 LOC of changes).
- **Files**:
  - `apps/nominas/src/modules/dynamic-schema/services/dynamic-schema.service.ts` (MOD — `fullPipeline` rewrite)
  - `apps/nominas/src/modules/dynamic-schema/services/schema-compiler.service.ts` (MOD — add `compileSchemaAndData`)
  - `apps/nominas/src/modules/dynamic-schema/services/sanitization.service.ts` (NEW)
  - `apps/nominas/src/modules/dynamic-schema/constants/patch.constants.ts` (NEW)
  - `apps/nominas/src/modules/dynamic-schema/dynamic-schema.controller.ts` (MOD — add 3 new endpoints, NOT YET guarded with auth/roles — that lands in PR4)
  - `apps/nominas/src/modules/dynamic-schema/dto/generate-schema.dto.ts` (MOD — add `PatchDocumentDto`, `CollectionPathParamsDto`)
  - `apps/nominas/src/modules/dynamic-schema/dynamic-schema.module.ts` (MOD — register `SanitizationService`, add `RESERVED_PATCH_KEYS` to constants path)
- **Tests**:
  - `apps/nominas/src/modules/dynamic-schema/__tests__/sanitization.service.spec.ts` (NEW, ~180 LOC — exhaustive table of 13 collection cases + 14 field cases + 6 denylist cases + 1 case-sensitivity test)
  - `apps/nominas/src/modules/dynamic-schema/__tests__/schema-compiler.service.spec.ts` (NEW, ~150 LOC)
  - `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-schema.service.spec.ts` (NEW, ~200 LOC — mocked `AiService` + `DocumentProcessorService` + `DynamicModelRegistry` + `TransactionService` + `DynamicSchemaRepository`; uses `jest.spyOn` order check for `registry.register` vs `transaction.withTransaction`)
  - `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-schema.controller.spec.ts` (NEW, ~120 LOC for the 3 new endpoints — auth status codes added in PR4)
- **Estimated LOC**: ~500-600.
- **Spec files covered**: `dynamic-schema-ingestion/spec.md` (full), `dynamic-schema-corrections/spec.md` (full), `dynamic-schema-sanitization/spec.md` (full — both boundary checks), `dynamic-schema-module/spec.md` (delta on controller endpoint table + pipeline returns `insertedId`).
- **Dependencies**: PR1, PR2.
- **Risk**: medium (transaction safety, model registration ordering, PATCH edge cases). PR3 lands WITHOUT auth — endpoints are temporarily public; PR4 closes the gap.

### PR4 — Cross-cutting: auth + sanitization at controller + 409 + main.ts

- **Scope**: `SanitizationService` integration in `DynamicSchemaController` (call `sanitizeCollectionName` + `sanitizeFieldName` on every body key in `POST /pipeline`, `POST /compile`, `PATCH /collections/:name/:id`) (~30 LOC), `@UseGuards(JwtAuthGuard, RolesGuard)` at class level, `@Public()` on `extract` + `generate-from-text`, `@Roles('admin')` on `generate-from-image` + `compile` + `pipeline` + 3 new collection endpoints (~30 LOC), 409-on-duplicate logic in `POST /pipeline` with `X-Force-Recreate: true` opt-in (~30 LOC), `app.module.ts` add `AuthModule` + `APP_GUARD: JwtAuthGuard` provider (~10 LOC), `main.ts` `app.useBodyParser('json', { limit: '12mb' })` (~2 LOC), `ExtractDocumentDto` `@MaxLength(10*1024*1024)` on `document` + `@IsIn(['pdf','docx','doc'])` on `format` (~10 LOC).
- **Files**:
  - `apps/nominas/src/modules/dynamic-schema/dynamic-schema.controller.ts` (MOD — auth decorators + sanitization calls + 409 logic)
  - `apps/nominas/src/modules/dynamic-schema/dto/generate-schema.dto.ts` (MOD — extend `ExtractDocumentDto`)
  - `apps/nominas/src/app.module.ts` (MOD — add `AuthModule` + `APP_GUARD`)
  - `apps/nominas/src/main.ts` (MOD — body limit)
- **Tests**:
  - `apps/nominas/src/modules/dynamic-schema/__tests__/dynamic-schema.controller.spec.ts` (extend with the full status code matrix: 200/201/400/401/403/404/409/422 for every route; `X-Force-Recreate` behavior; empty PATCH body; reserved-key + unknown-field short-circuit; ~80 LOC of additions).
- **Estimated LOC**: ~200-300.
- **Spec files covered**: `dynamic-schema-sanitization/spec.md` (delta on controller boundary), `dynamic-schema-module/spec.md` (delta on auth + 409), `auth-global-app-guard/spec.md` (full).
- **Dependencies**: PR1, PR2, PR3 (because the controller methods being gated were added in PR3).
- **Risk**: medium (global `APP_GUARD` is cross-cutting; **pre-merge grep for `@Public()` is required** to confirm no anonymous client breaks. As of 2026-07-02 audit, only `POST /usuarios` is `@Public()` in the existing app — the global guard is backward-compatible).

### PR5 — E2E + AGENTS.md

- **Scope**: `mongodb-memory-server` added to `devDependencies` (~5 LOC in `package.json`), `apps/nominas/test/dynamic-schema.e2e-spec.ts` (NEW, full HTTP round-trip: admin login → `POST /pipeline` with a base64 PDF → assert 201 + `insertedId` → `GET /collections/:name/:id` returns the same doc → `PATCH` a field → assert 200 → `PATCH` unknown field → assert 422; ~150 LOC), `AGENTS.md` §8 update with: (a) the 3 new endpoints, (b) the `dyn_` prefix, (c) the `X-Force-Recreate` header, (d) the new `generateSchemaAndData` method, (e) the `ui` field + frontend fallback table, (f) the global `APP_GUARD` pattern (~50 lines of doc).
- **Files**:
  - `package.json` (MOD — devDep)
  - `apps/nominas/test/dynamic-schema.e2e-spec.ts` (NEW)
  - `AGENTS.md` (MOD §8)
- **Tests**: the e2e test is the deliverable; if `mongodb-memory-server` cannot be installed in CI, the e2e test is skippable, NOT a hard failure.
- **Estimated LOC**: ~150-200.
- **Spec files covered**: cross-cutting (full module coverage; closes the verify loop).
- **Dependencies**: PR1, PR2, PR3, PR4.
- **Risk**: low (mongodb-memory-server install compatibility in CI is the only known issue; see design §8 mitigation).

## Phase 1: PR1 — Foundation (registry + persistence + boot replay)

> **Strict TDD**: every implementation task is preceded by a failing test. Tasks are completable in one agent session.

### 1.1 — `DynamicSchemaSchema` extension (test-first)

- [ ] 1.1.1 **Test first**: extend `__tests__/dynamic-schema.repository.spec.ts` with cases that read back `version`, `hash`, `createdBy`, `createdAt` on a saved document and assert the unique compound index on `(collectionName, version)` exists. Run `npm run test -- dynamic-schema.repository` — expect FAIL (fields do not exist yet).
- [ ] 1.1.2 **Implement**: modify `apps/nominas/src/modules/dynamic-schema/schemas/dynamic-schema.schema.ts` — add `@Prop({ type: Number, required: true, default: 1 }) version`, `@Prop({ type: String, required: true }) hash`, `@Prop({ type: String, required: true }) createdBy`, `@Prop({ type: Date }) createdAt?` (already implicit via `timestamps: true`); add `@Index({ collectionName: 1, version: 1 }, { unique: true })` class decorator. Run `npm run test` — expect PASS.
- **Commit**: `feat(dynamic-schema): extend DynamicSchemaSchema with version + hash + unique compound index`

### 1.2 — `DynamicSchemaRepository` real implementation (TDD)

- [ ] 1.2.1 **Test first**: `__tests__/dynamic-schema.repository.spec.ts` cases for `upsert(collectionName, version, hash, schemaDefinition, createdBy)` (idempotency: 2nd call with same `(collectionName, version)` does NOT duplicate), `findAll()` (returns rows sorted by `collectionName` + `version`), `findByCollection(name)` (returns all versions for one collection), `findOneByNameAndVersion(name, version)`. Use `mongodb-memory-server` for the unique-index test (others can use jest mock of the Mongoose model).
- [ ] 1.2.2 **Implement**: rewrite `apps/nominas/src/modules/dynamic-schema/dynamic-schema.repository.ts` — inject `@InjectModel(DynamicSchema.name)`, expose `upsert` (uses `findOneAndUpdate` with `upsert: true`), `findAll`, `findByCollection`, `findOneByNameAndVersion`. No more stub.
- **Commit**: `feat(dynamic-schema): implement real DynamicSchemaRepository bound to Mongoose model`

### 1.3 — `DynamicModelRegistry` service (TDD)

- [ ] 1.3.1 **Test first**: `__tests__/dynamic-model-registry.service.spec.ts` — mock `@InjectConnection()` to return a fake `Connection` whose `model(name, schema)` returns a stub `Model`. Cases: `register` calls `connection.model(name, schema)` exactly once, `get` returns the cached `Model`, `has` returns boolean, `list` returns keys in insertion order, `delete` calls `connection.deleteModel(name)` + clears the cache, idempotent re-register (same hash → no `schema.add` call), additive growth (new field → `existingSchema.add(...)` called), incompatible type change → throws `UnprocessableEntityException` with `code: 'INCOMPATIBLE_SCHEMA_CHANGE', field`, empty registry (list/has no-throw), rename is treated additively (old field preserved, new field added).
- [ ] 1.3.2 **Implement**: create `apps/nominas/src/modules/dynamic-schema/services/dynamic-model-registry.service.ts` — inject `@InjectConnection() connection: Connection`, private `Map<string, Model<any>>` cache, methods: `register(name, schema)`, `get(name)`, `has(name)`, `list()`, `delete(name)`. Hash computation: sort `Object.keys(newSchema.paths)`, `JSON.stringify(canonicalizedPaths)`, hash with `crypto.createHash('sha256')`.
- [ ] 1.3.3 **Wire into `DynamicSchemaModule.providers`**: modify `dynamic-schema.module.ts` to add `DynamicModelRegistry` to `providers`. Run `npm run build` — expect PASS.
- **Commit**: `feat(dynamic-schema): add DynamicModelRegistry for runtime Model registration`

### 1.4 — `MongooseModule.forFeature` registration + `onApplicationBootstrap`

- [ ] 1.4.1 **Implement**: in `dynamic-schema.module.ts`, add `MongooseModule.forFeature([{ name: DynamicSchema.name, schema: DynamicSchemaSchema }])` to `imports`. Add `DynamicSchemaRepository` to `providers` (already there as a stub, now real).
- [ ] 1.4.2 **Implement**: make `DynamicSchemaModule` implement `OnApplicationBootstrap`; in the method, read `repository.findAll()`, for each row call `schemaCompiler.compileSchemaAndData(parsedSchema, row.collectionName)` (will fail at this point — see PR3.2 — so this PR only registers a TODO + logs the row count, with a placeholder compile call that uses the existing `compileSchema`). For corrupt rows, log a warning and continue. Run `npm run build` + `npm run test` — expect PASS.
- **Commit**: `feat(dynamic-schema): wire MongooseModule.forFeature + OnApplicationBootstrap replay`

### 1.5 — Verify PR1

- [ ] 1.5.1 Run `npm run build` (no TS errors).
- [ ] 1.5.2 Run `npm run lint` (no errors).
- [ ] 1.5.3 Run `npm run test` (all green; the 3 broken `usuarios/__tests__/*.spec.ts` are known follow-ups, NOT this PR's concern).
- **No commit** (verification step only).

## Phase 2: PR2 — AI extension (one-shot schema + data + ui field)

### 2.1 — `SchemaFieldDefinition.ui?` field (test-first)

- [ ] 2.1.1 **Test first**: in `packages/ai/src/ai.service.spec.ts` (new file), case for type-shape: a `SchemaFieldDefinition` without `ui` is valid; one with `ui: { widget: 'datepicker' }` parses; one with `ui: { placeholder: 'x' }` parses; `ui: undefined` is accepted; the existing `generateSchemaFromText` and `generateSchemaFromImage` parse a response that includes `ui` on one field (regression: existing callers not broken).
- [ ] 2.1.2 **Implement**: in `packages/ai/src/types/ai.types.ts`, add to `SchemaFieldDefinition`:
  ```ts
  ui?: {
    widget?: string;
    options?: unknown[];
    min?: number;
    max?: number;
    placeholder?: string;
    helpText?: string;
  };
  ```
  Update the Zod schema in the parser to make `ui` optional. Run tests — expect PASS.
- [ ] 2.1.3 **Docs**: update `packages/ai/README.md` with the new `ui` field + the frontend fallback widget table (string→text, number→number, boolean→checkbox, date→datepicker, array→repeater, object→fieldset).
- **Commit**: `feat(ai): add optional ui field to SchemaFieldDefinition with parser tolerance`

### 2.2 — `AiService.generateSchemaAndData` method (TDD)

- [ ] 2.2.1 **Test first**: cases in `ai.service.spec.ts`:
  - one LLM call asserted (mock provider counts `chat` calls; after the call, `expect(provider.chat).toHaveBeenCalledTimes(1)`)
  - prompt content includes the literal string `"schema"` and `"data"` and instructs `data` keys to match `schema.fields[].name`
  - 4 failure modes: unknown provider (`SCHEMA_GENERATION_ERROR: Unknown provider`, no LLM call), malformed JSON (`SCHEMA_GENERATION_ERROR: Malformed JSON`), invalid schema format (missing `fields` array or `collectionName`), invalid data format (`data` not an object)
  - success path returns `{ success: true, data: { schema, data } }`
  - data type validation warning: `data.amount = '100'` with `schema.fields.amount.type = 'number'` → log warning `"Field \"amount\" expected number, got string"`, response still success
  - unknown field in data → log warning, response still success
- [ ] 2.2.2 **Implement**: in `packages/ai/src/ai.service.ts`, add `generateSchemaAndData(providerName, text, options?)`. Use `response_format: { type: 'json_object' }` in the `chat` call. Parse the LLM response with a Zod schema that requires `{ schema: GeneratedSchemaZ, data: Z.record(Z.unknown()) }`. Walk `data` keys vs `schema.fields[].name` + `type`; log mismatches.
- **Commit**: `feat(ai): add generateSchemaAndData single-call method returning { schema, data }`

### 2.3 — Verify PR2

- [ ] 2.3.1 Run `npm run build` + `npm run test` (all green; existing `generateSchemaFromText` / `generateSchemaFromImage` tests pass unchanged).
- **No commit** (verification step only).

## Phase 3: PR3 — Pipeline + corrections (ingestion + GET/PATCH + RESERVED_KEY)

### 3.1 — `SanitizationService` (TDD)

- [ ] 3.1.1 **Test first**: `__tests__/sanitization.service.spec.ts` — exhaustive table per the sanitization spec (13 collection cases + 14 field cases + 6 denylist cases + 1 case-sensitivity test). Cases include: valid collection, 3-char name, mixed-case reject, leading digit reject, leading underscore reject, 2-char reject, 65-char reject, empty reject, hyphen reject, `$where` reject, `dyn.system` (dot) reject, space reject; valid field, single-letter field, underscore-prefixed field, hyphen reject, leading-digit reject, empty reject, 65-char reject, `$where` reject; denylist cases for `password`, `token`, `secret`, `__proto__`, `__v`, `_id`; case-sensitivity (`Password` is NOT in denylist; `apiToken` is NOT in denylist because the check is exact-match not substring).
- [ ] 3.1.2 **Implement**: create `apps/nominas/src/modules/dynamic-schema/services/sanitization.service.ts`. Module-level `RESERVED_FIELD_NAMES = ['password', 'token', 'secret', '__proto__', '__v', '_id']` (frozen). Two methods:
  ```ts
  sanitizeCollectionName(raw: string): string // throws UnprocessableEntityException({ code: 'INVALID_NAME' })
  sanitizeFieldName(raw: string): string      // throws UnprocessableEntityException({ code: 'INVALID_NAME', field: raw })
  ```
  Collection regex: `^[a-z][a-z0-9_]{2,63}$`. Field regex: `^[a-zA-Z_][a-zA-Z0-9_]{0,63}$`. Denylist check after regex pass.
- [ ] 3.1.3 **Wire**: add `SanitizationService` to `DynamicSchemaModule.providers`.
- **Commit**: `feat(dynamic-schema): add SanitizationService with regex + denylist`

### 3.2 — `SchemaCompilerService.compileSchemaAndData` + version + hash (TDD)

- [ ] 3.2.1 **Test first**: `__tests__/schema-compiler.service.spec.ts` — happy path (LLM-extracted `GeneratedSchema` → `mongoose.Schema` with correct types), invalid field type (`'weird'` → `SCHEMA_COMPILATION_ERROR`), 60+ fields (loop stress), `ui` field round-trip (the `ui` shape is preserved on the metadata, NOT mapped to Mongoose props), hash determinism (same input → same hash, regardless of field order), `compileSchemaAndData` returns `{ schema, version, hash }` where `hash` is the canonicalized JSON sha256.
- [ ] 3.2.2 **Implement**: in `services/schema-compiler.service.ts`, add `compileSchemaAndData(generated: GeneratedSchema, collectionName: string): { schema: mongoose.Schema, version: number, hash: string }`. Reuse existing `compileSchema` for the Mongoose construction. Compute `hash` by sorting `generated.fields` by `name`, then `crypto.createHash('sha256').update(JSON.stringify(canonicalized)).digest('hex')`. Compute `version` by reading the repo's `findByCollection(collectionName)` and returning `maxVersion + 1` (default 1 if no rows). Inject `SanitizationService` and call `sanitizeFieldName` on every `field.name` (defense-in-depth: defense layer 1 of 2; controller layer is added in PR4).
- [ ] 3.2.3 **Update 1.4.2**: now that `compileSchemaAndData` exists, replace the placeholder in `onApplicationBootstrap` with the real call. Re-verify tests.
- **Commit**: `feat(dynamic-schema): add compileSchemaAndData with version + hash + field sanitization`

### 3.3 — `RESERVED_PATCH_KEYS` constant + `DynamicSchemaService.fullPipeline` rewrite (TDD)

- [ ] 3.3.1 **Test first**: `__tests__/dynamic-schema.service.spec.ts` — cases:
  - pipeline makes exactly one `AiService.generateSchemaAndData` call (assert via mock call count)
  - AI call failure short-circuits (no `registry.register`, no `txn.withTransaction`, response is `{ success: false, error: 'SCHEMA_GENERATION_ERROR' }`)
  - successful pipeline: model is registered BEFORE the transaction starts (use `jest.spyOn` order check: `expect(registry.register).toHaveBeenCalledBefore(txn.withTransaction)`)
  - seed document shape: `{ rawText, parsedAt, source: 'pipeline', originalFilename, schemaVersion, ...data }`
  - seed collision warning: `data._id = 'attacker'` is dropped, warning logged, system-generated `_id` is the actual one
  - successful commit returns `insertedId`
  - transaction abort leaves the registered `Model` in the registry
  - `dynamicSchemaRepository.upsert` is called AFTER the transaction (with `collectionName`, `version`, `hash`, `schemaJson`, `createdBy`)
- [ ] 3.3.2 **Implement**: in `services/dynamic-schema.service.ts`:
  - Add `RESERVED_PATCH_KEYS` constant (exported to a new `apps/nominas/src/modules/dynamic-schema/constants/patch.constants.ts`).
  - Rewrite `fullPipeline`: (a) `documentProcessor.extract`, (b) one call to `aiService.generateSchemaAndData`, (c) `schemaCompiler.compileSchemaAndData` (gets `{ schema, version, hash }`), (d) `dynamicModelRegistry.register('dyn_' + sanitizedName, compiledSchema)` (the `dyn_` prefix is applied here; the sanitized name is what's sanitized; full code comment about Mongoose transaction limitation), (e) `transactionService.withTransaction(async (session) => model.create({ rawText, parsedAt, source: 'pipeline', originalFilename, schemaVersion, ...data }, { session }))`, (f) outside the transaction, `dynamicSchemaRepository.upsert(...)`, (g) return `{ success: true, documentContent, generatedSchema, collectionName: 'dyn_' + sanitizedName, insertedId }`.
  - Add constructor injection of `DynamicModelRegistry`, `DynamicSchemaRepository`, `TransactionService`.
- **Commit**: `feat(dynamic-schema): rewrite fullPipeline for seed ingestion + registry + transaction`

### 3.4 — DTOs: `PatchDocumentDto` + `CollectionPathParamsDto` (TDD)

- [ ] 3.4.1 **Test first**: `__tests__/generate-schema.dto.spec.ts` (NEW, ~40 LOC) — `PatchDocumentDto` is `@IsObject` (any object), keys are not pre-validated (the controller does field-by-field check against `schema.paths`); `CollectionPathParamsDto` validates `:name` matches `^[a-z][a-z0-9_]{2,63}$` and `:id` is a valid ObjectId (`@IsMongoId`).
- [ ] 3.4.2 **Implement**: in `dto/generate-schema.dto.ts`, add `PatchDocumentDto` and `CollectionPathParamsDto`. Use class-validator decorators.
- **Commit**: `feat(dynamic-schema): add PatchDocumentDto and CollectionPathParamsDto`

### 3.5 — Controller: 3 new endpoints (GET list, GET one, PATCH) (TDD)

- [ ] 3.5.1 **Test first**: `__tests__/dynamic-schema.controller.spec.ts` (NEW, ~120 LOC) — tests the 3 new endpoints with mocked service + mock `DynamicModelRegistry`. Status codes: 200 / 400 / 404 / 422. Auth status codes (401/403) added in PR4. Cases per `dynamic-schema-corrections` spec:
  - GET list with default limit → 200 with array
  - GET list with `?limit=10` → 200 with up to 10 docs (assert `model.find().limit(10)`)
  - GET list with `?limit=9999` → limit clamped to 200
  - GET list on unknown collection → 404
  - GET one on known id → 200
  - GET one on missing id → 404
  - GET one on malformed ObjectId → 400
  - PATCH on known field → 200, `findByIdAndUpdate` called with `{ new: true, runValidators: true }`
  - PATCH on unknown field → 422 `{ code: 'UNKNOWN_FIELD', field }` BEFORE the DB write
  - PATCH with mixed valid+unknown → 422 on the unknown key, document unchanged
  - PATCH with empty body `{}` → 200 unchanged doc, no DB write
  - PATCH on missing id → 404
- [ ] 3.5.2 **Implement**: in `dynamic-schema.controller.ts`, add:
  - `GET /collections/:name?limit=N` — `findOneByNameAndVersion` resolution → `model.find().limit(clampedLimit).lean()`; clamps `limit` to `[1, 200]`, default 50; 404 if `!registry.has(name)`.
  - `GET /collections/:name/:id` — `try { new ObjectId(id) } catch { throw 400 }`; `model.findById(id).lean()`; 404 if null.
  - `PATCH /collections/:name/:id` — `CollectionPathParamsDto`, then iterate `Object.keys(body)`, reject reserved keys first (422 `RESERVED_KEY`), then reject unknown fields vs `model.schema.paths` (422 `UNKNOWN_FIELD`), then `model.findByIdAndUpdate(id, body, { new: true, runValidators: true })`. Catch Mongoose `ValidationError` → 400.
- **Commit**: `feat(dynamic-schema): add GET list / GET one / PATCH collection endpoints`

### 3.6 — Verify PR3

- [ ] 3.6.1 Run `npm run build` + `npm run test` (all green; 3 broken `usuarios` specs are known follow-ups).
- [ ] 3.6.2 Manually confirm: the new 3 endpoints are reachable (no auth yet — that lands in PR4).
- **No commit** (verification step only).

## Phase 4: PR4 — Cross-cutting (auth + sanitization at controller + 409 + main.ts)

### 4.1 — `app.module.ts`: register `AuthModule` + `APP_GUARD` (TDD)

- [ ] 4.1.1 **Verify before commit**: grep `@Public()` in `apps/` — confirmed at planning time that only `POST /usuarios` is public; `UsuariosController` has its own `@UseGuards(JwtAuthGuard, RolesGuard)`, so the global guard is backward-compatible (NestJS dedupes guard execution). Document the grep result in the commit body.
- [ ] 4.1.2 **Implement**: in `app.module.ts`:
  - Add `AuthModule` to `imports`.
  - Add `{ provide: APP_GUARD, useClass: JwtAuthGuard }` to `providers`.
- [ ] 4.1.3 **Test**: re-run `npm run test -- usuarios` — confirm `usuarios` tests still pass.
- **Commit**: `feat(app): register global APP_GUARD: JwtAuthGuard with AuthModule`

### 4.2 — `main.ts`: 12 MB body limit

- [ ] 4.2.1 **Implement**: in `main.ts`, add `app.useBodyParser('json', { limit: '12mb' })` after `NestFactory.create`. (Order matters: must be set before any request is processed; placing it right after `app.setGlobalPrefix` is safe.)
- **Commit**: `feat(app): set global JSON body limit to 12mb for dynamic-schema payloads`

### 4.3 — Controller: auth decorators + sanitization calls + 409 logic (TDD)

- [ ] 4.3.1 **Test first**: extend `__tests__/dynamic-schema.controller.spec.ts` with the full status code matrix (~80 LOC additions):
  - `@Public()` on `extract`: 200 without JWT, 200 with valid JWT
  - `@Public()` on `generate-from-text`: same
  - `@Roles('admin')` on `pipeline`: 401 without JWT, 403 with non-admin JWT, 200/201 with admin JWT
  - `@Roles('admin')` on `compile`: same
  - `@Roles('admin')` on `generate-from-image`: same (this method existed but is being moved from public to admin in this PR)
  - `@Roles('admin')` on the 3 new collection endpoints: same
  - 409 on `POST /pipeline` with existing `dyn_<name>` and NO `X-Force-Recreate` header
  - 201 on `POST /pipeline` with existing `dyn_<name>` AND `X-Force-Recreate: true` header (asserts `registry.delete(name)` was called)
  - 422 on `POST /pipeline` with invalid `collectionName` (e.g., `__proto__`) — sanitization at controller boundary
  - 422 on `POST /compile` with invalid `collectionName` or denylisted field name
  - 422 on PATCH with reserved key (e.g., `_id`, `__proto__`, `parsedAt`, `source`, `originalFilename`, `schemaVersion`)
  - 422 on PATCH with mixed reserved + unknown → `RESERVED_KEY` wins (first violation reported)
- [ ] 4.3.2 **Implement** in `dynamic-schema.controller.ts`:
  - Add class-level `@UseGuards(JwtAuthGuard, RolesGuard)`.
  - Add `@Public()` to `extract` and `generate-from-text`.
  - Add `@Roles('admin')` to `generate-from-image`, `compile`, `fullPipeline`, and the 3 new collection endpoints.
  - Inject `SanitizationService` in the constructor.
  - In `compile` and `pipeline`: call `sanitization.sanitizeCollectionName(dto.collectionName)` and `sanitization.sanitizeFieldName` on every `dto.schema.fields[].name` BEFORE the service call. Throw 422 on failure.
  - In PATCH: run `RESERVED_KEY` check first (reject any body key in `RESERVED_PATCH_KEYS`), then `UNKNOWN_FIELD` check (reject any body key not in `model.schema.paths`). All before `findByIdAndUpdate`.
  - In `pipeline` (POST): add `X-Force-Recreate` header check via `@Headers('x-force-recreate')`. If `registry.has('dyn_' + sanitizedName) && !forceRecreate`, throw `ConflictException({ code: 'COLLECTION_EXISTS', name: 'dyn_' + sanitizedName })`. If `forceRecreate`, call `registry.delete('dyn_' + sanitizedName)` and let the pipeline re-register.
- [ ] 4.3.3 **Extend `ExtractDocumentDto`**: add `@MaxLength(10*1024*1024)` on `document` and `@IsIn(['pdf', 'docx', 'doc'])` on `format` (controller-boundary defense before the doc processor is called).
- **Commit**: `feat(dynamic-schema): apply auth + sanitization + 409 on dynamic-schema controller`

### 4.4 — Verify PR4

- [ ] 4.4.1 Run `npm run build` + `npm run lint` + `npm run test` (all green).
- [ ] 4.4.2 Manually verify: `POST /api/dynamic-schema/extract` works without auth; `POST /api/dynamic-schema/pipeline` returns 401 without JWT, 403 with non-admin, 200/201/409/422 with admin.
- **No commit** (verification step only).

## Phase 5: PR5 — E2E + AGENTS.md

### 5.1 — Add `mongodb-memory-server` to devDependencies

- [ ] 5.1.1 **Verify first**: `grep -F 'mongodb-memory-server' package.json` — confirmed at planning time that it is NOT present (verified in design §8, `package.json:58-89`).
- [ ] 5.1.2 **Implement**: `npm install --save-dev mongodb-memory-server` (let the install determine the latest version compatible with Mongoose 9.x). The lock file change is part of this commit.
- **Commit**: `chore(deps): add mongodb-memory-server for e2e tests`

### 5.2 — `apps/nominas/test/dynamic-schema.e2e-spec.ts` (NEW)

- [ ] 5.2.1 **Implement**: full HTTP round-trip with `mongodb-memory-server` (started in `beforeAll`, stopped in `afterAll`):
  - `beforeAll`: start `MongoMemoryServer.create()`, override the `MONGODB_URI` env var before the Nest app starts, create a test admin user in the `usuarios` collection, log in to get a JWT.
  - Test 1 — happy path: `POST /api/dynamic-schema/pipeline` with a base64 PDF (minimal valid 1-page PDF) + admin JWT → assert 201 + `insertedId` is non-empty + `collectionName` starts with `dyn_`.
  - Test 2 — read-after-write: `GET /api/dynamic-schema/collections/<name>/<insertedId>` with admin JWT → assert 200 + document shape (`rawText`, `parsedAt`, `source: 'pipeline'`, `originalFilename`, `schemaVersion` + the LLM-extracted fields).
  - Test 3 — PATCH correction: `PATCH /api/dynamic-schema/collections/<name>/<insertedId>` with `{ <existingField>: <newValue> }` + admin JWT → assert 200 + updated document.
  - Test 4 — PATCH unknown field: `PATCH /api/dynamic-schema/collections/<name>/<insertedId>` with `{ evil: 'x' }` + admin JWT → assert 422 `{ code: 'UNKNOWN_FIELD', field: 'evil' }`.
  - Test 5 — PATCH reserved key: `PATCH /api/dynamic-schema/collections/<name>/<insertedId>` with `{ _id: 'hijack' }` + admin JWT → assert 422 `{ code: 'RESERVED_KEY', field: '_id' }`.
  - Test 6 — auth gates: `POST /api/dynamic-schema/pipeline` without JWT → 401; with non-admin JWT → 403; `@Public()` on `POST /api/dynamic-schema/extract` works without JWT.
  - Test 7 — collection prefix: after the pipeline run, assert `mongoose.connection.db.listCollections().toArray()` includes the `dyn_<name>` collection.
  - Test 8 — invalid collection name: `POST /api/dynamic-schema/compile` with `collectionName: '__proto__'` + admin JWT → 422 `{ code: 'INVALID_NAME' }`.
  - **Failure mode**: if `mongodb-memory-server` install fails in the CI runner, the test is wrapped in `describe.skip` or `it.todo` with a clear log message — NEVER a hard CI failure.
- **Commit**: `test(dynamic-schema): add full HTTP round-trip e2e test with mongodb-memory-server`

### 5.3 — `AGENTS.md` §8 update

- [ ] 5.3.1 **Implement**: in `AGENTS.md` §8 ("External Services" or wherever `@common/ai` / `@common/auth` are documented), add a new subsection `### @common/dynamic-schema (app module)` with:
  - Endpoint table (8 rows): each method, path, auth (`@Public()` / `@Roles('admin')`), request DTO, response DTO, status codes.
  - The `dyn_` collection prefix (where it's applied, who sanitizes).
  - The `X-Force-Recreate: true` header behavior.
  - The `AiService.generateSchemaAndData` method (link to `ai-schema-and-data` spec).
  - The `ui` field on `SchemaFieldDefinition` + the frontend fallback widget table.
  - The global `APP_GUARD` pattern (link to `auth-global-app-guard` spec).
- **Commit**: `docs(agents): document dynamic-schema endpoint surface + auth + sanitization`

### 5.4 — Verify PR5

- [ ] 5.4.1 Run `npm run build` (no TS errors).
- [ ] 5.4.2 Run `npm run lint` (no errors).
- [ ] 5.4.3 Run `npm run test` (all unit tests pass).
- [ ] 5.4.4 Run `npm run test:e2e -- dynamic-schema.e2e-spec` (full HTTP round-trip passes).
- [ ] 5.4.5 Manually verify: the dev server starts, `POST /api/dynamic-schema/pipeline` with a real PDF produces a `dyn_*` collection queryable via `GET /api/dynamic-schema/collections/:name/:id`.
- **No commit** (verification step only).

## Work-Unit Commit Map

Per `work-unit-commits` skill — every commit is a candidate chained-PR slice. PR boundaries are pre-defined above; the commits listed below are the granular plan the `sdd-apply` agent will follow.

| PR | Commit | Work unit | Files |
|----|--------|-----------|-------|
| PR1 | 1 | `feat(dynamic-schema): extend DynamicSchemaSchema with version + hash + unique compound index` | `schemas/dynamic-schema.schema.ts`, `__tests__/dynamic-schema.repository.spec.ts` |
| PR1 | 2 | `feat(dynamic-schema): implement real DynamicSchemaRepository bound to Mongoose model` | `dynamic-schema.repository.ts`, `__tests__/dynamic-schema.repository.spec.ts` |
| PR1 | 3 | `feat(dynamic-schema): add DynamicModelRegistry for runtime Model registration` | `services/dynamic-model-registry.service.ts` (NEW), `__tests__/dynamic-model-registry.service.spec.ts` (NEW), `dynamic-schema.module.ts` |
| PR1 | 4 | `feat(dynamic-schema): wire MongooseModule.forFeature + OnApplicationBootstrap replay` | `dynamic-schema.module.ts` |
| PR1 | 5 | `chore(dynamic-schema): verify PR1 build + lint + test green` (no code change) | — |
| PR2 | 6 | `feat(ai): add optional ui field to SchemaFieldDefinition with parser tolerance` | `packages/ai/src/types/ai.types.ts`, `packages/ai/src/ai.service.ts` (parser), `packages/ai/README.md`, `packages/ai/src/ai.service.spec.ts` (NEW) |
| PR2 | 7 | `feat(ai): add generateSchemaAndData single-call method returning { schema, data }` | `packages/ai/src/ai.service.ts`, `packages/ai/src/ai.service.spec.ts` |
| PR2 | 8 | `chore(ai): verify PR2 build + test green` (no code change) | — |
| PR3 | 9 | `feat(dynamic-schema): add SanitizationService with regex + denylist` | `services/sanitization.service.ts` (NEW), `__tests__/sanitization.service.spec.ts` (NEW), `dynamic-schema.module.ts` |
| PR3 | 10 | `feat(dynamic-schema): add compileSchemaAndData with version + hash + field sanitization` | `services/schema-compiler.service.ts`, `__tests__/schema-compiler.service.spec.ts` (NEW) |
| PR3 | 11 | `feat(dynamic-schema): rewrite fullPipeline for seed ingestion + registry + transaction` | `services/dynamic-schema.service.ts`, `constants/patch.constants.ts` (NEW), `__tests__/dynamic-schema.service.spec.ts` (NEW) |
| PR3 | 12 | `feat(dynamic-schema): add PatchDocumentDto and CollectionPathParamsDto` | `dto/generate-schema.dto.ts`, `__tests__/generate-schema.dto.spec.ts` (NEW) |
| PR3 | 13 | `feat(dynamic-schema): add GET list / GET one / PATCH collection endpoints` | `dynamic-schema.controller.ts`, `__tests__/dynamic-schema.controller.spec.ts` (NEW) |
| PR3 | 14 | `chore(dynamic-schema): verify PR3 build + lint + test green` (no code change) | — |
| PR4 | 15 | `feat(app): register global APP_GUARD: JwtAuthGuard with AuthModule` | `app.module.ts` |
| PR4 | 16 | `feat(app): set global JSON body limit to 12mb for dynamic-schema payloads` | `main.ts` |
| PR4 | 17 | `feat(dynamic-schema): apply auth + sanitization + 409 on dynamic-schema controller` | `dynamic-schema.controller.ts`, `dto/generate-schema.dto.ts` (extend `ExtractDocumentDto`), `__tests__/dynamic-schema.controller.spec.ts` (extend) |
| PR4 | 18 | `chore(dynamic-schema): verify PR4 build + lint + test green` (no code change) | — |
| PR5 | 19 | `chore(deps): add mongodb-memory-server for e2e tests` | `package.json` |
| PR5 | 20 | `test(dynamic-schema): add full HTTP round-trip e2e test with mongodb-memory-server` | `apps/nominas/test/dynamic-schema.e2e-spec.ts` (NEW) |
| PR5 | 21 | `docs(agents): document dynamic-schema endpoint surface + auth + sanitization` | `AGENTS.md` §8 |
| PR5 | 22 | `chore(dynamic-schema): verify PR5 build + lint + test + e2e green` (no code change) | — |

**Total: 22 commits across 5 PRs.** No commit mixes a behavior with its tests (work-unit-commits rule). No commit mixes a behavior with unrelated cleanup (work-unit-commits rule).

## Out-of-Scope Tasks (explicitly NOT in this change)

Each item is a candidate for its own SDD change. Tracked in `openspec/changes/follow-up/` if/when prioritized:

- File upload via `FileInterceptor` (multipart) — base64-in-body stays for P0
- Rate limiting (`@nestjs/throttler`) — security hardening
- Helmet middleware — security hardening
- Inngest event wiring for pipeline runs — async pipeline UX
- Full schema migration with diffing (renames, type coercion, computed defaults) — out of scope per proposal
- `DELETE /dynamic-schema/collections/:name` — not in the user's stated flow
- Multi-tenant isolation (per-user dynamic collections) — deferred
- Configurable PDF/DOCX size limits in `@common/documents` — deferred
- Wiring `AuthService` to read roles from `usuarios` collection (JWT roles are static) — already known follow-up from `usuarios-rbac`
- Fixing the 3 broken spec files in `usuarios/__tests__/*.spec.ts` (pre-RBAC signatures) — already known follow-up
- Cross-process schema registry (Redis-backed or MongoDB pubsub) — multi-instance gap is documented in the proposal
- Migrating the existing `Map<string, Schema>` in `SchemaCompilerService` (line 8) to the new `DynamicModelRegistry` — orphan code removal is its own PR after PR1 lands

## Verification Checklist (per PR)

For each PR to be mergeable, the following MUST be true:

- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm run test` passes (all unit tests; the 3 known-broken `usuarios` specs are out of scope)
- [ ] No `console.log` left in production code (use `Logger` from `@nestjs/common`)
- [ ] No new `TODO`/`FIXME` left in production code
- [ ] No new dependencies added without justification (the only added dep is `mongodb-memory-server` in PR5)
- [ ] The commit body explains WHY (not just WHAT) per `work-unit-commits` rule
- [ ] Each commit's diff is ≤400 lines (work-unit rule + chained-pr budget)
- [ ] (PR4 only) `grep -r '@Public()' apps/` shows no anonymous client was broken (audit confirmed at planning time)
- [ ] (PR5 only) `npm run test:e2e -- dynamic-schema.e2e-spec` passes; e2e is skippable (not hard-fail) if `mongodb-memory-server` cannot install

## Total Effort

| PR | Production LOC | Test LOC | Total | Estimated effort |
|----|----------------|----------|-------|------------------|
| PR1 — Foundation | ~220 | ~270 | ~490 | 1-1.5 days |
| PR2 — AI extension | ~120 | ~150 | ~270 | 0.5-1 day |
| PR3 — Pipeline + corrections | ~450 | ~650 | ~1100 | 1.5-2 days |
| PR4 — Cross-cutting | ~100 | ~80 | ~180 | 0.5-1 day |
| PR5 — E2E + docs | ~150 | ~150 | ~300 | 0.5-1 day |
| **Total** | **~1040** | **~1300** | **~2340** (incl. tests) | **4-6.5 days** |

The original `sdd-propose` estimate was 6-7 days of focused work for 1-1.5 days per PR. This breakdown is consistent with that estimate. The 1400-1800 LOC figure from the proposal refers to **production code only**; adding test LOC brings the total to ~2300.

**Single-PR alternative would be 5-7 days of work in one reviewable unit — exceeds the 60-minute review budget per `chained-pr` skill.**

## Cross-Cutting Pre-Flight Checks (MUST pass before apply phase)

These were flagged by `sdd-design` and verified at planning time:

1. **mongodb-memory-server is NOT in devDeps** — confirmed (PR5.1 adds it as the first action).
2. **Global APP_GUARD is cross-cutting** — audit found only `POST /usuarios` is `@Public()` in the existing app (`grep @Public() apps/` returned 4 matches, all in `usuarios`). The `UsuariosController` has its own `@UseGuards(JwtAuthGuard, RolesGuard)` at the class level; NestJS dedupes guard execution, so the global guard is backward-compatible.
3. **3 spec files in `usuarios/__tests__/` are broken from `usuarios-rbac`** — explicit follow-up; do NOT block on them.
4. **mongodb-memory-server may not install in CI** — e2e test is skippable, NOT a hard failure.
5. **RESERVED_PATCH_KEYS security check** — included in PR3 (constant + check + 3 new test scenarios in `dynamic-schema-corrections` spec).
