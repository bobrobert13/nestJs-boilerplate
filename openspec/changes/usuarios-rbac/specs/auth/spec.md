# Delta for auth

> **Scope**: This delta adds new requirements to the `auth` spec for two new framework primitives in `packages/auth/src/rbac/` (a generic role-hierarchy utility and a self-modification guard helper). The existing `Role-Based Access` requirement is **not** modified — the `usuarios` capability change complies with it as-is.

## ADDED Requirements

### Requirement: Role Hierarchy Utility

The `@common/auth` framework MUST provide a generic `hasAtLeastRole(userRoles, requiredRole, hierarchy)` function that returns `true` when at least one of `userRoles` occupies a rank greater than or equal to `requiredRole` in the provided `hierarchy` map. The function MUST be generic over the role string type. `RolesGuard` MUST call this function so that a `@Roles('user')` annotation admits `manager` and `admin` when an `admin > manager > user` hierarchy is registered. The function MUST be pure and free of side effects.

#### Scenario: Higher role satisfies lower role check

- GIVEN a hierarchy `{ admin: 3, manager: 2, user: 1 }` and `userRoles: ['admin']`
- WHEN `hasAtLeastRole(userRoles, 'user', hierarchy)` is called
- THEN it returns `true`

#### Scenario: Lower role fails higher role check

- GIVEN a hierarchy `{ admin: 3, manager: 2, user: 1 }` and `userRoles: ['user']`
- WHEN `hasAtLeastRole(userRoles, 'admin', hierarchy)` is called
- THEN it returns `false`

#### Scenario: One of multiple user roles satisfies the check

- GIVEN a hierarchy `{ admin: 3, manager: 2, user: 1 }` and `userRoles: ['user', 'manager']`
- WHEN `hasAtLeastRole(userRoles, 'manager', hierarchy)` is called
- THEN it returns `true`

#### Scenario: Empty user roles never satisfy a check

- GIVEN a hierarchy `{ admin: 3, manager: 2, user: 1 }` and `userRoles: []`
- WHEN `hasAtLeastRole(userRoles, 'user', hierarchy)` is called
- THEN it returns `false`

### Requirement: Self-Modification Guard Helper

The `@common/auth` framework MUST provide an `assertCanModifyOtherRoles(requester, target, roleChanges)` helper that throws `ForbiddenException` when `requester.id === target.id` AND `roleChanges` would alter the requester's own roles. The helper MUST be domain-agnostic: it MUST accept generic requester and target shapes (with at least an `id` field) and MUST NOT import any specific module's DTO or schema. The helper MUST NOT throw when the requester and target differ.

#### Scenario: Admin tries to change own roles

- GIVEN a requester `{ id: 'A' }` and a target `{ id: 'A' }` with `roleChanges: { roles: ['manager'] }`
- WHEN `assertCanModifyOtherRoles(requester, target, roleChanges)` is called
- THEN it throws `ForbiddenException` with a message indicating self-modification is forbidden

#### Scenario: Admin changes another user's roles

- GIVEN a requester `{ id: 'A' }` and a target `{ id: 'B' }` with `roleChanges: { roles: ['manager'] }`
- WHEN `assertCanModifyOtherRoles(requester, target, roleChanges)` is called
- THEN it returns without throwing

#### Scenario: Helper is independent of Mongoose

- GIVEN the helper is invoked from a non-Mongoose caller (e.g., a service that holds a plain object)
- WHEN `assertCanModifyOtherRoles(requester, target, roleChanges)` is called
- THEN it does not require any Mongoose document type at the call site
