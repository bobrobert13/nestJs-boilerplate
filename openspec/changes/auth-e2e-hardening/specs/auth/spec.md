# Auth Specification — Delta: E2E Hardening

> Delta spec for change `auth-e2e-hardening`. Merges into
> `openspec/specs/auth/spec.md` on archive.

## Purpose

Extiende la spec de auth con requisitos de E2E testing, gate del demo stub,
y validación de refresh token rotation.

Documentación asociada: `packages/auth/README.md`,
`apps/nominas/test/auth.e2e-spec.ts`

## New Requirements

### Demo Stub Gate

The system MUST gate the built-in demo stub (`demo@example.com / demo123`)
behind the `AUTH_DEMO_MODE` environment variable.

#### Scenario: Demo mode disabled (default)

- GIVEN `AUTH_DEMO_MODE` is not set or is `false`
- AND no `IUserService` provider is wired
- WHEN `authService.validateUser('demo@example.com', 'demo123')` is called
- THEN the system returns `null` (authentication fails)
- AND logs an ERROR: "No IUserService wired and AUTH_DEMO_MODE is disabled"

#### Scenario: Demo mode enabled

- GIVEN `AUTH_DEMO_MODE=true`
- AND no `IUserService` provider is wired
- WHEN `authService.validateUser('demo@example.com', 'demo123')` is called
- THEN the system returns `{ id: 'demo-user-id', email: 'demo@example.com', roles: ['user'] }`

#### Scenario: Real IUserService takes precedence

- GIVEN an `IUserService` provider is wired (e.g. `UsuariosService`)
- AND `AUTH_DEMO_MODE=true`
- WHEN `authService.validateUser('demo@example.com', 'demo123')` is called
- THEN the system delegates to `userService.findByEmail()` (demo stub is NOT consulted)

#### Scenario: Bootstrap warning for demo mode

- GIVEN `AUTH_DEMO_MODE=true`
- WHEN the application starts
- THEN `BootstrapLogger` emits a WARNING: "Auth demo mode is ACTIVE — do not use in production"

### Auth E2E Flow

The system MUST validate the complete authentication flow via E2E tests.

#### Scenario: Register → Login → Protected route

- GIVEN a fresh test app with ephemeral MongoDB
- WHEN a user POSTs to `/api/auth/register` with `{ email, password, name }`
- AND then POSTs to `/api/auth/login` with the same credentials
- AND then GETs `/api/usuarios` with the returned `accessToken`
- THEN register returns 201 with user data (no password)
- AND login returns 200 with `{ accessToken, refreshToken, expiresIn }`
- AND the protected route returns 200 with the usuarios list

#### Scenario: Login with wrong password

- GIVEN a registered user
- WHEN POSTing to `/api/auth/login` with wrong password
- THEN the system returns 401 Unauthorized
- AND the response body does NOT reveal whether the email exists

#### Scenario: Access protected route without token

- GIVEN no authentication token
- WHEN GETting `/api/usuarios`
- THEN the system returns 401 Unauthorized

#### Scenario: Access protected route with expired token

- GIVEN an expired JWT access token
- WHEN GETting `/api/usuarios` with the expired token
- THEN the system returns 401 Unauthorized

### Refresh Token Rotation

The system MUST invalidate the previous refresh token when a new one is
issued (token rotation).

#### Scenario: Refresh token rotation

- GIVEN a valid refresh token from login
- WHEN POSTing to `/api/auth/refresh` with the refresh token
- THEN the system returns a new `{ accessToken, refreshToken }`
- AND the old refresh token is invalidated in MongoDB

#### Scenario: Reuse of rotated refresh token

- GIVEN a refresh token that was already rotated
- WHEN POSTing to `/api/auth/refresh` with the old token
- THEN the system returns 401 Unauthorized

#### Scenario: Logout invalidates refresh token

- GIVEN a valid refresh token
- WHEN POSTing to `/api/auth/logout` with the refresh token
- THEN the refresh token is deleted from MongoDB
- AND subsequent refresh attempts with that token return 401

### 2FA E2E Flow

The system SHOULD validate the two-factor authentication flow via E2E tests.

#### Scenario: 2FA setup and verify

- GIVEN an authenticated user
- WHEN POSTing to `/api/auth/2fa/setup`
- THEN the system returns a TOTP secret and QR code URL
- WHEN POSTing to `/api/auth/2fa/verify` with a valid TOTP code
- THEN 2FA is enabled for the user

#### Scenario: Login with 2FA enabled

- GIVEN a user with 2FA enabled
- WHEN POSTing to `/api/auth/login` with valid credentials
- THEN the system returns a partial response indicating 2FA is required
- WHEN POSTing to `/api/auth/2fa/verify-login` with a valid TOTP code
- THEN the system returns the full `{ accessToken, refreshToken }`

### Magic Link E2E Flow

The system SHOULD validate the magic link flow via E2E tests with a mocked
email provider.

#### Scenario: Request magic link

- GIVEN `MAGIC_LINK_ENABLED=true`
- WHEN POSTing to `/api/auth/magic-link` with `{ email }`
- THEN the system returns 200 with a generic message (no token in response)
- AND the magic link token is stored in MongoDB

#### Scenario: Verify magic link

- GIVEN a valid magic link token
- WHEN GETting `/api/auth/magic-link/verify?token=<token>`
- THEN the system returns `{ accessToken, refreshToken }`
- AND the token is invalidated

## Affected Documentation

| Document | Change |
|----------|--------|
| `packages/auth/README.md` | Add "E2E Testing" section + `AUTH_DEMO_MODE` docs |
| `AGENTS.md` §6 | Add `AUTH_DEMO_MODE` to env vars reference |
| `AGENTS.md` §12 | Update Issue #1: "Auth es stub" → "Gateado con AUTH_DEMO_MODE" |
| `apps/nominas/test/` | New E2E test files with `.llm-context.md` |
