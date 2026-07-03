# Proposal: RBAC for Usuarios Module

## Intent

The `usuarios` module currently has 5 endpoints that are completely unprotected — no auth, no role checks. Meanwhile, `RolesGuard` and `@Roles()` already exist in `@common/auth` and work correctly. This change **applies** those existing primitives to the `usuarios` module and adds a `roles` field + a role-management endpoint, producing a working medium-complexity RBAC system in one PR.

## Why

- **Risk:** production-ready data exposed with zero auth (PII, account enumeration, mass delete).
- **Cost of doing nothing:** every new module in `apps/nominas` will copy the unprotected pattern unless we model it once.
- **Cost of doing this now:** ~200-250 lines (framework + domain); auth primitives already exist; auth spec (`openspec/specs/auth/spec.md` §Role-Based Access) already requires this — we are catching the auth spec up to a concrete module.

## Goals

1. The system MUST restrict all 5 existing `usuarios` endpoints to authenticated users with appropriate roles.
2. The system MUST expose a 6th endpoint `PATCH /usuarios/:id/roles` that lets an `admin` assign roles to any user.
3. The system MUST reject role self-assignment — a user SHALL NOT be able to change their own roles, even if they are `admin` (defense-in-depth, prevents lockout via typo).
4. The system MUST support a role hierarchy where `admin` inherits `manager` and `manager` inherits `user` — implemented in `packages/auth/src/rbac/role-hierarchy.ts` via a generic `hasAtLeastRole(userRoles, requiredRole, hierarchy)` function.
5. The system MUST bootstrap the first admin on deploy via the `ADMIN_EMAIL` env var (without this, first deploy locks everyone out).
6. The system SHOULD keep `POST /usuarios` public as a self-service registration endpoint (role `user` assigned by default).

## Non-goals

- ABAC / dynamic policy engine (CASL, AccessControl) — out of scope, plain `@Roles()` is sufficient.
- Role hierarchy beyond 3 levels — the 3-role map is hardcoded; new roles require a code change.
- Refactoring `AuthService` to read roles from the `usuarios` collection (auth and usuarios remain decoupled — see Risks).
- Test updates (per user override, tests are out of scope for this change).

## Approach (high level)

**Step 1 — Consolidate RBAC in `packages/auth/src/rbac/`.** The empty `rbac/` directory is dead code from a prior refactor. Move the working `roles.guard.ts` (from `guards/`) and `roles.decorator.ts` (from `decorators/`) into `rbac/`, and add two new generic utilities there: `role-hierarchy.ts` (hierarchy lookup so `@Roles('user')` admits `admin` and `manager` automatically) and `cannot-self-modify.ts` (a guard helper that rejects self-modification with a `ForbiddenException`). This is the framework layer — no knowledge of Mongoose, no knowledge of `usuarios`.

**Step 2 — Apply RBAC to the `usuarios` domain.** Add a `UsuarioRole` enum (`Admin | Manager | User`) and a `roles: string[]` field (default `['user']`) to the `Usuario` schema. Add `AssignRolesDto` and a `UsuariosService.assignRoles()` method that uses `cannotSelfModify` from `rbac/` to reject self-escalation. Apply `@UseGuards(JwtAuthGuard, RolesGuard)` + per-endpoint `@Roles()` to the 5 existing endpoints in `UsuariosController` plus a new `PATCH /usuarios/:id/roles` (admin-only). Seed the first admin from `process.env.ADMIN_EMAIL` via `onApplicationBootstrap` in `UsuariosModule`.

## Scope

### In Scope

**RBAC consolidation (framework layer, `packages/auth/src/rbac/`):**
- Move `roles.guard.ts` from `guards/` → `rbac/roles.guard.ts` (no behavior change; just relocation).
- Move `roles.decorator.ts` from `decorators/` → `rbac/roles.decorator.ts` (no behavior change).
- New `rbac/role-hierarchy.ts` — `hasAtLeastRole(userRoles, requiredRole, hierarchy)` and `RoleHierarchy<T>` type. Generic over the role string type. No domain knowledge.
- New `rbac/cannot-self-modify.ts` — `assertCanModifyOtherRoles(requester, target, roleChanges)` throws `ForbiddenException` on self-escalation. No domain knowledge.
- New `rbac/index.ts` — barrel re-export of guard, decorator, hierarchy, self-modify.
- Update `packages/auth/src/index.ts` to re-export from `./rbac` (one-line change).
- Delete the now-empty `packages/auth/src/guards/roles.guard.ts` and `packages/auth/src/decorators/roles.decorator.ts` after the move.

**RBAC application (domain layer, `apps/nominas/src/modules/usuarios/`):**
- 6 endpoints: `POST /usuarios` (public), `GET /usuarios` (admin, manager), `GET /usuarios/:id` (admin, manager, user), `PATCH /usuarios/:id` (admin, manager, user), `DELETE /usuarios/:id` (admin), `PATCH /usuarios/:id/roles` (admin — **new**).
- Add `roles: string[]` to `Usuario` schema; default `['user']`; indexed for `find({ roles: 'admin' })` queries.
- New `enums/usuario-role.enum.ts` — `Admin`, `Manager`, `User`.
- New `dto/assign-roles.dto.ts` — `roles: string[]` with `IsArray`, `ArrayMinSize(1)`, `IsEnum(UsuarioRole, { each: true })`.
- `UsuariosService.assignRoles()` using `assertCanModifyOtherRoles` from `@common/auth`.
- Admin bootstrap from `ADMIN_EMAIL` env var (no-op if not set) via `onApplicationBootstrap` in `UsuariosModule`.
- Update `AGENTS.md` §8 to document the RBAC pattern with a `usuarios` example.

### Out of Scope

- Modifying the existing 3 `__tests__/` files — they will break; per user override, tests are fixed in a separate follow-up.
- Refactoring `AuthService` (still in DEMO mode with hardcoded `roles: ['user']`).
- Adding a global `APP_GUARD` in `main.ts` (orthogonal improvement).
- Adding fields to the JWT payload (the existing `roles?: string[]` field is sufficient).
- Extracting a `RoleManagementService` abstract class in `packages/auth/` (premature for 1 consumer — wait for a 2nd use case).

## Affected Areas

### Framework layer — `packages/auth/src/rbac/`

| Area | Impact | Description |
|------|--------|-------------|
| `packages/auth/src/rbac/roles.guard.ts` | New (moved) | Was `guards/roles.guard.ts`; imports updated to use `cannot-self-modify` + `role-hierarchy` |
| `packages/auth/src/rbac/roles.decorator.ts` | New (moved) | Was `decorators/roles.decorator.ts`; content unchanged |
| `packages/auth/src/rbac/role-hierarchy.ts` | New | `hasAtLeastRole(userRoles, requiredRole, hierarchy)` generic utility |
| `packages/auth/src/rbac/cannot-self-modify.ts` | New | `assertCanModifyOtherRoles(requester, target, roleChanges)` throws `ForbiddenException` |
| `packages/auth/src/rbac/index.ts` | New | Barrel re-export |
| `packages/auth/src/index.ts` | Modified | One-line change: re-export from `./rbac` instead of `./guards/roles.guard` + `./decorators/roles.decorator` |
| `packages/auth/src/guards/roles.guard.ts` | **Deleted** | Content moved to `rbac/` |
| `packages/auth/src/decorators/roles.decorator.ts` | **Deleted** | Content moved to `rbac/` |

### Domain layer — `apps/nominas/src/modules/usuarios/`

| Area | Impact | Description |
|------|--------|-------------|
| `apps/nominas/src/modules/usuarios/schemas/usuario.schema.ts` | Modified | Add `roles: string[]` (default `['user']`, indexed) |
| `apps/nominas/src/modules/usuarios/dto/create-usuario.dto.ts` | Modified | Optional `roles` field with validation |
| `apps/nominas/src/modules/usuarios/dto/update-usuario.dto.ts` | Modified | Optional `roles` field (admin-only at service layer) |
| `apps/nominas/src/modules/usuarios/dto/assign-roles.dto.ts` | New | DTO for `PATCH /:id/roles` |
| `apps/nominas/src/modules/usuarios/enums/usuario-role.enum.ts` | New | `Admin` / `Manager` / `User` |
| `apps/nominas/src/modules/usuarios/usuarios.repository.ts` | Modified | `toPublic()` exposes `roles`; new `updateRoles()` method |
| `apps/nominas/src/modules/usuarios/usuarios.service.ts` | Modified | `assignRoles()` + self-escalation guard; default `roles` on create |
| `apps/nominas/src/modules/usuarios/usuarios.controller.ts` | Modified | `@UseGuards` + per-endpoint `@Roles()`; new `PATCH /:id/roles` |
| `apps/nominas/src/modules/usuarios/usuarios.module.ts` | Modified | `onApplicationBootstrap` for admin seed |
| `AGENTS.md` §8 | Modified | Document RBAC pattern in `usuarios` |

## Decisions taken (with rationale)

1. **Roles = `admin`, `manager`, `user`** — sufficient for medium complexity. `manager` covers the read-all-but-don't-delete case that is the most common "second role" need.
2. **Hierarchy = `admin > manager > user`** — implemented as a separate `rbac/role-hierarchy.ts` utility with `hasAtLeastRole(userRoles, requiredRole, hierarchy)` so `@Roles('user')` admits `admin` and `manager`. Avoids duplicating role lists on every `@Roles()` decorator and keeps the guard logic one-liner simple.
3. **`POST /usuarios` stays `@Public()`** — self-service registration; default role `user` assigned in the service layer. Keeps the boundary between "open the door" and "manage the building."
4. **No self-escalation** — `rbac/cannot-self-modify.ts` exports `assertCanModifyOtherRoles(requester, target, roleChanges)` which throws `ForbiddenException` when the requester targets themselves. Centralized so any future role-management endpoint (in any module) gets this for free. Defense-in-depth: prevents an admin from accidentally stripping their own admin role and locking everyone out.
5. **Admin bootstrap via `ADMIN_EMAIL` env var** — checked at `onApplicationBootstrap`. If a user with that email exists in `usuarios` and has no admin role, grant it. No-op if env var unset (dev environments). Documented as the only mechanism for first-deploy admin — no UI, no CLI.
6. **Roles live on the user document** (`usuarios.roles: string[]`) — simple, atomic, matches `AuthenticatedUser.roles: string[]` in `packages/auth/src/interfaces/auth.interfaces.ts`. Trade-off: auth and `usuarios` are decoupled, so a change to roles in `usuarios` does NOT reflect in the JWT until next login. **This is a known limitation** requiring a follow-up change to wire `AuthService.login()` to read from `usuarios` and populate `roles` in the JWT payload.
7. **Consolidate RBAC into `packages/auth/src/rbac/` (not just add to it)** — the empty `rbac/` directory was dead code from a prior refactor. Rather than scattering new utilities in `guards/` and `decorators/`, we move the working files into `rbac/` so all RBAC concerns live in one cohesive folder. This honors the user's centralization intent without over-abstracting: domain stuff (enums, DTOs, schemas, endpoints) stays in `usuarios/`.

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|------------|------------|
| 1 | **Existing tests break** (controller/service/repo signatures change) | High (certain) | Per user override, tests are out of scope. Document explicitly in the change. A follow-up change updates tests. CI will be red until then. |
| 2 | **Auth identity ↔ `usuarios` are decoupled** — RBAC works for hardcoded demo user but real users with roles in `usuarios` will not see those roles in their JWT until the next login | High | Document as known limitation. Add a code comment in `UsuariosService.assignRoles()` noting "caller should re-login to refresh JWT." A follow-up change wires `AuthService` to read from `usuarios`. |
| 3 | **First deploy lockout** if `ADMIN_EMAIL` is unset and no user has been granted admin | Medium | Bootstrap is idempotent and logs loudly. AGENTS.md and `.env.example` MUST document `ADMIN_EMAIL` as a required prod variable. The dev seed user (`demo@example.com`) keeps `['user']` so the app is browsable even before the first admin exists. |
| 4 | **Role hierarchy brittleness** — adding a 4th role (`supervisor`) requires a code change to `roleHierarchy` | Low | Accept for medium scope. Promote to a data-driven config in a future change if role count grows. |
| 5 | **`toPublic()` projection** — existing docs have no `roles` field; will return `undefined` | Low | Default `roles: ['user']` on schema level; old docs are updated lazily on first read (`$setOnInsert` is not used — relying on application default). |
| 6 | **File move blast radius** — `roles.guard.ts` and `roles.decorator.ts` move from `guards/` and `decorators/` into `rbac/`. Currently imported in 3 files. | Low | All 3 imports + 1 export line updated atomically. `git mv` preserves blame history. The 2 old files are deleted in the same commit so there is no broken state. |

## Rollback Plan

1. **Code-level:** `git revert` the merge commit. All changes are additive or replace-guarded — no destructive migrations. The `roles` field is a non-breaking additive schema change (Mongoose tolerates missing field, default applies on next write). The file moves are a single atomic commit so reverting restores both old and new locations correctly.
2. **Database-level:** no migration needed. The `roles` field defaults to `['user']` on any new write; existing documents are read with `roles: undefined` and the service default kicks in. To remove the field entirely, run a one-off `db.usuarios.updateMany({}, { $unset: { roles: '' } })` and drop the `roles_1` index.
3. **Bootstrap:** remove `ADMIN_EMAIL` from `.env`. The `onApplicationBootstrap` hook is a no-op when env var is missing.
4. **Guards:** removing the `@UseGuards` decorators in `UsuariosController` reverts to the unprotected state. The `rbac/role-hierarchy.ts` and `rbac/cannot-self-modify.ts` utilities are pure functions — removing their imports reverts to the original `some()` check in `RolesGuard`.

## Out of scope (future work)

- **Wiring `AuthService` to read `roles` from `usuarios`** — closes the auth/identity gap. Requires deciding whether `usuarios._id === auth.sub` or whether auth has its own identity collection. This is its own change with its own proposal.
- **Attribute-based access control (CASL, AccessControl, OpenFGA)** — for finer-grained policies ("manager can edit users in their department"). Out of scope for medium RBAC.
- **Global `APP_GUARD`** in `main.ts` — would let every controller opt out via `@Public()` instead of opting in via `@UseGuards`. Cleaner once we have many protected controllers, but orthogonal to this change.
- **Extracting a `RoleManagementService` abstract class in `packages/auth/`** — for now we have one consumer (usuarios). When a 2nd module needs role management, introduce the abstract class so both implement the same contract.
- **Updating `__tests__/`** — controller/service/repository test files. Per user override, deferred.
- **Rate limiting auth endpoints** — already specced in auth spec; not implemented yet; not part of this change.

## Dependencies

- `sdd/usuarios-rbac/explore` (engram #103) — completed
- `sdd/usuarios-rbac/design-decisions` (engram #104) — 6 decisions accepted by user
- `openspec/specs/auth/spec.md` §Role-Based Access — already requires `@Roles()` + `RolesGuard`; this change is its first concrete implementation in a feature module

## Success Criteria

- [ ] `packages/auth/src/rbac/` contains: `roles.guard.ts`, `roles.decorator.ts`, `role-hierarchy.ts`, `cannot-self-modify.ts`, `index.ts`
- [ ] Old `packages/auth/src/guards/roles.guard.ts` and `packages/auth/src/decorators/roles.decorator.ts` are deleted
- [ ] `packages/auth/src/index.ts` re-exports from `./rbac` (no consumer needs to change)
- [ ] All 5 existing `usuarios` endpoints require authentication; `POST /usuarios` is `@Public()`
- [ ] `PATCH /usuarios/:id/roles` exists, is admin-only, and rejects self-modification with 403
- [ ] `RolesGuard` admits higher roles for any `@Roles('user')` annotation (hierarchy works via `hasAtLeastRole`)
- [ ] First admin is seeded from `ADMIN_EMAIL` env var on `onApplicationBootstrap`
- [ ] `npm run build` passes (TypeScript types valid for the new `roles` field, `UsuarioRole` enum, and moved files)
- [ ] `npm run lint` passes
- [ ] AGENTS.md §8 documents the RBAC pattern with a `usuarios`-specific example
- [ ] Tests are NOT updated (per user override); CI will show the 3 spec files failing — documented in the change as a follow-up
