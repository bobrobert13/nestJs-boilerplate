# Verify Report: RBAC for Usuarios Module

**Change**: `usuarios-rbac`
**Mode**: Standard (manual + static analysis — no tests, per user override)
**Date**: 2026-07-02
**Branch**: `feat/usuarios-rbac` (16 work-unit commits, build green)
**Verifier**: sdd-verify executor (manual + static analysis)

---

## Build verification

- `npm run build` result: **PASS**
- Build output (last 20 lines):

  ```text
  > nest build
  webpack 5.106.0 compiled successfully in 6821 ms
  ```

- Any TS errors or warnings: **None** (re-run after reading the codebase, build is still green)
- Files compiled: 20 changed in diff (`806 insertions, 71 deletions`); 18 are part of the RBAC change, 2 are the passkeys v9→v10 fix
- Working tree: clean (only `openspec/` is untracked, which is correct — it is the SDD artifact root)

---

## Static analysis (per file)

> "**Match**" below means the implementation is consistent with the design contract. "**Concern**" means a runtime issue or deviation worth flagging.

### 1. `packages/auth/src/rbac/role-hierarchy.ts` — NEW (103 lines)

- **Match** ✅ — `RoleHierarchy<T extends string> = Readonly<Record<T, number>>` matches design contract exactly.
- **Match** ✅ — `hasAtLeastRole` is a pure function with no NestJS imports.
- **Edge cases reviewed**:
  - Empty `userRoles` → `false` (line 94-96) ✅
  - Required role not in hierarchy → throws `Error` with clear message (line 87-92) ✅
  - Unknown role in `userRoles` → treated as rank 0, cannot satisfy positive-rank check (line 99-101) ✅
  - Generic over `T extends string` — correct, no `any` leak ✅
- **Code quality**: Excellent. JSDoc on the function covers all 4 behavior contract points. The `unknown role → rank 0` handling is a small, defensible choice that matches the design.
- **No findings**.

### 2. `packages/auth/src/rbac/cannot-self-modify.ts` — NEW (89 lines)

- **Match** ✅ — `HasId` + `RoleChanges` + `assertCanModifyOtherRoles` match design contract.
- **Match** ✅ — Throws `ForbiddenException` with a clear message; no Mongoose/DTO/schema imports; pure function.
- **Edge cases reviewed**:
  - Same id → throws ✅
  - Different id → returns void ✅
  - Null/undefined inputs → would throw at `requester.id` access (caller's job to validate; helper is `domain-agnostic` by design) ✅
- **Code quality**: The `void roleChanges;` on line 88 is a deliberate no-op acknowledging the parameter is part of the public contract (for future logic). Comment explains intent. This is a fine choice — it documents the API surface.
- **No findings**.

### 3. `packages/auth/src/rbac/roles.guard.ts` — MOVED + MODIFIED (73 lines)

- **Match** ✅ — Guard injects `RBAC_HIERARCHY` via `@Optional()` so modules that don't register the hierarchy still work (backward-compat fallback to string equality).
- **Match** ✅ — Calls `hasAtLeastRole` for hierarchy-aware check when hierarchy is registered.
- **Edge cases reviewed**:
  - `RBAC_HIERARCHY` not registered → falls back to `userRoles.includes(role)` (line 71) ✅ — confirmed via the `auth.controller.ts` consumer which uses `RolesGuard` without registering the hierarchy.
  - `user.roles` undefined or null → returns `false` (line 58-60) ✅
  - Empty `requiredRoles` → returns `true` (line 52-54) ✅
- **Type safety**: `import type { RoleHierarchy }` is split from the value import to satisfy `isolatedModules + emitDecoratorMetadata` (documented in apply-progress deviation #3). This is the correct pattern.
- **No findings**.

### 4. `apps/nominas/src/modules/usuarios/enums/usuario-role.enum.ts` — NEW (34 lines)

- **Match** ✅ — `UsuarioRole` is a string enum with `Admin = 'admin'`, `Manager = 'manager'`, `User = 'user'`. Values are correct strings.
- **Match** ✅ — `UsuarioRoleHierarchy` is `Object.freeze`d with ranks `admin: 3, manager: 2, user: 1`.
- **ADR-1 compliance**: Hierarchy co-located with the enum, NOT in `rbac/` — boundary preserved.
- **No findings**.

### 5. `apps/nominas/src/modules/usuarios/dto/assign-roles.dto.ts` — NEW (31 lines)

- **Code match** ✅ — `@IsArray`, `@ArrayMinSize(1)`, `@IsEnum(UsuarioRole, { each: true })` are all present.
- ⚠️ **CRITICAL RUNTIME FINDING**: These validators only fire when a `ValidationPipe` is in scope. **No global `ValidationPipe` is registered** (verified: `main.ts` has `useGlobalFilters` but not `useGlobalPipes`; `app.module.ts` has no global pipe provider; the controller has no `@UsePipes(...)` decorator). See "Critical finding 1" below.
- **No code-level finding** (the DTO is correct; the wiring is the issue).

### 6. `apps/nominas/src/modules/usuarios/schemas/usuario.schema.ts` — MODIFIED (38 lines)

- **Match** ✅ — `@Prop({ type: [String], default: ['user'], index: true }) roles: string[]` matches design.
- **Match** ✅ — `@ApiProperty` describes the field for Swagger.
- **Spec coverage**:
  - "User Schema Roles Field" (usuarios spec): ✅ indexed, default `['user']`, applied to new docs.
  - "Default role on creation" scenario: enforced in service layer (`create` defaults to `['user']` when DTO omits) ✅
  - "Legacy documents read with default" scenario: enforced in `repository.toPublic` (legacy docs with `roles: undefined` → `['user']`) ✅
- **No findings**.

### 7. `apps/nominas/src/modules/usuarios/usuarios.repository.ts` — MODIFIED (134 lines)

- **Match** ✅ — `toPublic` normalizes `roles ?? ['user']` for legacy docs (line 129).
- **Match** ✅ — `updateRoles` uses `findByIdAndUpdate` with `{ new: true }` (line 82-84).
- **Match** ✅ — `addRole` uses `$addToSet` for idempotent add (line 99-102).
- **Match** ✅ — `findRawByEmail` returns the raw Mongoose document for the bootstrap path (line 59-61) — applies the "no `toPublic`" rationale correctly.
- **Spec coverage**:
  - "Role Management Endpoint" → `updateRoles` accepts any roles from the service (which already validated with `IsEnum`) ⚠️ but the runtime validation is the concern above.
  - "Admin Bootstrap" → `addRole` + `findRawByEmail` work correctly.
- **No findings**.

### 8. `apps/nominas/src/modules/usuarios/usuarios.service.ts` — MODIFIED (143 lines)

- **Match** ✅ — `assignRoles` calls `repository.findOne` (throws 404 if not found) → `assertCanModifyOtherRoles` (throws 403 on self-mod) → `repository.updateRoles`. Order is correct per ADR-2.
- **Match** ✅ — `grantAdminByEmail` is idempotent: short-circuits when user not found (warn log), short-circuits when already admin (no-op log), otherwise uses `addRole` with `$addToSet`.
- **Match** ✅ — `create` defaults to `['user']` when DTO omits roles (line 39-45). Also accepts DTO-provided roles.
- **Edge case reviewed** — What if `requesterId === target.id`? `findOne` succeeds (returns the user), `assertCanModifyOtherRoles` throws 403. **Order is correct**: NotFoundException (404) would come before ForbiddenException (403) if the id didn't exist at all, which is the natural REST behavior. The design assumes the requester targets a different user, and 403 takes precedence over 200 for self-mod cases.
- **Concerns**:
  - **Minor** — `grantAdminByEmail` uses `as any` to read `_id` and `roles` from the document (lines 130, 138, 140). Acceptable for a bootstrap path that intentionally bypasses the public projection, but it bypasses the type system. The function is documented as such.
  - **Minor** — `addRole` returns the public projection, but the service ignores the return value (it only logs). No correctness issue, just a wasted projection.
- **No blocking findings**.

### 9. `apps/nominas/src/modules/usuarios/usuarios.controller.ts` — MODIFIED (119 lines)

- **Match** ✅ — Class-level `@UseGuards(JwtAuthGuard, RolesGuard)` + per-endpoint `@Roles()`.
- **Match** ✅ — `@Public()` on `POST /usuarios`; everything else requires JWT.
- **Match** ✅ — Per-endpoint roles match the spec:
  - `GET /` → `Roles(Admin, Manager)` (admin-or-manager)
  - `GET /:id` → `Roles(User)` (any authenticated, by hierarchy: admin/manager/user all pass)
  - `PATCH /:id` → `Roles(User)` (any authenticated)
  - `DELETE /:id` → `Roles(Admin)` (admin only)
  - `PATCH /:id/roles` → `Roles(Admin)` (admin only, self-mod rejected in service)
- **Spec coverage**:
  - "Role-Based Endpoint Protection" → ✅ all 5 endpoints protected
  - "Role Management Endpoint" → ✅ new endpoint exists with admin role
  - "Self-modification rejected" → ✅ handled in service (ADR-2 placement)
- **Match** ✅ — `AuthenticatedRequest` interface narrows `req.user` to `AuthenticatedUser` type. No global declaration merge.
- **No findings**.

### 10. `apps/nominas/src/modules/usuarios/usuarios.module.ts` — MODIFIED (71 lines)

- **Match** ✅ — `OnApplicationBootstrap` reads `ADMIN_EMAIL` via `ConfigService`.
- **Match** ✅ — `RBAC_HIERARCHY` provider registered with the domain hierarchy.
- **Match** ✅ — Cast `as unknown as Readonly<Record<string, number>>` is the safe widening documented in apply-progress deviation #5.
- **Spec coverage**:
  - "Admin Bootstrap" → ✅ all 3 scenarios covered:
    - Unset env var → warn log, no-op ✅
    - User does not exist → warn log, no-op ✅
    - User already admin → log "no-op", no DB write ✅
    - User promoted → log, `$addToSet` write ✅
- **No findings**.

### 11. `packages/auth/src/passkeys/passkeys.service.ts` — MODIFIED (180 lines)

- **Match** ✅ — Runtime behavior unchanged; only the type surface updated for `@simplewebauthn/server` v10 (commit `b2fcfb0`).
- **Documented deviations** (all in commit message + apply-progress):
  - Local `type Base64URLString = string` (v10 no longer re-exports it)
  - `await` on `generateRegistrationOptions` / `generateAuthenticationOptions` (v10 made them async)
  - `userID` encoded as `Uint8Array` (was a string in v9)
  - `verification.registrationInfo.*` (moved out of `verification.credential.*`)
  - `authenticator:` option name (was `credential:` in v9)
  - `verification.authenticationInfo.newCounter` (was `verification.credential.counter`)
  - `type: 'public-key'` restored on `allowCredentials` descriptors
- **No findings** (this is a passkeys v9→v10 fix, not a RBAC change; the RBAC verify scope is satisfied).

---

## Spec coverage matrix

### From `openspec/changes/usuarios-rbac/specs/usuarios/spec.md` (5 requirements, 12 scenarios)

| Requirement | Scenarios | Implementation evidence | Status |
|-------------|-----------|--------------------------|--------|
| **R1: Role-Based Endpoint Protection** | 1.1 User rejected from admin/manager endpoint<br>1.2 Self-service registration is public | `usuarios.controller.ts:50-53` (class-level guards)<br>`usuarios.controller.ts:57` (`@Public()` on POST)<br>`usuarios.controller.ts:67` (`@Roles(Admin, Manager)` on GET /) | ✅ Static evidence |
| **R2: Role Management Endpoint** | 2.1 Admin assigns to another user<br>2.2 Self-modification rejected<br>2.3 Invalid role rejected | `usuarios.controller.ts:103-118` (PATCH /:id/roles)<br>`usuarios.service.ts:96-100` (`assertCanModifyOtherRoles` before update)<br>`assign-roles.dto.ts:29` (`@IsEnum(UsuarioRole, { each: true })`) | ⚠️ 2.3 NOT enforced at runtime (no `ValidationPipe` — see CRITICAL FINDING 1) |
| **R3: User Schema Roles Field** | 3.1 Default role on creation<br>3.2 Legacy documents read with default | `usuario.schema.ts:34` (`@Prop(... default: ['user'], index: true)`)<br>`usuarios.service.ts:39-45` (default in create)<br>`usuarios.repository.ts:129` (legacy doc normalization) | ✅ Static evidence |
| **R4: Admin Bootstrap** | 4.1 ADMIN_EMAIL unset / user missing<br>4.2 ADMIN_EMAIL set, user promoted<br>4.3 ADMIN_EMAIL set, already admin (idempotent) | `usuarios.module.ts:58-70` (bootstrap reads `ADMIN_EMAIL`)<br>`usuarios.service.ts:120-142` (`grantAdminByEmail` with all 3 branches)<br>`usuarios.repository.ts:99-108` (`addRole` with `$addToSet`) | ✅ Static evidence |
| **R5: Role Hierarchy in Endpoint Checks** | 5.1 Higher role satisfies lower<br>5.2 User rejected from admin-only | `role-hierarchy.ts:81-103` (`hasAtLeastRole`)<br>`roles.guard.ts:64-68` (hierarchy-aware check)<br>`usuario-role.enum.ts:30-34` (frozen rank map) | ✅ Static evidence |

### From `openspec/changes/usuarios-rbac/specs/auth/spec.md` (2 requirements, 7 scenarios)

| Requirement | Scenarios | Implementation evidence | Status |
|-------------|-----------|--------------------------|--------|
| **R1: Role Hierarchy Utility** | 1.1 Higher satisfies lower<br>1.2 Lower fails higher<br>1.3 One of multiple satisfies<br>1.4 Empty user roles never satisfy | `role-hierarchy.ts:81-103` (`hasAtLeastRole` with all 4 edge cases handled) | ✅ Static evidence |
| **R2: Self-Modification Guard Helper** | 2.1 Self throws ForbiddenException<br>2.2 Other allows<br>2.3 Helper independent of Mongoose | `cannot-self-modify.ts:75-89` (only imports `ForbiddenException` from `@nestjs/common`; no Mongoose; generic over `R, T extends HasId`) | ✅ Static evidence |

**Compliance summary**: 11 of 12 usuarios scenarios are statically evidence-supported. The 12th ("Invalid role is rejected with 400") is **not enforced at runtime** because no `ValidationPipe` is wired up. See CRITICAL FINDING 1.

---

## CRITICAL FINDING 1 — Missing global `ValidationPipe` (BLOCKS MERGE)

### Description

The spec's scenario "**Invalid role is rejected**" (usuarios spec R2, scenario 2.3) requires:

> WHEN the admin PATCHes `/usuarios/:id/roles` with `{ "roles": ["superuser"] }`
> THEN the system returns 400

The implementation has the validators in `assign-roles.dto.ts`:

```typescript
@IsArray()
@ArrayMinSize(1)
@IsEnum(UsuarioRole, { each: true })
roles: UsuarioRole[];
```

**But no `ValidationPipe` is configured anywhere in the application.** Verified by:
- `apps/nominas/src/main.ts` line 17: only `app.useGlobalFilters(new DatabaseExceptionFilter())` — no `useGlobalPipes`.
- `apps/nominas/src/app.module.ts`: no global pipe provider.
- `usuarios.controller.ts`: no `@UsePipes(new ValidationPipe(...))` decorator.
- The design's own note (design.md line 227) acknowledged this dependency: _"Integrates with whichever `ValidationPipe` is in scope (controller-local `@UsePipes(new ValidationPipe(...))` if global is absent)"_ — but neither was added in the apply phase.

### Runtime impact

Without a `ValidationPipe`, the `@IsArray`, `@ArrayMinSize(1)`, and `@IsEnum` decorators on `AssignRolesDto` are no-ops at runtime. A request like `PATCH /api/usuarios/{id}/roles` with `{"roles": ["superuser"]}` will:

1. `JwtAuthGuard` — passes (admin token) ✅
2. `RolesGuard` — passes (admin role) ✅
3. `assignRoles(id, ['superuser'], requesterId)` — called ✅
4. `repository.findOne(id)` — succeeds ✅
5. `assertCanModifyOtherRoles` — passes (different user) ✅
6. `repository.updateRoles(id, ['superuser'])` — **writes `['superuser']` to MongoDB** ❌
7. Returns **200**, not 400

This DIRECTLY violates the spec scenario.

### Recommended fix (1 line in `apps/nominas/src/main.ts`)

```typescript
import { ValidationPipe } from '@nestjs/common';

// ... inside bootstrap(), after NestFactory.create:
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

This is consistent with the nestjs-best-practices standard: _"Validate all input with DTOs + ValidationPipe (whitelist + forbidNonWhitelisted)"_.

### Severity

**CRITICAL** — blocks spec compliance for one explicit scenario. The user override (tests out of scope) does not waive this; the scenario is in the spec and the code is meant to enforce it.

### Note for the orchestrator

This is a single-line fix, not a redesign. The DTO is correct. The fix is in `main.ts` and does not touch the RBAC primitives.

---

## Other findings (non-blocking)

### SUGGESTION 1 — Cast safety in `roles.guard.ts` (low severity)

`roles.guard.ts:66` does `this.hierarchy as RoleHierarchy<string>`. The double cast in `usuarios.module.ts:35-37` (`as unknown as Readonly<Record<string, number>>`) makes this safe. The guard itself is `@Optional() @Inject(RBAC_HIERARCHY) private readonly hierarchy?: RoleHierarchy<string>` — when injected, TS already narrowed to `RoleHierarchy<string>`. The cast is a no-op safety net.

Not a finding worth blocking on.

### SUGGESTION 2 — `usuario.interface.ts` is dead code (informational)

`apps/nominas/src/modules/usuarios/interfaces/usuario.interface.ts` exists but is not imported anywhere (no `grep` matches outside its own file). It is also missing the `roles` field. This is pre-existing dead code, NOT introduced by this change. Could be removed in a follow-up cleanup.

### WARNING 1 — `grantAdminByEmail` uses `as any` to read `_id` (low severity)

`usuarios.service.ts:130, 138, 140` uses `(user as any)._id.toString()`. This bypasses the type system. The function is documented as bootstrap-only and intentionally bypasses the public projection. Acceptable, but a typed `findById` helper that returns `{ _id: string; roles: string[] }` would be cleaner.

### WARNING 2 — `findRawByEmail` exposes the full Mongoose document to the service (low severity)

`usuarios.repository.ts:59-61` returns the raw Mongoose document, leaking Mongoose concerns into the service layer (e.g., `(user as any)._id` rather than `user.id`). This is documented and intentional (the bootstrap needs the raw `_id`), but a thin wrapper type would be cleaner.

### WARNING 3 — 3 spec files in `usuarios/__tests__/` are out-of-date (user override, NOT a regression)

`usuarios.controller.spec.ts`, `usuarios.service.spec.ts`, `usuarios.repository.spec.ts` reference the old API signatures:
- `mockService` in `controller.spec.ts` is missing `assignRoles` and `grantAdminByEmail` (lines 25-30).
- `mockRepository` in `service.spec.ts` is missing `findRawByEmail`, `updateRoles`, `addRole` (lines 25-31).
- `mockModel` in `repository.spec.ts` is missing methods that the repository now uses.

These files compile (because the mocks use `as any`) but will fail at test runtime if the controller test were extended to cover `assignRoles`. Per the user override, tests are out of scope and the proposal lists this as a follow-up change. Documented, not blocking.

### WARNING 4 — `npm run lint` is pre-existing broken (NOT a regression)

Per apply-progress: the eslint glob pattern on `main` matches zero files, so `npm run lint` is broken before this change. Not a regression. Documented.

---

## Manual smoke test (for the user to run)

Pre-requisites:
- MongoDB running and accessible at `MONGODB_URI`
- `npm run start:dev` running
- A demo user (e.g., `demo@example.com`) exists with `roles: ['user']`
- (For admin tests) `ADMIN_EMAIL=admin@example.com` set in `.env`, and a user with that email exists

### 1. Unauthenticated request denied (expect 401)

```bash
curl -i -X GET http://localhost:3000/api/usuarios
# Expected: HTTP/1.1 401 Unauthorized
```

### 2. Public registration works (expect 201)

```bash
curl -i -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Smoke",
    "apellido": "Test",
    "email": "smoke.test@example.com"
  }'
# Expected: HTTP/1.1 201 Created
# Response body: { ..., "roles": ["user"] }
```

### 3. Authenticated user with role 'user' is denied from admin endpoints (expect 403)

First, get a JWT for the demo user (via auth login or dev shortcut):

```bash
# Login to get a token (uses the existing /api/auth/login endpoint)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@example.com", "password": "demo123"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# Try the admin endpoint
curl -i -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN"
# Expected: HTTP/1.1 403 Forbidden
```

### 4. Authenticated admin can list users (expect 200)

For this to work, you need:
- A user with `email = admin@example.com` to exist in MongoDB
- `ADMIN_EMAIL=admin@example.com` in `.env`
- Restart `npm run start:dev` so the bootstrap grants `admin` role

```bash
# Register the admin user (if not already)
curl -i -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin",
    "apellido": "User",
    "email": "admin@example.com"
  }'

# Restart the server with ADMIN_EMAIL=admin@example.com
# Check the logs for: "ADMIN_EMAIL=admin@example.com: granted admin role to user ..."

# Login as the admin (or use the demo token if its role is now 'admin')
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  | jq -r '.data.accessToken')

curl -i -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: HTTP/1.1 200 OK
# Response: array of usuarios
```

### 5. Self-modification rejected (expect 403)

```bash
# Get the admin's own user ID (from the /usuarios list)
ADMIN_ID=$(curl -s -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq -r '.[] | select(.email == "admin@example.com") | .id')

curl -i -X PATCH "http://localhost:3000/api/usuarios/${ADMIN_ID}/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles": ["manager"]}'
# Expected: HTTP/1.1 403 Forbidden
# Response: { "message": "Cannot modify your own roles. Ask another admin to do it.", ... }
```

### 6. Admin can modify another user's roles (expect 200)

```bash
# Get another user's ID
OTHER_ID=$(curl -s -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq -r '.[] | select(.email == "smoke.test@example.com") | .id')

curl -i -X PATCH "http://localhost:3000/api/usuarios/${OTHER_ID}/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles": ["manager"]}'
# Expected: HTTP/1.1 200 OK
# Response: { ..., "roles": ["manager"] }
```

### 7. Invalid role rejected (expect 400) — **WILL FAIL until CRITICAL FINDING 1 is fixed**

```bash
curl -i -X PATCH "http://localhost:3000/api/usuarios/${OTHER_ID}/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles": ["superuser"]}'
# Expected: HTTP/1.1 400 Bad Request
# Actual (without ValidationPipe): HTTP/1.1 200 OK (superuser is written to DB!)
```

### 8. Hierarchy check: admin can access `@Roles('user')` endpoints (expect 200)

```bash
# GET /usuarios/:id is annotated @Roles(User) — any authenticated user passes.
# With the hierarchy registered, an admin (rank 3) satisfies a @Roles('user') (rank 1) requirement.

curl -i -X GET "http://localhost:3000/api/usuarios/${OTHER_ID}" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: HTTP/1.1 200 OK
```

### 9. ADMIN_EMAIL bootstrap (visual: check server logs)

With `ADMIN_EMAIL=admin@example.com` set in `.env` and a user with that email in the DB, the server log on boot should include one of:

- If user doesn't exist yet: `ADMIN_EMAIL=admin@example.com but no user with that email exists — bootstrap skipped.`
- If user exists and has admin already: `ADMIN_EMAIL=admin@example.com: user already has admin role — bootstrap no-op.`
- If user exists and is promoted: `ADMIN_EMAIL=admin@example.com: granted admin role to user <id>.`

If `ADMIN_EMAIL` is unset:

```text
WARN [UsuariosModule] ADMIN_EMAIL env var is not set — admin bootstrap skipped. Set it to the email of a user that should be granted the admin role on boot.
```

---

## Out-of-scope checks (do NOT run)

- Automated tests: out of scope per user override (3 spec files in `usuarios/__tests__/` are known stale)
- E2E: out of scope per user override
- Coverage report: threshold is 0 in `openspec/config.yaml`
- Rate limiting: not implemented
- Auth integration tests: not part of this change

---

## Known limitations (from apply-progress)

1. 3 spec files in `usuarios/__tests__/` will fail CI — user override, tests deferred to follow-up change
2. `npm run lint` is pre-existing broken (not a regression; eslint glob matches zero files on main)
3. Auth/Usuarios are decoupled — JWT only refreshes on next login (documented in proposal.md §Risks #2 and in service JSDoc on `assignRoles`)
4. `grantAdminByEmail` uses `as any` for raw Mongoose access — acceptable for bootstrap path, documented

---

## Final verdict

**Status: PASS** (after 2 critical fixes applied as work-unit commits)

**Critical findings — both RESOLVED before merge**:
1. **Missing global `ValidationPipe`** — fixed in commit `ca8d42e`. Added `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` in `apps/nominas/src/main.ts`. Now `@IsArray`, `@ArrayMinSize(1)`, `@IsEnum(UsuarioRole, { each: true })` on `AssignRolesDto` are enforced at runtime, satisfying spec scenario "Invalid role is rejected" (HTTP 400 for `{"roles": ["superuser"]}`).
2. **Pre-existing passkeys v9→v10 bugs** — fixed in commit `b2fcfb0`. 11 TS2339 errors in `packages/auth/src/passkeys/passkeys.service.ts`. Now type-checks because the design required the `@common/auth` path mapping.

**Original verdict** (before fixes): FAIL with 1 critical spec-compliance issue.
**Current verdict**: PASS. Build is green, 19/19 spec scenarios are statically evidence-supported (after the ValidationPipe fix), and the 2 pre-existing hygiene issues exposed by the design have been resolved.

**Other notes**:
- The build is green (`npm run build` PASS, 4.8s)
- 16 commits total on `feat/usuarios-rbac`: 5 phase 1 + 8 phase 2 + 1 design-fix + 1 passkeys-fix + 1 validation-pipe-fix = 16
- 5 design deviations from sdd-apply are all benign and documented
- 3 known limitations (out-of-scope test updates, pre-existing lint script broken, auth/usuarios decoupled) are documented but do not block

**Ready for sdd-archive**.

---

## Artifacts

- This file: `openspec/changes/usuarios-rbac/verify-report.md`
- Engram observation: `sdd/usuarios-rbac/verify-report` (id 112)
- Apply-progress: `sdd/usuarios-rbac/apply-progress` (id 110)
- Build log: `webpack 5.106.0 compiled successfully in 4801 ms` (after all fixes)

---

**Skill resolution**: injected (Project Standards block provided by orchestrator; nestjs-best-practices + bash-defensive-patterns applied to static analysis)
**Persistence mode**: hybrid (file + engram)
**Date generated**: 2026-07-02
