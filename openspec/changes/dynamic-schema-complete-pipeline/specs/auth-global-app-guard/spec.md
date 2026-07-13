# Capability: auth-global-app-guard

## Purpose

Specifies the global `JwtAuthGuard` registration pattern: the NestJS `APP_GUARD` provider makes every controller authenticated by default, and individual routes opt out with the `@Public()` decorator or restrict further with `@Roles(...)` + `RolesGuard`. This is the first feature-module consumer of the pattern; the existing per-controller `@UseGuards(JwtAuthGuard, RolesGuard)` pattern remains valid for backward compatibility.

## Requirements

### Requirement: Global APP_GUARD Registration

`apps/nominas/src/app.module.ts` MUST register `AuthModule` in `imports` and MUST add `{ provide: APP_GUARD, useClass: JwtAuthGuard }` to `providers`. After this registration, every controller in the application is authenticated by default — any unauthenticated request that is NOT marked `@Public()` returns HTTP 401.

#### Scenario: Agent reads the global guard wiring

- GIVEN an agent reads `apps/nominas/src/app.module.ts`
- WHEN the agent searches for `APP_GUARD`
- THEN the provider SHALL be `{ provide: APP_GUARD, useClass: JwtAuthGuard }`
- AND `AuthModule` SHALL be in the `imports` array

#### Scenario: Agent sends an unauthenticated request to a protected route

- GIVEN the global guard is active and `DynamicSchemaController.compile` has no `@Public()` decorator
- WHEN an unauthenticated client calls `POST /dynamic-schema/compile`
- THEN the response SHALL be HTTP 401

#### Scenario: Agent sends a request with a valid JWT to a protected route

- GIVEN the global guard is active and a valid JWT
- WHEN the client calls `POST /dynamic-schema/compile` with the JWT
- THEN the request SHALL pass the guard
- AND the handler SHALL run (it MAY then return 403 if the role check fails)

### Requirement: `@Public()` Opt-Out

The `@Public()` decorator (from `@common/auth`) MUST cause `JwtAuthGuard` to skip authentication for the decorated route. The decorator is applied at the method level (or class level, to skip every route in the controller). The default behavior is authenticated; `@Public()` is the exception.

#### Scenario: Agent marks an endpoint public

- GIVEN `DynamicSchemaController.extract` is annotated `@Public()`
- WHEN an unauthenticated client calls `POST /dynamic-schema/extract`
- THEN the response SHALL be HTTP 200 or 4xx (NOT 401) — the guard is skipped

#### Scenario: Agent marks a controller class public

- GIVEN an entire controller is annotated `@Public()` at the class level
- WHEN any unauthenticated request hits any route on that controller
- THEN the guard SHALL be skipped for all routes in the controller

### Requirement: `@Roles()` and `RolesGuard`

The `@Roles('admin')` decorator (from `@common/auth`) MUST restrict a route to users whose roles include `'admin'` (or a higher role, per the role-hierarchy utility). The `RolesGuard` is applied via `{ provide: APP_GUARD, useClass: RolesGuard }` OR via a per-controller `@UseGuards(RolesGuard)` — both are valid. The order is: `JwtAuthGuard` runs first (authenticates), then `RolesGuard` (authorizes). If either fails, the request is rejected.

#### Scenario: Agent restricts a route to admins

- GIVEN `DynamicSchemaController.fullPipeline` is annotated `@Roles('admin')`
- WHEN an authenticated non-admin user calls `POST /dynamic-schema/pipeline`
- THEN the response SHALL be HTTP 403

#### Scenario: Agent restricts a route to admins and an admin calls it

- GIVEN `POST /dynamic-schema/pipeline` is annotated `@Roles('admin')` and an admin JWT is sent
- WHEN the admin calls the endpoint
- THEN the guard chain SHALL pass
- AND the handler SHALL run

#### Scenario: Role hierarchy lets a higher role satisfy a lower requirement

- GIVEN the `admin > manager > user` hierarchy is registered and a route is annotated `@Roles('user')`
- WHEN an authenticated user with role `'admin'` calls the route
- THEN the response SHALL be HTTP 200 (the higher role satisfies the lower requirement)

### Requirement: Backward Compatibility with Per-Controller Guards

The global `APP_GUARD` pattern MUST NOT break existing controllers that already use `@UseGuards(JwtAuthGuard, RolesGuard)` at the class level. Both guards MAY run on the same request — NestJS dedupes guard execution, so a controller with `@UseGuards(JwtAuthGuard)` and a global `JwtAuthGuard` SHALL NOT cause double-execution. Existing tests for `usuarios` MUST continue to pass after the global guard is added (the `usuarios` controller is already protected by its own `@UseGuards`).

#### Scenario: Existing controller still works with the global guard

- GIVEN `UsuariosController` has `@UseGuards(JwtAuthGuard, RolesGuard)` at the class level
- WHEN the global `JwtAuthGuard` is registered via `APP_GUARD`
- THEN `POST /usuarios` (which is `@Public()` at the method level) SHALL still be reachable without auth
- AND `GET /usuarios` SHALL still require admin or manager role

#### Scenario: Agent confirms the order of guards

- GIVEN both the global guard and a per-controller guard run on a request
- WHEN the agent inspects the execution order
- THEN `JwtAuthGuard` SHALL run before `RolesGuard`
- AND `req.user` SHALL be populated by the time `RolesGuard.canActivate` reads it

### Requirement: Documentation Cross-Reference

AGENTS.md MUST document the global `APP_GUARD` pattern as the recommended approach for new controllers. The doc MUST show:
- The `app.module.ts` snippet (one provider, one import).
- A controller example using `@UseGuards` + `@Roles()` for the role-restricted routes.
- A controller example using `@Public()` for the public routes.
- A note that existing per-controller `@UseGuards` patterns are still valid and are NOT removed by this change.

#### Scenario: Agent follows AGENTS.md to add a new protected route

- GIVEN the agent reads AGENTS.md
- WHEN the agent adds a new route to a controller
- THEN the doc SHALL show the recommended decorator stack (`@Roles('admin')` for admin-only, `@Public()` for triage, no decorator for "any authenticated user")

#### Scenario: Agent follows AGENTS.md to set up a new app

- GIVEN the agent copies the boilerplate to a new NestJS app
- WHEN the agent wires auth
- THEN the doc SHALL show that `app.module.ts` is the single place to register the global guard
- AND the doc SHALL state that no controller-level changes are required to opt in
