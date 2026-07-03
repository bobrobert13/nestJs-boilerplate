# Capability: usuarios-tests

## Purpose

The system MUST provide unit, controller-integration, and end-to-end test coverage for the `usuarios` module (DTO validation, service methods `assignRoles` and `grantAdminByEmail`, default-roles-on-create, repository `updateRoles`/`addRole`/`findRawByEmail`/`toPublic` legacy normalization, controller delegation, and the `onApplicationBootstrap` hook) so that the post-RBAC behavior is protected against regressions.

## ADDED Requirements

### Requirement: AssignRolesDto Validation Tests

The system MUST ship a spec file at `apps/nominas/src/modules/usuarios/__tests__/assign-roles.dto.spec.ts` containing at least 4 test cases that prove the DTO validation contract: a valid roles array passes; an empty array is rejected; an array containing an unknown role string is rejected; a non-array body is rejected.

#### Scenario: Valid roles array passes validation

- **GIVEN** an `AssignRolesDto` instance with `roles: [UsuarioRole.Manager]`
- **WHEN** the test runs `validateOrReject` from `class-validator`
- **THEN** the promise resolves (no rejection)

#### Scenario: Empty array is rejected

- **GIVEN** an `AssignRolesDto` instance with `roles: []`
- **WHEN** the test runs `validateOrReject`
- **THEN** the promise rejects with a `ArrayMinSize` constraint violation

#### Scenario: Unknown role string is rejected

- **GIVEN** an `AssignRolesDto` instance with `roles: ['superuser']`
- **WHEN** the test runs `validateOrReject`
- **THEN** the promise rejects with an `IsEnum` constraint violation

#### Scenario: Non-array body is rejected

- **GIVEN** a plain object `{ roles: 'admin' }` (string instead of array)
- **WHEN** the test runs `validateOrReject` on the assigned shape
- **THEN** the promise rejects with an `IsArray` constraint violation

### Requirement: UsuariosService.assignRoles Tests

The system MUST extend `apps/nominas/src/modules/usuarios/__tests__/usuarios.service.spec.ts` to cover `assignRoles` with at least 4 test cases: admin updates another user; self-modification is rejected with `ForbiddenException`; target not found throws `NotFoundException`; the repository's `updateRoles` is called with the correct arguments.

#### Scenario: Admin updates another user

- **GIVEN** a requesterId `A` and targetId `B` and `mockRepository.findOne` returns a user with `id: B`
- **WHEN** the test calls `service.assignRoles('B', [UsuarioRole.Manager], 'A')`
- **THEN** the return value is the result of `repository.updateRoles('B', ['manager'])`
- **AND** no `ForbiddenException` is thrown

#### Scenario: Self-modification is rejected

- **GIVEN** requesterId `A` and targetId `A` and `mockRepository.findOne` returns a user with `id: A`
- **WHEN** the test calls `service.assignRoles('A', [UsuarioRole.Manager], 'A')`
- **THEN** the promise rejects with `ForbiddenException`
- **AND** `repository.updateRoles` is NOT called

#### Scenario: Target not found throws NotFoundException

- **GIVEN** `mockRepository.findOne('B')` rejects with `NotFoundException`
- **WHEN** the test calls `service.assignRoles('B', [UsuarioRole.Manager], 'A')`
- **THEN** the promise rejects with `NotFoundException`
- **AND** `repository.updateRoles` is NOT called

#### Scenario: updateRoles is called with id and roles

- **GIVEN** a successful `findOne` for targetId `B` and a requesterId `A`
- **WHEN** the test calls `service.assignRoles('B', [UsuarioRole.Admin, UsuarioRole.Manager], 'A')`
- **THEN** `mockRepository.updateRoles` is called exactly once with `('B', ['admin', 'manager'])`

### Requirement: UsuariosService.grantAdminByEmail Tests

The system MUST extend `usuarios.service.spec.ts` to cover `grantAdminByEmail` with at least 4 test cases: `ADMIN_EMAIL` unset is a no-op (handler never invoked); user not found is a no-op (and logs a warning); user without admin is granted admin via `repository.addRole`; user already holding admin is a no-op (idempotent).

#### Scenario: ADMIN_EMAIL unset skips the lookup

- **GIVEN** `mockRepository.findRawByEmail` is observed
- **WHEN** the test calls `service.grantAdminByEmail(undefined)` (simulating missing env)
- **THEN** `findRawByEmail` is NOT called
- **AND** no exception is thrown

#### Scenario: User not found is a no-op

- **GIVEN** `mockRepository.findRawByEmail('missing@example.com')` resolves to `null`
- **WHEN** the test calls `service.grantAdminByEmail('missing@example.com')`
- **THEN** the call resolves without error
- **AND** `mockRepository.addRole` is NOT called

#### Scenario: User without admin is granted admin

- **GIVEN** `findRawByEmail('admin@example.com')` returns a raw doc with `roles: ['user']` and `_id: '64abc'`
- **WHEN** the test calls `service.grantAdminByEmail('admin@example.com')`
- **THEN** `mockRepository.addRole('64abc', UsuarioRole.Admin)` is called exactly once

#### Scenario: User already admin is a no-op

- **GIVEN** `findRawByEmail('admin@example.com')` returns a raw doc with `roles: ['admin']`
- **WHEN** the test calls `service.grantAdminByEmail('admin@example.com')`
- **THEN** `mockRepository.addRole` is NOT called (idempotent)

### Requirement: UsuariosService.create Default Role Tests

The system MUST extend `usuarios.service.spec.ts` to cover default-role behavior with at least 3 test cases: a create payload without `roles` results in a repository call with `roles: ['user']`; a payload with an empty `roles` array still results in `roles: ['user']`; a payload with explicit `roles` passes them through unchanged.

#### Scenario: Create without roles defaults to [user]

- **GIVEN** a `CreateUsuarioDto` with no `roles` field and `mockRepository.findByEmail` returns `null`
- **WHEN** the test calls `service.create(dto)`
- **THEN** `mockRepository.create` is called with an object whose `roles` is `['user']`

#### Scenario: Create with empty roles array defaults to [user]

- **GIVEN** a `CreateUsuarioDto` with `roles: []` and `findByEmail` returns `null`
- **WHEN** the test calls `service.create(dto)`
- **THEN** `mockRepository.create` is called with an object whose `roles` is `['user']`

#### Scenario: Create with explicit roles passes them through

- **GIVEN** a `CreateUsuarioDto` with `roles: [UsuarioRole.Admin]` and `findByEmail` returns `null`
- **WHEN** the test calls `service.create(dto)`
- **THEN** `mockRepository.create` is called with an object whose `roles` is `['admin']`

### Requirement: UsuariosRepository Tests

The system MUST extend `usuarios.repository.spec.ts` to cover at least 4 test cases: `updateRoles` calls `findByIdAndUpdate` with `{ roles }`; `toPublic` normalizes a legacy document without `roles` to `['user']`; `findRawByEmail` returns the raw document (no `toPublic` transformation); `addRole` uses `$addToSet` for idempotency.

#### Scenario: updateRoles calls findByIdAndUpdate with roles

- **GIVEN** `mockModel.findByIdAndUpdate` resolves to a doc with `roles: ['manager']`
- **WHEN** the test calls `repository.updateRoles('id-1', ['manager'])`
- **THEN** `findByIdAndUpdate` is called with `('id-1', { roles: ['manager'] }, { new: true })`

#### Scenario: toPublic normalizes legacy document without roles

- **GIVEN** a raw document `{ _id: 'id-1', nombre: 'X', apellido: 'Y', email: 'x@y.com', activo: true }` with NO `roles` field
- **WHEN** the test calls `repository.findOne('id-1')` and the mock returns that doc
- **THEN** the returned object's `roles` is `['user']` (not `undefined`)

#### Scenario: findRawByEmail returns the raw document

- **GIVEN** `mockModel.findOne` resolves to a doc with `roles: ['admin']`
- **WHEN** the test calls `repository.findRawByEmail('admin@example.com')`
- **THEN** the returned object is the raw doc (with `_id`, not a `toPublic` shape)

#### Scenario: addRole uses $addToSet

- **GIVEN** `mockModel.findByIdAndUpdate` resolves to a doc
- **WHEN** the test calls `repository.addRole('id-1', 'admin')`
- **THEN** `findByIdAndUpdate` is called with `('id-1', { $addToSet: { roles: 'admin' } }, { new: true })`

### Requirement: UsuariosController Tests

The system MUST extend `usuarios.controller.spec.ts` with at least 3 test cases: existing CRUD methods (regression) still call the service; `assignRoles` delegates to `service.assignRoles` with `id`, `dto.roles`, and `req.user.id`; a controller-integration test using `overrideGuard` proves the guard chain wires correctly.

#### Scenario: Existing CRUD methods still delegate

- **GIVEN** a controller with a mocked `UsuariosService`
- **WHEN** the test calls `controller.create(dto)`, `controller.findAll()`, `controller.findOne(id)`, `controller.update(id, dto)`, `controller.remove(id)`
- **THEN** the corresponding service methods are invoked exactly once with the correct arguments

#### Scenario: assignRoles delegates with id, roles, and requester id

- **GIVEN** a request with `req.user.id = 'A'` and a body `dto.roles = [UsuarioRole.Manager]`
- **WHEN** the test calls `controller.assignRoles('B', dto, req)`
- **THEN** `mockService.assignRoles` is called with `('B', [UsuarioRole.Manager], 'A')`

#### Scenario: Guard chain wires via overrideGuard

- **GIVEN** a `Test.createTestingModule` that includes `UsuariosController`, a mocked `UsuariosService`, and `JwtAuthGuard`/`RolesGuard` overridden with `useValue: { canActivate: () => true }`
- **WHEN** the test issues an HTTP request to `GET /usuarios`
- **THEN** the response status is 200 (or 201 for POST `/usuarios`)
- **AND** the corresponding service method is invoked (proving the controller and the guard chain are wired correctly)

### Requirement: UsuariosModule Bootstrap Tests

The system MUST ship a spec file at `apps/nominas/src/modules/usuarios/__tests__/usuarios.module.spec.ts` containing at least 4 test cases that prove the `onApplicationBootstrap` contract: `ADMIN_EMAIL` unset is a no-op and does not call the service; `ADMIN_EMAIL` set and user exists calls `service.grantAdminByEmail` with that email; the module does not throw when the service resolves with a no-op; the `RBAC_HIERARCHY` provider is registered as `UsuarioRoleHierarchy`.

#### Scenario: ADMIN_EMAIL unset skips service call

- **GIVEN** a `ConfigService` mock that returns `undefined` for `ADMIN_EMAIL`
- **WHEN** the module's `onApplicationBootstrap` is invoked
- **THEN** `mockService.grantAdminByEmail` is NOT called
- **AND** no exception is thrown

#### Scenario: ADMIN_EMAIL set invokes grantAdminByEmail

- **GIVEN** a `ConfigService` mock that returns `'admin@example.com'` for `ADMIN_EMAIL`
- **WHEN** `onApplicationBootstrap` is invoked
- **THEN** `mockService.grantAdminByEmail('admin@example.com')` is called exactly once

#### Scenario: Bootstrap tolerates service no-op

- **GIVEN** `grantAdminByEmail` resolves to `undefined` (user missing case)
- **WHEN** `onApplicationBootstrap` is invoked
- **THEN** the bootstrap promise resolves without throwing

#### Scenario: RBAC_HIERARCHY provider is registered

- **GIVEN** a compiled `TestingModule` for `UsuariosModule`
- **WHEN** the test resolves the `RBAC_HIERARCHY` token from the module's container
- **THEN** the resolved value equals `UsuarioRoleHierarchy`
- **AND** it has `admin: 3`, `manager: 2`, `user: 1`

### Requirement: Usuarios E2E Validation Test

The system MUST ship an E2E spec file at `apps/nominas/test/usuarios.e2e-spec.ts` containing at least 1 test case that proves `PATCH /usuarios/:id/roles` with an invalid role returns HTTP 400 from the global `ValidationPipe`.

#### Scenario: Invalid role returns 400 from ValidationPipe

- **GIVEN** a running Nest application via `Test.createTestingModule(...).compile()` with the global `ValidationPipe` registered (matching `main.ts`)
- **WHEN** the test sends a PATCH to `/usuarios/<any-id>/roles` with body `{ "roles": ["superuser"] }`
- **THEN** the response status is 400
- **AND** the response body contains a validation error message identifying the `roles` field
