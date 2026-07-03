# Capability: usuarios

## Purpose

The `usuarios` module owns the user directory: CRUD over `Usuario` documents in MongoDB plus a role-management endpoint for administrators. It is the first consumer of `@common/auth` RBAC. Every endpoint except self-registration MUST require authentication, most MUST require a specific role, and the module MUST bootstrap the first administrator on application start.

## ADDED Requirements

### Requirement: Role-Based Endpoint Protection

The system MUST require authentication for `GET /usuarios`, `GET /usuarios/:id`, `PATCH /usuarios/:id`, and `DELETE /usuarios/:id`. Role MUST be `admin` or `manager` for `GET /usuarios`; `admin`, `manager`, or `user` for `GET /usuarios/:id` and `PATCH /usuarios/:id`; `admin` for `DELETE /usuarios/:id`. The system MUST mark `POST /usuarios` as public.

#### Scenario: User is rejected from admin-or-manager endpoint

- GIVEN an authenticated user with role `user`
- WHEN the user GETs `/usuarios`
- THEN the system returns 403

#### Scenario: Self-service registration is public

- GIVEN an unauthenticated request with a valid `CreateUsuarioDto` body
- WHEN the request POSTs `/usuarios`
- THEN the system returns 201 and the persisted document has `roles: ['user']`

### Requirement: Role Management Endpoint

The system MUST expose `PATCH /usuarios/:id/roles` letting an `admin` replace the target user's roles. The system MUST reject the request with 403 if the requester targets themselves. The system MUST validate that every role is a member of `UsuarioRole` and the array is non-empty.

#### Scenario: Admin assigns roles to another user

- GIVEN an authenticated requester with role `admin` and userId `A`
- WHEN the requester PATCHes `/usuarios/B/roles` with `{ "roles": ["manager"] }`
- THEN the system returns 200 and user `B` has `roles: ['manager']`

#### Scenario: Self-modification is rejected

- GIVEN an authenticated admin with userId `A`
- WHEN the same user PATCHes `/usuarios/A/roles`
- THEN the system returns 403

#### Scenario: Invalid role is rejected

- GIVEN an authenticated admin
- WHEN the admin PATCHes `/usuarios/:id/roles` with `{ "roles": ["superuser"] }`
- THEN the system returns 400

### Requirement: User Schema Roles Field

The `Usuario` Mongoose schema MUST expose `roles: string[]` with default `['user']`. The field MUST be indexed. Newly created users MUST have `roles` populated with at least `['user']` when the create payload omits the field.

#### Scenario: Default role on creation

- GIVEN a public POST `/usuarios` with `{ nombre, apellido, email }` and no `roles` field
- WHEN the system creates the user
- THEN the persisted document has `roles: ['user']`

#### Scenario: Legacy documents read with default

- GIVEN a user document written before this change (no `roles` field)
- WHEN the document is read via `GET /usuarios/:id`
- THEN the response includes `roles: ['user']`

### Requirement: Admin Bootstrap

On `onApplicationBootstrap`, the `UsuariosModule` MUST check the `ADMIN_EMAIL` env var. If set and a user with that email exists without the `admin` role, the system MUST grant the `admin` role. The operation MUST be idempotent. The system MUST log a message when the env var is missing AND when an admin is granted.

#### Scenario: ADMIN_EMAIL unset or user does not exist

- GIVEN `ADMIN_EMAIL` is unset OR no user with that email exists
- WHEN the application boots
- THEN the bootstrap is a no-op (or logs a warning) and no error is thrown

#### Scenario: ADMIN_EMAIL set, user promoted to admin

- GIVEN `ADMIN_EMAIL=admin@example.com` and a user with that email has `roles: ['user']`
- WHEN the application boots
- THEN the user is updated to include the `admin` role and the change is logged

#### Scenario: ADMIN_EMAIL set, user already admin is idempotent

- GIVEN `ADMIN_EMAIL=admin@example.com` and a user with that email has `roles: ['admin']`
- WHEN the application boots
- THEN the bootstrap is a no-op and no write occurs

### Requirement: Role Hierarchy in Endpoint Checks

The system MUST interpret the `admin > manager > user` hierarchy: a user holding a higher role satisfies any `@Roles()` annotation listing a lower role. The hierarchy MUST be evaluated by the `@common/auth` framework utility, not duplicated per endpoint.

#### Scenario: Higher role satisfies lower requirement

- GIVEN an authenticated user with role `admin` OR `manager`
- WHEN the user accesses an endpoint annotated `@Roles('user')`
- THEN the system returns 200

#### Scenario: User is rejected from admin-only endpoint

- GIVEN an authenticated user with role `user`
- WHEN the user accesses an endpoint annotated `@Roles('admin')`
- THEN the system returns 403
