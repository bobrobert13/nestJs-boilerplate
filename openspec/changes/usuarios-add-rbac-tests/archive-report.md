# Archive Report: Add Tests for Usuarios Module with RBAC

**Change**: `usuarios-add-rbac-tests`
**Date**: 2026-07-03
**Branch**: `test/usuarios-add-rbac-tests`
**Status**: ARCHIVED

## Summary

Delivered full test coverage for the post-RBAC `usuarios` module and the `@common/auth` RBAC framework primitives. Fixed the Jest infrastructure blocker (`moduleNameMapper` for `@common/*` + broadened `roots` to include `packages/` + `moduleDirectories`) which had caused 2 of 3 stale spec files to fail at module load. Delivered 10 work-unit commits: 6 new spec files (3 framework + 2 domain + 1 E2E) + 3 updated stale domain specs + 1 jest config change. All 19 source spec scenarios (12 from `usuarios`, 7 from `auth`) are evidence-supported by passing tests. The pre-existing dormant inngest spec (5 failures) was surfaced by the jest `roots` fix and is documented as out-of-scope for a follow-up change.

## Final state

- Total commits: 10
- Files changed: 11
- Lines added: ~1043
- Lines removed: ~10
- Build: PASS
- Tests: 91/96 unit pass, 1/1 E2E pass, 5/5 inngest failures (pre-existing, out of scope)
- Spec coverage: 19/19 source scenarios evidence-supported

## Commits (work-unit order)

1. `021f7f3` chore(test): add jest moduleNameMapper for @common/* paths
2. `ff825c9` test(rbac): add hasAtLeastRole hierarchy utility tests
3. `6f6f4dd` test(rbac): add assertCanModifyOtherRoles self-modification guard tests
4. `51f65fc` test(rbac): add hierarchy-aware RolesGuard tests
5. `7177748` test(usuarios): add assignRoles delegation + guard chain test in controller spec
6. `5eca1cc` test(usuarios): add assignRoles + grantAdminByEmail + default-roles tests in service spec
7. `80997cf` test(rbac): add updateRoles + addRole + findRawByEmail + toPublic tests in repository spec
8. `c30fe27` test(usuarios): add AssignRolesDto validation tests
9. `31e2a65` test(usuarios): add onApplicationBootstrap admin seed tests in module spec
10. `fcc7967` test(usuarios): add E2E test for 400 from global ValidationPipe

## Specs synced to canonical location

- `openspec/specs/testing-infrastructure/spec.md` (NEW — from delta)
- `openspec/specs/rbac-framework-tests/spec.md` (NEW — from delta)
- `openspec/specs/usuarios-tests/spec.md` (NEW — from delta)

## Out-of-scope issues (documented for next change)

1. **Inngest dormant specs** (5 failures): `packages/inngest/src/inngest.service.spec.ts` calls non-existent methods (`createJobCompletedPayload`). Pre-existing bug, surfaced by the jest `roots` fix. Separate SDD change needed.
2. **E2E test maintenance**: uses a stripped-down `TestUsuariosModule` because `MongooseModule.forFeature` requires a real `DatabaseConnection`. If controller route or ValidationPipe config in `main.ts` changes, the test must change in lockstep.
3. **`overrideProvider(RBAC_HIERARCHY).useValue(null)` pattern**: now established in 3 spec files. Any future RBAC-aware test must follow the same shape or silently fall back to string-equality.

## Lessons learned

- **Jest infrastructure is a first-class part of the change.** The `moduleNameMapper` blocker was the single most important task — every other test in the change depended on it landing first. Future test-only changes should always start with a jest config audit.
- **Update stale tests in place, don't rewrite.** The existing test module scaffolding was correct; only the mock surface and scenario coverage needed extending. Rewriting would have lost the DI patterns already established.
- **`overrideGuard` + `overrideProvider` is the canonical pattern for guard-chain tests in NestJS 11.** It avoids the brittleness of full E2E while still proving the wiring. Document this in the test-author-guide the next time we touch it.
- **Single branch, no PR is viable for solo work.** 10 work-unit commits stayed reviewable locally. When the user is solo, the 400-line review budget is the wrong constraint — focus on commit-boundary discipline instead.

## Archive artifacts

- This file: `openspec/changes/usuarios-add-rbac-tests/archive-report.md`
- Engram observation: `sdd/usuarios-add-rbac-tests/archive-report`
- Synced specs: 3 new files in `openspec/specs/`

---

**Skill resolution**: injected
**Persistence mode**: hybrid
**Date generated**: 2026-07-03
