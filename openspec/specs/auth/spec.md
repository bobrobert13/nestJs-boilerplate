# Auth Specification

## Purpose

Módulo de autenticación multifactor: JWT, Magic Link, OAuth (placeholder), 2FA/TOTP, Passkeys/WebAuthn.

Documentación asociada: `packages/auth/README.md`, `packages/auth/src/two-factor/README.md`

## Requirements

### JWT Authentication

The system MUST authenticate users via JWT access + refresh tokens.

#### Scenario: Login with valid credentials

- GIVEN a registered user with email and password
- WHEN the user POSTs to `/api/auth/login` with valid credentials
- THEN the system returns access token, refresh token, and user data

#### Scenario: Access protected route

- GIVEN a valid JWT access token
- WHEN the user GETs a route with `@UseGuards(JwtAuthGuard)`
- THEN the system returns the protected resource

#### Scenario: Expired token rejected

- GIVEN an expired JWT access token
- WHEN the user accesses a protected route
- THEN the system returns 401 Unauthorized

### Public Routes

The system MUST allow marking routes as public via `@Public()` decorator.

#### Scenario: Public route accessible without token

- GIVEN no authentication token
- WHEN accessing a route decorated with `@Public()`
- THEN the system returns the resource without authentication

### Role-Based Access

The system MUST restrict routes by role via `@Roles()` decorator + `RolesGuard`.

#### Scenario: Admin-only route

- GIVEN a user with role "admin"
- WHEN accessing a route with `@Roles('admin')`
- THEN the system grants access

#### Scenario: Non-admin user rejected

- GIVEN a user without role "admin"
- WHEN accessing a route with `@Roles('admin')`
- THEN the system returns 403 Forbidden

### Password Hashing (Argon2)

The system MUST hash passwords using argon2id (NOT bcrypt).

#### Scenario: Hash and verify password

- GIVEN a plain text password
- WHEN `authService.hashPassword(password)` is called
- THEN the system returns an argon2id hash compatible with `authService.comparePassword()`

#### Scenario: Wrong password rejected

- GIVEN a password hash from argon2id
- WHEN `authService.comparePassword(wrongPassword, hash)` is called
- THEN the system returns false

### Magic Link

The system MAY provide passwordless login via time-limited magic links.

#### Scenario: Request and verify magic link

- GIVEN a registered email
- WHEN requesting a magic link via POST `/api/auth/magic-link/request`
- THEN the system generates a time-limited token (default 300s)
- WHEN verifying via POST `/api/auth/magic-link/verify`
- THEN the system authenticates the user

### Two-Factor (2FA) TOTP

The system SHOULD provide TOTP-based two-factor authentication with backup codes.

Documentación asociada: `packages/auth/src/two-factor/README.md`

#### Scenario: Generate 2FA secret

- GIVEN an authenticated user
- WHEN POST `/api/auth/2fa/generate`
- THEN the system returns QR code and backup codes

#### Scenario: Enable 2FA with valid code

- GIVEN a generated 2FA secret
- WHEN POST `/api/auth/2fa/enable` with valid TOTP code
- THEN the system enables 2FA for the user

### Passkeys (WebAuthn)

The system SHOULD provide passwordless authentication via WebAuthn hardware biometrics.

#### Scenario: Register passkey

- GIVEN an authenticated user
- WHEN POST `/api/auth/passkeys/register-options`
- THEN the system returns WebAuthn registration options
- WHEN POST `/api/auth/passkeys/register-verify` with authenticator response
- THEN the system registers the passkey

#### Scenario: Login with passkey

- GIVEN a user with registered passkeys
- WHEN POST `/api/auth/passkeys/login-options`
- THEN the system returns authentication options
- WHEN POST `/api/auth/passkeys/login-verify` with authenticator response
- THEN the system authenticates the user

## Current Status

⚠️ **Stub**: The auth module currently uses a hardcoded demo user (`demo@example.com` / `demo123`). No persistence layer is connected. This is documented but NOT suitable for production without implementing a real UserService.

## Affected Documentation

- `packages/auth/README.md`
- `packages/auth/src/two-factor/README.md`
- `AGENTS.md` — section 3 (Packages Index)
