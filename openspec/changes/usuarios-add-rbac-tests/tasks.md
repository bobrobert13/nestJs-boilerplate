# Tasks: Add Tests for Usuarios Module with RBAC

## Summary
Test follow-up to the archived `usuarios-rbac` change: fix the Jest `moduleNameMapper`/`roots`/`moduleDirectories` blocker, then add 6 new spec files (3 framework + 2 domain + 1 E2E) and update 3 stale domain spec files in place. 10 work-unit tasks + 3 verifications, ~733 changed lines across 10 unique files. **Single branch `test/usuarios-add-rbac-tests`, no PR** (user is solo, no push).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Total estimated changed lines | **~733** (8 jest config + 190 framework + 355 domain updates/new + 120 E2E + 60 new DTO) |
| Files touched | **10** (1 modified `package.json` + 3 new framework + 3 updated + 2 new domain + 1 new E2E) |
| Risk level | **Medium** — Jest config change has cross-cutting side effect (activates 2 dormant `packages/inngest/*.spec.ts` files); security-adjacent code (`assignRoles`, `grantAdminByEmail`, `RolesGuard`, self-mod guard) |
| Chained PRs recommended | **No** — user accepted single-branch strategy for solo work |
| 400-line budget risk | **High** — ~733 LOC well over 400-line budget, but user override applied |
| Delivery strategy | ask-on-risk (cached: user chose single-branch) |
| Decision needed before apply | **No** — user decision cached: single branch, no PR ceremony |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High
```

## Execution order
Phase 1 (Jest config) MUST complete first because it unblocks the 2 stale spec files (`controller.spec.ts`, `service.spec.ts`) that currently fail to load, and it enables the 3 new framework specs in `packages/`. Phase 2 (framework unit tests) is pure functions and is the fastest to write and verify. Phase 3 (domain unit tests) depends on Phase 1 for the `@common/*` resolution and on Phase 2 for the hierarchy contract that `RolesGuard` tests rely on. Phase 4 (E2E) depends on Phase 1 + Phase 3 (controller + module under test). Each task is independently committable per work-unit-commits skill.

## Phase 1: Test infrastructure (CRITICAL — unblocks everything else)

#### 1.1 Fix Jest config in `package.json`
- **Files**: MODIFIED `package.json` (jest config block only, lines 85-104)
- **Depends on**: nothing
- **Estimated lines**: +5 to +10 lines in jest config
- **What to do**:
  - Add `moduleNameMapper: { "^@common/(.*)$": "<rootDir>/packages/$1/src/index.ts" }` to resolve workspace path aliases declared in `tsconfig.json` (lines 24-33) but missing from jest.
  - Update `roots` from `["<rootDir>/apps/"]` to `["<rootDir>/apps/", "<rootDir>/packages/"]` so the new `packages/auth/src/rbac/__tests__/*.spec.ts` files are discovered (side effect: also activates 2 dormant `packages/inngest/src/*.spec.ts` files — intentional, any failures are a separate bug).
  - Add `moduleDirectories: ["node_modules", "<rootDir>"]` for `moduleResolution: "nodenext"` to find workspace packages.
  - Run `npm run test` to verify 2 of 3 stale spec files now LOAD.
- **Acceptance**: `npm run test` shows 0 `Cannot find module '@common/...'` errors. The 2 previously-failing-to-load spec files (`usuarios.controller.spec.ts`, `usuarios.service.spec.ts`) now load (assertion failures OK, that's expected — that's what Phase 3 fixes).
- **Work-unit commit message**: `chore(test): add jest moduleNameMapper for @common/* paths`

## Phase 2: Framework unit tests (pure functions + NestJS guard, no `@common/*` resolution needed at runtime)

#### 2.1 Write `packages/auth/src/rbac/__tests__/role-hierarchy.spec.ts`
- **Files**: NEW `packages/auth/src/rbac/__tests__/role-hierarchy.spec.ts`
- **Depends on**: 1.1 (jest config must include `packages/` in `roots`)
- **Estimated lines**: ~50
- **What to do** (covers rbac-framework-tests spec `hasAtLeastRole` requirement, 5 scenarios):
  - Test 1: higher role satisfies lower requirement — `hasAtLeastRole(['admin'], 'user', hierarchy)` → `true` (R1.1)
  - Test 2: lower role fails higher requirement — `hasAtLeastRole(['user'], 'admin', hierarchy)` → `false` (R1.2)
  - Test 3: one of multiple user roles satisfies — `hasAtLeastRole(['user', 'manager'], 'manager', hierarchy)` → `true` (R1.3)
  - Test 4: empty user roles never satisfy — `hasAtLeastRole([], 'user', hierarchy)` → `false` (R1.4)
  - Test 5: unknown role in userRoles treated as rank 0 — `hasAtLeastRole(['guest'], 'user', hierarchy)` → `false`
  - (Optional config-guard test: required role not in hierarchy throws Error)
- **Acceptance**: All 5 (or 6) tests pass. No NestJS DI, no mocks. Hierarchy declared as `Object.freeze`d constant at `describe` scope.
- **Work-unit commit message**: `test(rbac): add hasAtLeastRole hierarchy utility tests`

#### 2.2 Write `packages/auth/src/rbac/__tests__/cannot-self-modify.spec.ts`
- **Files**: NEW `packages/auth/src/rbac/__tests__/cannot-self-modify.spec.ts`
- **Depends on**: 1.1
- **Estimated lines**: ~40
- **What to do** (covers rbac-framework-tests spec `assertCanModifyOtherRoles` requirement, 3 scenarios):
  - Test 1: requester.id === target.id throws `ForbiddenException` (R2.1)
  - Test 2: exception message includes the substring "Cannot modify your own roles" (R2.1)
  - Test 3: different ids return `undefined` (void) without throwing (R2.2)
  - Test 4: helper accepts plain `{ readonly id: string }` literals — domain-agnostic contract, proves no Mongoose `Document` dependency (R2.3, both compile + runtime check)
- **Acceptance**: All 3-4 tests pass. `ForbiddenException` imported from `@nestjs/common`. Plain `{id: 'A'}` literals (NOT mock documents) used as inputs.
- **Work-unit commit message**: `test(rbac): add assertCanModifyOtherRoles self-modification guard tests`

#### 2.3 Write `packages/auth/src/rbac/__tests__/roles.guard.spec.ts`
- **Files**: NEW `packages/auth/src/rbac/__tests__/roles.guard.spec.ts`
- **Depends on**: 1.1, 2.1 (the hierarchy helper contract must be green for the guard to be tested in isolation)
- **Estimated lines**: ~100
- **What to do** (covers rbac-framework-tests spec `RolesGuard` requirement, 6 scenarios):
  - Use `Test.createTestingModule` with `Reflector` mock (`getAllAndOverride: jest.fn()`) + `overrideProvider(RBAC_HIERARCHY).useValue(...)` pattern.
  - Test 1: no `@Roles()` metadata → `canActivate` returns `true` regardless of `req.user` (baseline).
  - Test 2: with hierarchy, `@Roles('user')` admits `admin` (rank 3 >= rank 1) → `true` (R5.1).
  - Test 3: with hierarchy, `@Roles('admin')` rejects `user` (rank 1 < rank 3) → `false` (R5.2 / R1.1).
  - Test 4: WITHOUT hierarchy (backward compat), `@Roles('admin')` admits `user.roles: ['admin']` (string equality) → `true`; rejects `user.roles: ['user']` → `false`.
  - Test 5: with hierarchy, `req.user` is `undefined` → `false`.
  - Test 6: with hierarchy, `req.user.roles` is `undefined` → `false`.
  - Each test builds a minimal `ExecutionContext` stub with `switchToHttp().getRequest()` returning the `user` shape.
- **Acceptance**: All 6 tests pass. Uses `overrideProvider(RBAC_HIERARCHY).useValue({admin:3, manager:2, user:1})` for hierarchy-enabled tests, omits the override for backward-compat test.
- **Work-unit commit message**: `test(rbac): add hierarchy-aware RolesGuard tests`

#### 2.4 Verify Phase 2: `npm run test` shows ~15 new tests pass
- **Files**: none (verification)
- **Depends on**: 2.3
- **Estimated lines**: 0
- **What to do**: Run `npm run test`. Confirm 3 new spec files in `packages/auth/src/rbac/__tests__/` are discovered and all 15 new tests pass.
- **Acceptance**: All Phase 2 tests green; 0 regressions in the 1 currently-passing `usuarios.repository.spec.ts` (the 2 stale specs may still have assertion failures — those are fixed in Phase 3).
- **Work-unit commit message**: N/A (verification, no new commit)

## Phase 3: Domain unit tests (updates to existing + new)

#### 3.1 Update `usuarios.controller.spec.ts` (add `assignRoles` + controller-integration with `overrideGuard`)
- **Files**: MODIFIED `apps/nominas/src/modules/usuarios/__tests__/usuarios.controller.spec.ts`
- **Depends on**: 1.1 (jest config)
- **Estimated lines**: +40 to +60 lines
- **What to do**:
  - Add `assignRoles: jest.fn()` and `grantAdminByEmail: jest.fn()` to `mockService` cast.
  - Add `describe('assignRoles')` with 1 test: `controller.assignRoles('B', dto, req)` delegates to `service.assignRoles('B', dto.roles, req.user.id)` — proves spec R1.x and the controller-to-service contract.
  - Add `describe('controller-integration (guard chain)')` block using `Test.createTestingModule({ controllers: [UsuariosController], providers: [{provide: UsuariosService, useValue: mockService}] }).overrideGuard(JwtAuthGuard).useValue({canActivate: () => true}).overrideGuard(RolesGuard).useValue({canActivate: () => true})` — call `controller.findAll()` and assert `mockService.findAll` was invoked. Proves the guard chain wires correctly (R1.1, R1.2 path).
  - Verify all existing 5 CRUD tests still pass (regression safety).
- **Acceptance**: Existing 5 tests still pass + 2 new tests pass.
- **Work-unit commit message**: `test(usuarios): add assignRoles delegation + guard chain test in controller spec`

#### 3.2 Update `usuarios.service.spec.ts` (add `assignRoles` + `grantAdminByEmail` + default-roles scenarios)
- **Files**: MODIFIED `apps/nominas/src/modules/usuarios/__tests__/usuarios.service.spec.ts`
- **Depends on**: 1.1
- **Estimated lines**: +100 to +150 lines
- **What to do**:
  - Add 3 missing methods to `mockRepository` cast: `findRawByEmail`, `updateRoles`, `addRole` (all `jest.fn()`).
  - `describe('assignRoles')` (4 tests, covers `usuarios-tests` spec R2.1 + R2.2):
    - happy path: admin updates another user → returns `repository.updateRoles` result, no exception
    - self-mod throws `ForbiddenException` AND `repository.updateRoles` is NOT called
    - target not found: `repository.findOne` rejects with `NotFoundException` → propagates, `updateRoles` NOT called
    - correct args: `service.assignRoles('B', [Admin, Manager], 'A')` → `mockRepository.updateRoles` called once with `('B', ['admin', 'manager'])`
  - `describe('grantAdminByEmail')` (4 tests, covers spec R4.1-R4.3):
    - undefined email → `findRawByEmail` NOT called, no exception
    - user not found → no exception, `addRole` NOT called
    - user without admin → `addRole(id, 'admin')` called once
    - user already admin → `addRole` NOT called (idempotent)
  - `describe('create default role')` (3 tests, covers spec R3.1):
    - no `roles` field in DTO → `repository.create` called with `roles: ['user']`
    - empty array → `roles: ['user']`
    - explicit `roles: [Admin]` → pass-through
  - Verify all existing 7 tests still pass.
- **Acceptance**: All 11 new tests pass; existing 7 tests still pass.
- **Work-unit commit message**: `test(usuarios): add assignRoles + grantAdminByEmail + default-roles tests in service spec`

#### 3.3 Update `usuarios.repository.spec.ts` (add `updateRoles` + `addRole` + `findRawByEmail` + `toPublic` legacy)
- **Files**: MODIFIED `apps/nominas/src/modules/usuarios/__tests__/usuarios.repository.spec.ts`
- **Depends on**: 1.1
- **Estimated lines**: +60 to +100 lines
- **What to do**:
  - `mockModel` already has `findByIdAndUpdate`, `findByIdAndDelete`, `findOne` from the original skeleton — verify, no new mock methods needed.
  - `describe('updateRoles')` (2 tests, covers spec R2.1 partial):
    - happy: `mockModel.findByIdAndUpdate` called with `('id-1', { roles: ['manager'] }, { new: true })` and returns doc
    - not-found: `mockModel.findByIdAndUpdate` returns null → throws `NotFoundException`
  - `describe('addRole')` (2 tests, covers spec R4.2):
    - happy: `findByIdAndUpdate` called with `('id-1', { $addToSet: { roles: 'admin' } }, { new: true })` — proves idempotency intent
    - not-found: throws
  - `describe('findRawByEmail')` (2 tests, covers spec R4.1):
    - found: returns raw doc with `_id` (NOT toPublic-transformed — assert `result._id` is present)
    - not-found: returns `null`
  - `describe('toPublic legacy normalization')` (2 tests, covers spec R3.2):
    - raw doc with NO `roles` field → `repository.findOne('id')` returns object with `roles: ['user']` (via `mockModel.findById` returning a doc without roles → exercise `toPublic` through the public path)
    - raw doc with `roles: ['manager']` → `roles: ['manager']` (as-is)
  - Verify all existing 6 tests still pass.
- **Acceptance**: All 8 new tests pass; existing 6 tests still pass.
- **Work-unit commit message**: `test(usuarios): add updateRoles + addRole + findRawByEmail + toPublic tests in repository spec`

#### 3.4 Write `assign-roles.dto.spec.ts` (NEW)
- **Files**: NEW `apps/nominas/src/modules/usuarios/__tests__/assign-roles.dto.spec.ts`
- **Depends on**: 1.1
- **Estimated lines**: ~60
- **What to do** (covers `usuarios-tests` spec `AssignRolesDto Validation` requirement, 4 scenarios):
  - Use `plainToInstance(AssignRolesDto, plain)` from `class-transformer` + `validateOrReject(instance)` from `class-validator` to test in isolation (no NestJS container, no Mongoose).
  - Test 1: valid `roles: [UsuarioRole.Manager]` → resolves without rejection.
  - Test 2: empty array `roles: []` → rejects with `ArrayMinSize` constraint.
  - Test 3: unknown role `roles: ['superuser']` → rejects with `IsEnum` constraint.
  - Test 4: non-array body `{roles: 'admin'}` → rejects with `IsArray` constraint.
  - Assert the constraint name in the rejection shape (e.g., `.toMatchObject({constraints: ...})`) to prove the right validator fired.
- **Acceptance**: All 4 tests pass. DTO tested in isolation — no HTTP, no NestJS, no Mongoose.
- **Work-unit commit message**: `test(usuarios): add AssignRolesDto validation tests`

#### 3.5 Write `usuarios.module.spec.ts` (NEW, bootstrap hook + `RBAC_HIERARCHY` provider)
- **Files**: NEW `apps/nominas/src/modules/usuarios/__tests__/usuarios.module.spec.ts`
- **Depends on**: 1.1
- **Estimated lines**: ~100
- **What to do** (covers `usuarios-tests` spec `UsuariosModule Bootstrap` requirement, 4 scenarios):
  - Use `Test.createTestingModule({ imports: [UsuariosModule] })` with `.overrideProvider(UsuariosService).useValue({grantAdminByEmail: jest.fn()})` and `.overrideProvider(ConfigService).useValue({get: jest.fn()})` (also `overrideProvider(getModelToken(Usuario.name))` to satisfy Mongoose's model dependency).
  - Test 1: `ConfigService.get('ADMIN_EMAIL')` returns `undefined` → `module.onApplicationBootstrap()` resolves, `grantAdminByEmail` NOT called.
  - Test 2: `get` returns `'admin@example.com'` → `grantAdminByEmail('admin@example.com')` called exactly once.
  - Test 3: `grantAdminByEmail` resolves to `undefined` (no-op path) → bootstrap promise resolves without throwing.
  - Test 4: `module.get(RBAC_HIERARCHY)` returns the registered value with shape `{admin: 3, manager: 2, user: 1}` (proves the provider wiring).
  - (Optional test 5: `ConfigService.get` throws → bootstrap handles gracefully OR propagates — depends on production code, validate behavior.)
- **Acceptance**: All 4 (or 5) tests pass. Uses the real `OnApplicationBootstrap` interface by calling the method directly on the resolved module instance.
- **Work-unit commit message**: `test(usuarios): add onApplicationBootstrap admin seed tests in module spec`

#### 3.6 Verify Phase 3: `npm run test` shows all stale + new spec files pass
- **Files**: none (verification)
- **Depends on**: 3.5
- **Estimated lines**: 0
- **What to do**: Run `npm run test`. Confirm 6 new + 3 updated spec files all pass. Verify the previously-failing-to-load 2 stale specs now have all their tests green.
- **Acceptance**: All Phase 3 tests green; `npm run test` reports `Test Suites: N passed, 0 failed` where N = 5 (usuarios) + 3 (rbac framework) + 2 (dormant inngest, if they pass — if they fail, that's a separate pre-existing bug).
- **Work-unit commit message**: N/A (verification, no new commit)

## Phase 4: E2E test (the only test for the 400 from global `ValidationPipe`)

#### 4.1 Write `apps/nominas/test/usuarios.e2e-spec.ts`
- **Files**: NEW `apps/nominas/test/usuarios.e2e-spec.ts`
- **Depends on**: 1.1, 3.5 (controller + module must compile + the test app must wire)
- **Estimated lines**: ~120
- **What to do** (covers `usuarios-tests` spec `Usuarios E2E Validation Test` requirement, 1 scenario — 1 mandatory + 1 optional):
  - Use `Test.createTestingModule({ imports: [UsuariosModule] })` with overrides:
    - `.overrideProvider(getModelToken(Usuario.name)).useValue(mockModel)` — same `mockModel` shape from the unit tests
    - `.overrideProvider(UsuariosRepository).useValue(mockRepository)` — controls service calls
    - `.overrideGuard(JwtAuthGuard).useValue({canActivate: () => true})`
    - `.overrideGuard(RolesGuard).useValue({canActivate: () => true})`
  - After `app = moduleRef.createNestApplication()`: `app.setGlobalPrefix('api')` (matches `main.ts` line 14) and `app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}))` (matches `main.ts` lines 18-24).
  - `await app.init()` and bind to a random port (e.g., `await app.listen(0)`).
  - Test 1 (mandatory): `await request(app.getHttpServer()).patch('/api/usuarios/abc/roles').send({roles: ['superuser']})` → expect `res.status === 400` and `res.body.message` matches `/roles/`.
  - Test 2 (optional, 200 happy path): same endpoint with `{roles: ['admin']}` and `mockRepository.findOne` returning a valid user → expect `res.status === 200`. (Skip if mocking the full service chain is too involved — the 1 mandatory test satisfies spec scenario R2.3.)
  - Tear down: `afterAll(async () => { await app.close(); })`.
- **Acceptance**: 1 (or 2) E2E tests pass via `npm run test:e2e`.
- **Work-unit commit message**: `test(usuarios): add E2E test for 400 from global ValidationPipe`

#### 4.2 Final verification: `npm run test && npm run test:e2e` all green
- **Files**: none (verification)
- **Depends on**: 4.1
- **Estimated lines**: 0
- **What to do**: Run both test commands. Confirm 0 failures across all suites. Confirm total new test count is ~30-34 (matching the proposal's 19 spec scenarios → 30+ test cases forecast).
- **Acceptance**: Both commands return exit code 0. No `Cannot find module '@common/*'` errors anywhere. No `TypeError`s from missing mock methods.
- **Work-unit commit message**: N/A (verification, no new commit)

## Cumulative line count
~733 changed lines total
- Phase 1: +8 (jest config, additive)
- Phase 2: ~190 (3 new framework specs, 50 + 40 + 100)
- Phase 3: ~415 (3 updates + 2 new: 50 + 125 + 80 + 60 + 100)
- Phase 4: ~120 (1 new E2E)

## Cumulative work-unit commit count
**10 work-unit commits** (1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1) **+ 3 verifications** (2.4, 3.6, 4.2 — no commits).

## PR recommendation
**Single branch, no PR** — per user decision (working solo). All work on `test/usuarios-add-rbac-tests`. No push, no PR creation. **~733 LOC is over the 400-line review budget**, but the user accepted single-branch for solo work. The activate-side-effect on the 2 dormant `packages/inngest/*.spec.ts` files is intentional and documented (any failure there is a separate pre-existing bug).

## Pre-flight verifications (resolved 2026-07-03 from prior phases)

All 3 top risks from the explore phase have been resolved before this task plan:

1. **Jest config is THE blocker** ✅ Resolved by Task 1.1. The `moduleNameMapper` + `roots` + `moduleDirectories` change is **strictly additive** (adds fields, doesn't remove). The 1 currently-passing `usuarios.repository.spec.ts` continues to pass. Verified by reading `package.json` lines 85-104 and `tsconfig.json` lines 24-33 (paths match the regex pattern).
2. **3 stale spec files: update in place, not rewrite** ✅ Confirmed by reading the 3 spec files. Each has correct `Test.createTestingModule` scaffolding + `as any` casts in the mocks. Only the **mock surface** needs extending (3 new repo methods, 2 new service methods). The new code is **additive** (no method signatures change).
3. **Mongoose model mocks work** ✅ The existing `usuarios.repository.spec.ts` already has `findByIdAndUpdate` and `findByIdAndDelete` in `mockModel` (lines 31-32). No new mock methods needed for Phase 3.3 — only new test cases that exercise them.

Additional pre-flight checks (resolved in design phase):

- **`req.user.id` shape matches `HasId` constraint** — `packages/auth/src/strategies/jwt.strategy.ts` lines 44-54 guarantee `id: string` on the returned `AuthenticatedUser`. The `assertCanModifyOtherRoles` helper accepts this shape without modification.
- **`ConfigModule` is global** — `apps/nominas/src/app.module.ts` declares `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`. `ConfigService.get('ADMIN_EMAIL')` works in the bootstrap hook.
- **Global `ValidationPipe` is wired** — `apps/nominas/src/main.ts` lines 18-24 set `whitelist: true, forbidNonWhitelisted: true, transform: true`. The E2E test must mirror these constructor args exactly (Task 4.1).
- **`ValidationPipe` instance vs `app.useGlobalPipes(ValidationPipe)`** — Both are documented in NestJS 11. Using `new ValidationPipe(...)` is the recommended pattern for E2E.

## Important constraints (for `sdd-apply` executor)

- **Strict TDD applies** (`openspec/config.yaml` — referenced by user, not on disk). For each new spec file, RED first (the test fails because the file doesn't exist OR the implementation has a gap), then GREEN. For pure test additions to existing files, the order is: (1) write the test, (2) run it and see it fails for the right reason, (3) implement if needed (most tests here are pure test code, no production code changes).
- **Production code is NOT modified** — this change is tests-only + jest config. Any production-code change discovered during apply is a defect in the design and MUST halt the apply phase, not be silently fixed.
- **Work-unit commit messages above are exact** — use them verbatim, do not paraphrase.
- **Test code in `apps/nominas/test/usuarios.e2e-spec.ts` must mirror `main.ts` lines 18-24** for the `ValidationPipe` constructor args (whitelist, forbidNonWhitelisted, transform).
- **No new dependencies** — use existing `jest`, `ts-jest`, `@nestjs/testing`, `supertest`, `class-validator`, `class-transformer`. Do NOT add `mongodb-memory-server` or `expect-type`.
- **Activation side effect on `packages/inngest/*.spec.ts`** — these dormant tests (294 + 203 LOC) will now be discovered by jest. If they fail, that's a pre-existing bug; document it in the verify phase but do NOT fix it here.

## Branch lineage
- Branch: `test/usuarios-add-rbac-tests` (already created from `feat/usuarios-rbac`, NOT from `main` — see engram #117).
- The implementation being tested lives on `feat/usuarios-rbac` (archived, 16 commits, 814 LOC of production code).
- The test changes will be added on top of `test/usuarios-add-rbac-tests` and committed locally without push.
