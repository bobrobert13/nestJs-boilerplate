# Tasks: RBAC for Usuarios Module

## Summary
Two-phase change: (1) consolidate generic RBAC primitives into `packages/auth/src/rbac/`, (2) apply RBAC to `usuarios` module. 15 tasks + 2 verifications, ~325 changed lines, 18 files, single PR. Tests out of scope per user override.

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

| Field | Value |
|-------|-------|
| Estimated changed lines | ~325 |
| Files touched | 18 (7 new, 2 deleted, 9 modified) |
| Risk level | Medium — auth code, Mongoose schema + index, env-var bootstrap |
| Delivery strategy | ask-on-risk |

## Execution order
Phase 1 (framework) MUST complete before Phase 2 (domain) because Phase 2 imports `RoleHierarchy<T>`, `hasAtLeastRole`, `assertCanModifyOtherRoles`, `RBAC_HIERARCHY` from `@common/auth`. Each task is independently committable.

## Phase 1: Framework consolidation in `packages/auth/src/rbac/`

- [ ] 1.1 NEW `role-hierarchy.ts` — `RoleHierarchy<T>` type + pure `hasAtLeastRole(userRoles, requiredRole, hierarchy)`. No NestJS imports. ~30 lines. **Commit**: `feat(rbac): add hasAtLeastRole generic hierarchy utility`
- [ ] 1.2 NEW `cannot-self-modify.ts` — `HasId` + `RoleChanges` + `assertCanModifyOtherRoles(requester, target, roleChanges)` throws `ForbiddenException` on self-mod. ~30 lines. **Commit**: `feat(rbac): add assertCanModifyOtherRoles self-modification guard`
- [ ] 1.3 `git mv` `guards/roles.guard.ts` → `rbac/roles.guard.ts`; inject `RBAC_HIERARCHY` token, call `hasAtLeastRole`; update 2 import sites. ~50 lines + 2 edits. **Commit**: `refactor(rbac): move RolesGuard to rbac/ with optional hierarchy support`
- [ ] 1.4 `git mv` `decorators/roles.decorator.ts` → `rbac/roles.decorator.ts`; update import in `roles.guard.ts`. ~30 lines + 1 edit. **Commit**: `refactor(rbac): move Roles decorator to rbac/`
- [ ] 1.5 NEW `rbac/index.ts` barrel; update `packages/auth/src/index.ts` to re-export from `./rbac`. ~10 lines + 2 edits. **Commit**: `feat(rbac): consolidate RBAC exports through rbac/`
- [ ] 1.6 Verify: `npm run build` + `npm run lint` + `npm run format` pass. No commit.

## Phase 2: Domain application in `apps/nominas/src/modules/usuarios/`

- [ ] 2.1 NEW `enums/usuario-role.enum.ts` — `UsuarioRole` string enum (Admin/Manager/User) + frozen `UsuarioRoleHierarchy` map. ~20 lines. **Commit**: `feat(usuarios): add UsuarioRole enum and role hierarchy`
- [ ] 2.2 NEW `dto/assign-roles.dto.ts` — `AssignRolesDto` with `IsArray` + `ArrayMinSize(1)` + `IsEnum(UsuarioRole, { each: true })`. ~15 lines. **Commit**: `feat(usuarios): add AssignRolesDto with role validation`
- [ ] 2.3 MOD `schemas/usuario.schema.ts` — add `@Prop({ type: [String], default: ['user'], index: true }) roles: string[]` + `@ApiProperty`. +5 lines. **Commit**: `feat(usuarios): add roles field to Usuario schema`
- [ ] 2.4 MOD `usuarios.repository.ts` — `toPublic()` normalizes `roles ?? ['user']`; add `updateRoles(id, roles)` with `findByIdAndUpdate({ new: true })`. +15 lines. **Commit**: `feat(usuarios): add updateRoles + legacy doc normalization`
- [ ] 2.5 MOD `usuarios.service.ts` — `create()` persists `['user']` default; add `assignRoles(id, roles, requesterId)` calling `assertCanModifyOtherRoles`; add `grantAdminByEmail(email)` for bootstrap. +30 lines. **Commit**: `feat(usuarios): add assignRoles + grantAdminByEmail service methods`
- [ ] 2.6 MOD `usuarios.controller.ts` — class-level `@UseGuards(JwtAuthGuard, RolesGuard)`; `@Public()` on `POST`; per-endpoint `@Roles`; NEW `PATCH /:id/roles` admin-only. +35 lines. **Commit**: `feat(usuarios): apply RBAC to controller + add role management endpoint`
- [ ] 2.7 MOD `usuarios.module.ts` — implement `OnApplicationBootstrap`; register `RBAC_HIERARCHY` provider; bootstrap method reads `ADMIN_EMAIL` and calls `service.grantAdminByEmail()`. +30 lines. **Commit**: `feat(usuarios): add admin bootstrap from ADMIN_EMAIL env var`
- [ ] 2.8 MOD `AGENTS.md` §8 — add `### RBAC in usuarios` subsection (guard chain, `@Roles`, `RBAC_HIERARCHY` token, `assertCanModifyOtherRoles`, `ADMIN_EMAIL` bootstrap). +30 lines. **Commit**: `docs(agents): document usuarios RBAC pattern in §8`
- [ ] 2.9 Verify: `npm run build` + `npm run lint` + `npm run format` pass. No commit.

## Cumulative line count
~325 (framework 155 + domain 170)

## Cumulative work-unit commit count
10 work-unit commits + 2 verifications (no commit)

## PR recommendation
**Single PR** — under 400-line review budget. Framework + domain share a common type contract (`RoleHierarchy<T>`, `RBAC_HIERARCHY` token); splitting would force PR 2 to wait on PR 1 merge and lose atomic rollback. Single PR keeps the security-critical contract reviewable in one pass.

## Pre-flight verifications (top 2 risks resolved 2026-07-02)

**Verified against actual codebase before `sdd-apply` launch** — per user request to resolve top risks instead of trusting the forecast.

### Risk 2 — `req.user.id` shape matches `HasId` constraint ✅ RESOLVED

`packages/auth/src/strategies/jwt.strategy.ts` lines 44-54:

```typescript
async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
  if (!payload.sub || !payload.email) {
    throw new UnauthorizedException('Invalid token payload');
  }
  return {
    id: payload.sub,           // <-- guaranteed `id: string` field
    email: payload.email,
    roles: payload.roles || [],
  };
}
```

`JwtStrategy.validate()` GUARANTEES an `id: string` field on the returned object. This is what Passport attaches to `req.user`. So `assertCanModifyOtherRoles({id: req.user.id}, {id: target.id}, ...)` will always receive shapes that satisfy the `HasId` constraint, assuming `@UseGuards(JwtAuthGuard)` runs first (which task 2.6 enforces).

**Bonus**: The JWT payload already carries `roles: string[]` (`packages/auth/src/interfaces/auth.interfaces.ts` line 13). Dev seed user `demo@example.com` has `roles: ['user']` hardcoded. RBAC is end-to-end testable today without touching auth.

### Risk 3 — `ConfigModule` is global ✅ RESOLVED

`apps/nominas/src/app.module.ts` lines 12-15:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
}),
```

`isGlobal: true` is set. `ConfigService` is injectable in `UsuariosModule.onApplicationBootstrap()` without re-importing `ConfigModule`. `this.configService.get<string>('ADMIN_EMAIL')` returns the actual env value (or `undefined` if not set, which the bootstrap handles as a no-op with a warn log).

### Implication for sdd-apply

Both risks no longer need to be monitored during implementation. The existing interfaces and module wiring are sufficient. `sdd-apply` can proceed with confidence that:
- The `HasId` constraint will be satisfied at every call site to `assertCanModifyOtherRoles`.
- The `ConfigService` lookup for `ADMIN_EMAIL` will work as designed.

No additional scaffolding (DTOs, helpers, adapters) is required for these two concerns.
