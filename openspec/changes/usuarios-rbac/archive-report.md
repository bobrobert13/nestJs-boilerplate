# Archive Report: RBAC for Usuarios Module

**Change**: `usuarios-rbac`
**Date**: 2026-07-02
**Branch**: `feat/usuarios-rbac`
**Status**: ARCHIVED

## Summary

Delivered a working medium-complexity RBAC system in a single 16-commit PR: consolidated two generic RBAC primitives (`hasAtLeastRole`, `assertCanModifyOtherRoles`) into `packages/auth/src/rbac/`, then applied them to the `usuarios` module — adding `roles: string[]` to the schema, a `PATCH /usuarios/:id/roles` admin endpoint with self-modification guard, per-endpoint `@Roles()` enforcement, and idempotent first-admin bootstrap from `ADMIN_EMAIL`. Two hygiene fixes were applied as separate work-units before archive: (1) **passkeys v9→v10 API migration** in `packages/auth/src/passkeys/passkeys.service.ts` (TS2339 errors exposed by the design's `@common/auth` path mapping), and (2) **global `ValidationPipe`** wired in `apps/nominas/src/main.ts` to make the `AssignRolesDto` validators actually run at runtime, satisfying the spec's "Invalid role is rejected → 400" scenario.

## Final state

- Total commits: 16
- Files changed: 21
- Lines added: 814
- Lines removed: 72
- Build: PASS (`npm run build` green, 4.8s)
- Spec coverage: 19/19 (after ValidationPipe fix)
- Working tree before archive: clean except `openspec/` (untracked — this archive step adds the canonical specs and this report)

## Commits (work-unit order)

| # | Hash | Message |
|---|------|---------|
| 1 | `3dd8469` | feat(rbac): add hasAtLeastRole generic hierarchy utility |
| 2 | `e1a1a79` | feat(rbac): add assertCanModifyOtherRoles self-modification guard |
| 3 | `9727b66` | refactor(rbac): move RolesGuard to rbac/ with optional hierarchy support |
| 4 | `880510d` | refactor(rbac): move Roles decorator to rbac/ |
| 5 | `c95eb8e` | feat(rbac): consolidate RBAC exports through rbac/ |
| 6 | `0fd42d3` | feat(usuarios): add UsuarioRole enum and role hierarchy |
| 7 | `05e98db` | feat(usuarios): add AssignRolesDto with role validation |
| 8 | `fbe68c4` | feat(usuarios): add roles field to Usuario schema |
| 9 | `ead18a0` | feat(usuarios): add updateRoles + legacy doc normalization |
| 10 | `9eb8456` | feat(usuarios): add assignRoles + grantAdminByEmail service methods |
| 11 | `652bbc5` | feat(usuarios): apply RBAC to controller + add role management endpoint |
| 12 | `45a7717` | feat(usuarios): add admin bootstrap from ADMIN_EMAIL env var |
| 13 | `ab1d1f2` | docs(agents): document usuarios RBAC pattern in §8 |
| 14 | `22a5dcb` | fix(usuarios-rbac): add @common/auth path + CreateUsuarioDto.roles + import-type guard |
| 15 | `b2fcfb0` | fix(passkeys): migrate to @simplewebauthn/server v10 API |
| 16 | `ca8d42e` | fix(main): add global ValidationPipe to enforce DTO validation |

## Specs synced to canonical location

- `openspec/specs/usuarios/spec.md` (NEW — from delta, `## ADDED Requirements` heading stripped to `## Requirements`)
- `openspec/specs/auth/spec.md` (NEW — from delta, `## ADDED Requirements` heading stripped to `## Requirements`, "Delta for auth" title and "Scope" blockquote canonicalized to "Capability: auth" + "## Purpose")

Both delta specs were **ADDED-only** (no MODIFIED or REMOVED requirements), so the merge was non-destructive — no `openspec/config.yaml` "Warn before merging destructive deltas" trigger.

## Follow-up work (documented for next change)

1. **Wire `AuthService` to read `roles` from `usuarios`** — closes the auth/identity gap. A role change in `usuarios` does NOT reflect in the user's JWT until the next login. This change introduced the data, the follow-up change wires the consumer.
2. **Update `usuarios/__tests__/` (3 spec files)** — `controller.spec.ts`, `service.spec.ts`, `repository.spec.ts` reference the pre-RBAC signatures and will fail CI. Per user override during this change, tests are deferred. The mocks need `assignRoles`, `grantAdminByEmail`, `findRawByEmail`, `updateRoles`, and `addRole` added.
3. **Global `APP_GUARD` in `main.ts`** — controllers would opt out via `@Public()` instead of opting in via `@UseGuards`. Cleaner once we have many protected controllers, but orthogonal to this change.
4. **Extract `RoleManagementService` abstract class in `packages/auth/`** — premature for 1 consumer (`usuarios`). When a 2nd module needs role management, introduce the abstract class so both implement the same contract.
5. **Attribute-based access control (CASL, AccessControl, OpenFGA)** — for finer-grained policies ("manager can edit users in their department"). Out of scope for medium RBAC.
6. **Rate limiting auth endpoints** — already specced in auth spec; not implemented yet; not part of this change.

## Known limitations (carried forward)

1. **3 spec files in `usuarios/__tests__/` will fail CI** — per user override, tests deferred to a follow-up change (item #2 above).
2. **`npm run lint` is pre-existing broken on `main`** — eslint glob pattern matches zero files. Not a regression. Unrelated to this change.
3. **Auth/Usuarios are decoupled** — JWT only refreshes roles on next login. Documented in `proposal.md` §Risks #2 and as a JSDoc note in `UsuariosService.assignRoles()`. Item #1 in Follow-up work addresses this.

## Lessons learned

- **Pre-flight verification of top risks paid off.** Resolving risks 2 (`req.user.id` shape) and 3 (`ConfigModule` global) before `sdd-apply` saved 2 mid-implementation blockers and produced cleaner task numbers. Recommend making this a default step in future `sdd-tasks`.
- **Domain knowledge of the runtime wiring was a blind spot in design.** The `assign-roles.dto.ts` validators were correctly written but the `ValidationPipe` wiring was not. The verify phase caught it (scenario "Invalid role is rejected" → 400), and the fix was a single 9-line commit. Recommendation: future `sdd-design` phases for any DTO-touching change MUST explicitly trace the validation wiring (global pipe vs `@UsePipes` vs controller-local).
- **Adding `@common/auth` to `tsconfig.json` paths exposed pre-existing passkeys bugs.** The design assumed the path was already mapped; it was not. The `git mv` of `roles.guard.ts` into `rbac/` worked only because the path mapping was added — and that mapping pulled in 11 latent TS errors from `passkeys.service.ts`. The fix was straightforward but the discovery was serendipitous. Recommendation: `sdd-design` for any `packages/*` change should run a quick `tsc --noEmit` baseline check BEFORE the design phase, not just the verify phase.
- **Spec delta vs canonical format needs explicit transformation rules.** The auth delta started as "# Delta for auth" with a `> **Scope**:` blockquote — both are delta-context artifacts that do not belong in the canonical spec. The orchestrator instructions handled this correctly (`"if it does NOT exist: same as above for the usuarios case"`), but the convention could be formalized: `sdd-archive` should provide a "delta-to-canonical" transformation step. Filed mentally for a future SKILL improvement.

## Archive artifacts

- This file: `openspec/changes/usuarios-rbac/archive-report.md`
- Engram observation: `sdd/usuarios-rbac/archive-report` (id assigned on save)
- Synced spec (new): `openspec/specs/usuarios/spec.md`
- Synced spec (new): `openspec/specs/auth/spec.md`
- Change directory preserved (NOT moved to archive): `openspec/changes/usuarios-rbac/` — per user instruction, the change folder stays in place as the SDD record. The git history on `feat/usuarios-rbac` IS the audit trail.

### Engram traceability (sibling observations from this change)

| Phase | Topic key | Engram id | Type |
|-------|-----------|-----------|------|
| Trigger | `sdd/usuarios-rbac` (start) | #102 | decision |
| Explore | `sdd/usuarios-rbac/explore` | #103 | architecture |
| Design decisions | `sdd/usuarios-rbac/design-decisions` | #104 | decision |
| Proposal | `sdd/usuarios-rbac/proposal` | #105 | architecture |
| Spec | `sdd/usuarios-rbac/spec` | #106 | architecture |
| Design | `sdd/usuarios-rbac/design` | #107 | architecture |
| Tasks | `sdd/usuarios-rbac/tasks` | #108 | architecture |
| Pre-flight | `sdd/usuarios-rbac/preflight-risks-resolved` | #109 | discovery |
| Apply | `sdd/usuarios-rbac/apply-progress` | #110 | architecture |
| Blocker | `sdd/usuarios-rbac/blocker-passkeys` | #111 | bugfix |
| Verify | `sdd/usuarios-rbac/verify-report` | #112 | architecture |
| **Archive** | `sdd/usuarios-rbac/archive-report` | _this save_ | architecture |
