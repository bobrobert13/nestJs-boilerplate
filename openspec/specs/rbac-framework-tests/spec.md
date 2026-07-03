# Capability: rbac-framework-tests

## Purpose

The system MUST provide unit test coverage for the three reusable RBAC primitives in `packages/auth/src/rbac/` (`hasAtLeastRole`, `assertCanModifyOtherRoles`, and `RolesGuard`) so that role-hierarchy and self-modification rules are protected against regressions by automated tests.

## Requirements

### Requirement: hasAtLeastRole Unit Tests

The system MUST ship a spec file at `packages/auth/src/rbac/__tests__/role-hierarchy.spec.ts` containing at least 5 test cases that prove the contract of `hasAtLeastRole`. The tests MUST cover: a higher role satisfies a lower requirement; a lower role fails a higher requirement; one of multiple user roles satisfies the check; an empty `userRoles` array never satisfies; a role that is missing from the hierarchy is treated as rank 0 and never satisfies a positive-rank requirement.

#### Scenario: Higher role satisfies lower requirement

- **GIVEN** a hierarchy `{ admin: 3, manager: 2, user: 1 }` and `userRoles: ['admin']`
- **WHEN** the test calls `hasAtLeastRole(['admin'], 'user', hierarchy)`
- **THEN** the assertion confirms the return value is `true`

#### Scenario: Lower role fails higher requirement

- **GIVEN** the same hierarchy and `userRoles: ['user']`
- **WHEN** the test calls `hasAtLeastRole(['user'], 'admin', hierarchy)`
- **THEN** the assertion confirms the return value is `false`

#### Scenario: One of multiple user roles satisfies the check

- **GIVEN** the same hierarchy and `userRoles: ['user', 'manager']`
- **WHEN** the test calls `hasAtLeastRole(['user', 'manager'], 'manager', hierarchy)`
- **THEN** the assertion confirms the return value is `true`

#### Scenario: Empty user roles never satisfy

- **GIVEN** the same hierarchy and `userRoles: []`
- **WHEN** the test calls `hasAtLeastRole([], 'user', hierarchy)`
- **THEN** the assertion confirms the return value is `false`

#### Scenario: Unknown role in user roles is rank 0

- **GIVEN** the same hierarchy and `userRoles: ['guest']` (a role absent from the map)
- **WHEN** the test calls `hasAtLeastRole(['guest'], 'user', hierarchy)`
- **THEN** the assertion confirms the return value is `false` because the unknown role has no rank and cannot satisfy rank 1

### Requirement: assertCanModifyOtherRoles Unit Tests

The system MUST ship a spec file at `packages/auth/src/rbac/__tests__/cannot-self-modify.spec.ts` containing at least 3 test cases that prove the contract of `assertCanModifyOtherRoles`. The tests MUST cover: same id on both sides throws `ForbiddenException`; different ids return without throwing; the helper accepts plain `{ id: string }` objects (proving it is independent of any Mongoose document type at the call site).

#### Scenario: Self-modification throws ForbiddenException

- **GIVEN** a requester `{ id: 'A' }` and a target `{ id: 'A' }` with `roleChanges: { roles: ['manager'] }`
- **WHEN** the test calls `assertCanModifyOtherRoles(requester, target, roleChanges)`
- **THEN** the assertion confirms a `ForbiddenException` is thrown
- **AND** the exception message includes the substring "Cannot modify your own roles"

#### Scenario: Different ids return without throwing

- **GIVEN** a requester `{ id: 'A' }` and a target `{ id: 'B' }` with `roleChanges: { roles: ['manager'] }`
- **WHEN** the test calls `assertCanModifyOtherRoles(requester, target, roleChanges)`
- **THEN** the assertion confirms the call returns `undefined` (void) and no exception is raised

#### Scenario: Helper accepts plain objects (no Mongoose dependency)

- **GIVEN** requester and target typed as `{ readonly id: string }` (NOT Mongoose `Document`)
- **WHEN** the test invokes the helper with two plain literals
- **THEN** the TypeScript compiler accepts the call (proving the helper is domain-agnostic)
- **AND** the runtime call returns without throwing

### Requirement: RolesGuard Unit Tests

The system MUST ship a spec file at `packages/auth/src/rbac/__tests__/roles.guard.spec.ts` containing at least 6 test cases that prove the contract of `RolesGuard.canActivate`. The tests MUST cover: no `@Roles()` metadata allows access; `@Roles('user')` admits `admin` and `manager` when an `RBAC_HIERARCHY` is registered; `@Roles('admin')` rejects a `user`; the backward-compatible string-equality check works when no hierarchy is registered; missing `user` on the request denies access; missing `user.roles` denies access.

#### Scenario: No Roles annotation allows access

- **GIVEN** an `ExecutionContext` whose handler has no `@Roles()` metadata
- **WHEN** the guard's `canActivate` is called
- **THEN** the assertion confirms it returns `true` regardless of `req.user`

#### Scenario: Higher role satisfies lower requirement with hierarchy

- **GIVEN** a `RolesGuard` constructed with a hierarchy `{ admin: 3, manager: 2, user: 1 }` and `req.user.roles = ['admin']`
- **WHEN** the handler is annotated `@Roles('user')`
- **THEN** `canActivate` returns `true` because `admin (3) >= user (1)`

#### Scenario: Lower role fails higher requirement with hierarchy

- **GIVEN** the same hierarchy and `req.user.roles = ['user']`
- **WHEN** the handler is annotated `@Roles('admin')`
- **THEN** `canActivate` returns `false` because `user (1) < admin (3)`

#### Scenario: Backward compatibility when no hierarchy is registered

- **GIVEN** a `RolesGuard` constructed WITHOUT a hierarchy and `req.user.roles = ['admin']`
- **WHEN** the handler is annotated `@Roles('admin')`
- **THEN** `canActivate` returns `true` (string-equality fallback)
- **AND** when the handler is annotated `@Roles('user')` with the same user, `canActivate` returns `false`

#### Scenario: Missing user denies access

- **GIVEN** a `RolesGuard` constructed WITH a hierarchy and `req.user` is `undefined`
- **WHEN** the handler is annotated `@Roles('user')`
- **THEN** `canActivate` returns `false`

#### Scenario: Missing user.roles denies access

- **GIVEN** a `RolesGuard` constructed WITH a hierarchy and `req.user.roles` is `undefined`
- **WHEN** the handler is annotated `@Roles('user')`
- **THEN** `canActivate` returns `false`
