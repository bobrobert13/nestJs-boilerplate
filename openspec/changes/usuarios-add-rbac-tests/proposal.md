# Proposal: Add Tests for Usuarios Module with RBAC

## Intent

This is the **test follow-up** to the just-archived `usuarios-rbac` change. The 16-commit implementation is in place (`packages/auth/src/rbac/` + `apps/nominas/src/modules/usuarios/`), but **all 3 spec files in `usuarios/__tests__/` are stale and 2 of them fail to even load** because Jest cannot resolve `@common/auth`. This change fixes the Jest infrastructure, updates the 3 stale spec files, and adds coverage for the new RBAC framework + domain code.

## Why

- **Current state:** `npm run test` → `Test Suites: 2 failed, 1 passed, 3 total` — 2 of 3 stale spec files don't even load. `packages/auth/src/rbac/` has **zero tests**. `apps/nominas/test/` has **no E2E tests**. 2 dormant `packages/inngest/src/*.spec.ts` files exist but never run.
- **Risk:** shipping RBAC (auth + role-management) without test coverage means regressions in security code are **silent**. `toPublic()` legacy normalization, `assertCanModifyOtherRoles`, the hierarchy check, and the `ADMIN_EMAIL` bootstrap are all critical paths with no safety net.
- **Cost:** ~600-800 LOC of test code, ~30-34 test cases. Not a small change but bounded and well-scoped. Single branch, no PR ceremony (user working solo).

## Goals

1. The system MUST fix the Jest config so all spec files load correctly (`moduleNameMapper` for `@common/*`, `roots` broadened to include `packages/`, `moduleDirectories`).
2. The system MUST update the 3 stale spec files in `apps/nominas/src/modules/usuarios/__tests__/` to match the post-RBAC signatures.
3. The system MUST add unit tests for the 4 new files in `packages/auth/src/rbac/`.
4. The system MUST add unit tests for the new service methods (`assignRoles`, `grantAdminByEmail`).
5. The system MUST add unit tests for the new repository methods (`updateRoles`, `addRole`, `findRawByEmail`, `toPublic` legacy normalization).
6. The system MUST add unit tests for the new DTO (`AssignRolesDto`).
7. The system MUST add unit tests for the `onApplicationBootstrap` hook in `UsuariosModule`.
8. The system MUST add at least 1 E2E test that proves the 400 from the global `ValidationPipe` (usuarios spec R2.3).
9. The system MUST have all **19 spec scenarios** (12 from `usuarios`, 7 from `auth`) evidence-supported by at least one test, where applicable.
10. `npm run test` MUST pass with 0 failures.
11. `npm run test:e2e` MUST pass with 0 failures.

## Non-goals

- Adding `mongodb-memory-server` — mocking at the Mongoose model level is the established pattern.
- Adding CI workflows at `.github/workflows/` — out of scope; user verifies locally.
- Achieving coverage >X% — quality over quantity, no threshold.
- Performance testing.
- E2E for every endpoint — only the critical 400 from `ValidationPipe`.
- Removing dead `interfaces/usuario.interface.ts` — separate cleanup.
- Refactoring the existing `__tests__/` files to a different pattern (e.g., test factories).
- Chained PR strategy — user is solo, single branch is the delivery strategy.

## Approach (high level)

**Step 1 — Fix Jest infrastructure (the blocker).** Add `moduleNameMapper` to map `@common/*` to `packages/*/src/index.ts`. Add `<rootDir>/packages/` to `roots` so the framework specs are picked up. Add `moduleDirectories` for `nodenext` resolution. This unblocks 2 of 3 stale spec files immediately.

**Step 2 — Framework unit tests first** (pure functions, no NestJS, fastest to write). `role-hierarchy.spec.ts`, `cannot-self-modify.spec.ts`, `roles.guard.spec.ts` — covers auth R1.* and R2.* plus usuarios R5.*.

**Step 3 — Update the 3 stale domain spec files in place.** Add missing methods to mocks (`findByIdAndUpdate`, `findByIdAndDelete`, `findRawByEmail`, `updateRoles`, `addRole`, `assignRoles`, `grantAdminByEmail`). Add the new scenarios. Use `overrideGuard` to prove controller-integration scenarios for guard chains.

**Step 4 — Add tests for the new domain code** — `assign-roles.dto.spec.ts` (DTO validation) + `usuarios.module.spec.ts` (bootstrap hook).

**Step 5 — Add 1 E2E test** for the 400 response from global `ValidationPipe` (R2.3) using supertest against `Test.createTestingModule(...).compile()`.

**Step 6 — Final verification.** `npm run test` + `npm run test:e2e` both green. All 19 spec scenarios mapped to ≥1 test.

## Scope

### In Scope

**Jest config fix (the critical blocker)**:
- `package.json`: ADD `moduleNameMapper` for `@common/*` → `packages/$1/src/index.ts`
- `package.json`: ADD `<rootDir>/packages/` to `roots`
- `package.json`: ADD `moduleDirectories: ["node_modules", "<rootDir>"]`

**New test files (6)**:
- `packages/auth/src/rbac/__tests__/role-hierarchy.spec.ts` (5 tests)
- `packages/auth/src/rbac/__tests__/cannot-self-modify.spec.ts` (3 tests)
- `packages/auth/src/rbac/__tests__/roles.guard.spec.ts` (6 tests)
- `apps/nominas/src/modules/usuarios/__tests__/assign-roles.dto.spec.ts` (4 tests)
- `apps/nominas/src/modules/usuarios/__tests__/usuarios.module.spec.ts` (4 tests)
- `apps/nominas/test/usuarios.e2e-spec.ts` (1-2 E2E)

**Updated spec files (3)**:
- `apps/nominas/src/modules/usuarios/__tests__/usuarios.controller.spec.ts`
- `apps/nominas/src/modules/usuarios/__tests__/usuarios.service.spec.ts`
- `apps/nominas/src/modules/usuarios/__tests__/usuarios.repository.spec.ts`

### Out of Scope

- `mongodb-memory-server` — mocking at model level is the established pattern.
- New CI workflow — out of scope.
- E2E for every endpoint — only the critical 400.
- Performance testing.
- Coverage threshold enforcement.
- Deleting dead `interfaces/usuario.interface.ts` — separate cleanup.
- Refactoring existing spec file style — keep updates additive.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | ADD jest `moduleNameMapper` for `@common/*` + `roots` fix + `moduleDirectories` |
| `packages/auth/src/rbac/__tests__/role-hierarchy.spec.ts` | New | 5 unit tests for `hasAtLeastRole` |
| `packages/auth/src/rbac/__tests__/cannot-self-modify.spec.ts` | New | 3 unit tests for `assertCanModifyOtherRoles` |
| `packages/auth/src/rbac/__tests__/roles.guard.spec.ts` | New | 6 unit tests for hierarchy-aware `RolesGuard` |
| `apps/nominas/src/modules/usuarios/__tests__/assign-roles.dto.spec.ts` | New | 4 unit tests for `AssignRolesDto` |
| `apps/nominas/src/modules/usuarios/__tests__/usuarios.module.spec.ts` | New | 4 unit tests for `onApplicationBootstrap` |
| `apps/nominas/src/modules/usuarios/__tests__/usuarios.controller.spec.ts` | Updated | Add `assignRoles` + controller-integration test for guard chain |
| `apps/nominas/src/modules/usuarios/__tests__/usuarios.service.spec.ts` | Updated | Add 3 missing methods to mock + new scenarios for `assignRoles` + `grantAdminByEmail` |
| `apps/nominas/src/modules/usuarios/__tests__/usuarios.repository.spec.ts` | Updated | Add 4 missing model methods + `toPublic` legacy doc tests |
| `apps/nominas/test/usuarios.e2e-spec.ts` | New | 1-2 E2E tests for the 400 from `ValidationPipe` |

## Decisions taken (with rationale)

1. **Single branch, no PR** — User is working solo. No push, no PR ceremony. All test work on `test/usuarios-add-rbac-tests` (already created from `feat/usuarios-rbac` — see engram #117 on branch lineage). Conventional commits per task.
2. **Update 3 stale spec files in place** — Not rewrite. The existing test module setup (`Test.createTestingModule` with mock providers) is correct scaffolding. The verify report overstated the damage: the new methods are **additions**, not replacements, and the mocks use `as any` casts so signatures don't need updates.
3. **Hybrid: unit + E2E** — Controller-integration with `overrideGuard` mock for guard-chain scenarios (usuarios R1.1, R1.2). 1 E2E test for the 400 from global `ValidationPipe` (R2.3). Avoids the complexity of a test DB while still covering the 400 path that lives outside the unit test boundary.
4. **No `mongodb-memory-server`** — Mock at the Mongoose model level (`mockModel` with `find`/`findByIdAndUpdate`/`exec` shape). The existing `usuarios.repository.spec.ts` uses this pattern and passes 6 tests. Adding the dep is overkill for ~30 unit tests.
5. **No explicit type-level test** for "helper is independent of Mongoose" (auth R2.3) — Proved **implicitly** by using plain `{id: 'A'}` objects in the R2.1/R2.2 tests. The `HasId` constraint is enforced at the call site, not by a type-level test. No new dep (`expect-type`).

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|------------|------------|
| 1 | **Scope > 600 LOC** — single branch, no chained PR | High | Acknowledged; user accepted single-branch strategy. 400-line budget guard overridden by user solo + low review cost. |
| 2 | **Jest config change could break other tests** (e.g., the 1 currently-passing `usuarios.repository.spec.ts`) | Low | Run `npm run test` after every jest config edit; revert if regression. The change is additive (adds fields, doesn't remove). |
| 3 | **E2E test requires a test DB or full mock** — may add complexity | Medium | Use `Test.createTestingModule` with `overrideProvider(getModelToken(...))` — same pattern as the unit tests. No real MongoDB needed. |
| 4 | **`overrideGuard` pattern is fragile** — NestJS Testing API changes between minor versions | Low | Use the documented pattern from NestJS 11 docs. Fallback to plain unit tests on the guard itself if the controller-integration test fails. |
| 5 | **No CI to enforce** — user must run `npm run test` manually | High | Document this clearly in the verify-report. User will verify locally before merge. |

## Rollback Plan

1. **Code-level:** `git revert` the merge commit. The Jest config change is **additive** (adds fields, doesn't remove). The 6 new spec files are net-new (just delete). The 3 updated spec files can be reverted to their previous state — none of the new tests touch production code.
2. **No database changes** — tests don't touch MongoDB.
3. **No production impact** — the change only adds tests, doesn't change runtime behavior. Production code (the implementation being tested) is unchanged.
4. **No env var changes** — tests don't introduce new env vars.

## Out of scope (future work)

- **Add CI workflow** at `.github/workflows/` to enforce tests on PR.
- **Add `mongodb-memory-server`** for integration tests with a real DB.
- **Add coverage threshold** to Jest config (e.g., 80% lines).
- **Add E2E for every endpoint** — only the critical 400 today.
- **Refactor stale spec files** to a different pattern (e.g., test factories, builder pattern).
- **Remove dead `interfaces/usuario.interface.ts`** — flagged in the previous verify report.
- **Wire `AuthService` to read roles from `usuarios`** — closes the JWT/identity gap (already noted as a follow-up in `usuarios-rbac/proposal.md` Risk #2).

## Dependencies

- `sdd/usuarios-add-rbac-tests/explore` (engram #115) — completed.
- `sdd/usuarios-add-rbac-tests/design-decisions` (engram #116) — 5 decisions accepted by user.
- `sdd/usuarios-add-rbac-tests/correction-branch-lineage` (engram #117) — branch `test/usuarios-add-rbac-tests` is based on `feat/usuarios-rbac`, not `main`.
- `sdd/usuarios-rbac/*` (engram #103-113) — the implementation being tested.
- `openspec/specs/usuarios/spec.md` — 5 requirements, 12 scenarios.
- `openspec/specs/auth/spec.md` — 2 requirements, 7 scenarios.
- `openspec/config.yaml` — `strict_tdd: true`, `apply.tdd: true`, `apply.test_command: "npm run test"`.

## Success Criteria

- [ ] `package.json` has `moduleNameMapper` for `@common/*` and updated `roots` including `<rootDir>/packages/`.
- [ ] 2 of 3 stale spec files now LOAD (not "fail to load") after the Jest config fix.
- [ ] 3 new `packages/auth/src/rbac/__tests__/` spec files added (role-hierarchy, cannot-self-modify, roles.guard).
- [ ] 3 stale `usuarios/__tests__/` spec files updated in place (controller, service, repository).
- [ ] 2 new domain spec files added (`assign-roles.dto.spec.ts`, `usuarios.module.spec.ts`).
- [ ] 1 new E2E test file added (`apps/nominas/test/usuarios.e2e-spec.ts`).
- [ ] `npm run test` passes with 0 failures.
- [ ] `npm run test:e2e` passes with 0 failures.
- [ ] All 19 spec scenarios (12 usuarios + 7 auth) are evidence-supported by at least one test, where applicable.
- [ ] Strict TDD respected: each new spec file is RED first, then implementation (if any) makes it GREEN.
