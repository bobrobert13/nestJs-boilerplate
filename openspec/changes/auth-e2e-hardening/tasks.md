# Tasks: Auth E2E Hardening

## Phase 0 — Demo stub gate

- [ ] 0.1 Agregar `AUTH_DEMO_MODE` a `apps/nominas/src/config/env.validation.ts`
  - Tipo: boolean opcional, default `false`
  - Transform: `'true'` → `true`, cualquier otro → `false`
- [ ] 0.2 Agregar `AUTH_DEMO_MODE=true` a `.env.example` (dev convenience)
- [ ] 0.3 Refactor `packages/auth/src/services/auth.service.ts`:
  - Agregar método privado `isDemoModeEnabled(): boolean`
  - En `validateUser()`: gatear demo stub con `isDemoModeEnabled()`
  - Si no hay IUserService y demo mode desactivado: log ERROR + return null
  - En `register()`: gatear demo stub con `isDemoModeEnabled()`
- [ ] 0.4 Agregar warning en `apps/nominas/src/app.module.ts` `onApplicationBootstrap()`:
  - Si `AUTH_DEMO_MODE=true`: `BootstrapLogger.warn('Auth demo mode ACTIVE')`
- [ ] 0.5 Actualizar tests unitarios existentes de `auth.service.spec.ts`:
  - Test: demo mode disabled → validateUser retorna null
  - Test: demo mode enabled → validateUser retorna demo user
  - Test: IUserService tiene precedencia sobre demo mode
- [ ] 0.6 Verificar: `npm run test -- packages/auth` pasa

## Phase 1 — E2E infrastructure

- [ ] 1.1 Crear `apps/nominas/test/utils.ts`:
  - `createTestApp()`: MongoMemoryReplSet + AppModule + Supertest
  - `teardownTestApp()`: cierra app + detiene MongoDB
  - `testUser()`: genera datos de usuario únicos
  - `registerAndLogin()`: helper register + login en un call
- [ ] 1.2 Crear `apps/nominas/test/utils.llm-context.md`
- [ ] 1.3 Verificar: `createTestApp()` levanta y cierra sin errores

## Phase 2 — E2E tests: Auth flow

- [ ] 2.1 Crear `apps/nominas/test/auth.e2e-spec.ts`:
  - Test: POST /api/auth/register → 201 + user data (sin password)
  - Test: POST /api/auth/register duplicado → 201 (email enumeration prevention)
  - Test: POST /api/auth/login con credenciales válidas → 200 + tokens
  - Test: POST /api/auth/login con password incorrecta → 401
  - Test: GET /api/usuarios con accessToken → 200
  - Test: GET /api/usuarios sin token → 401
  - Test: GET /api/usuarios con token expirado → 401
- [ ] 2.2 Crear `apps/nominas/test/auth.e2e-spec.llm-context.md`
- [ ] 2.3 Verificar: `npm run test:e2e -- auth.e2e-spec` pasa

## Phase 3 — E2E tests: Refresh token rotation

- [ ] 3.1 Agregar a `apps/nominas/test/auth.e2e-spec.ts`:
  - Test: POST /api/auth/refresh con token válido → 200 + nuevos tokens
  - Test: POST /api/auth/refresh con token rotado → 401
  - Test: POST /api/auth/logout invalida refresh token → 200
  - Test: POST /api/auth/refresh tras logout → 401
- [ ] 3.2 Verificar: tests de refresh pasan

## Phase 4 — E2E tests: 2FA flow

- [ ] 4.1 Crear `apps/nominas/test/auth-2fa.e2e-spec.ts`:
  - Test: POST /api/auth/2fa/setup (autenticado) → 200 + secret + QR URL
  - Test: POST /api/auth/2fa/verify con código TOTP válido → 200
  - Test: POST /api/auth/login con 2FA activo → respuesta parcial (2FA required)
  - Test: POST /api/auth/2fa/verify-login con código válido → 200 + tokens
  - Test: POST /api/auth/2fa/verify-login con código inválido → 401
- [ ] 4.2 Crear `apps/nominas/test/auth-2fa.e2e-spec.llm-context.md`
- [ ] 4.3 Verificar: `npm run test:e2e -- auth-2fa.e2e-spec` pasa

## Phase 5 — E2E tests: Magic link

- [ ] 5.1 Crear `apps/nominas/test/auth-magic-link.e2e-spec.ts`:
  - Test: POST /api/auth/magic-link → 200 + mensaje genérico (sin token en body)
  - Test: GET /api/auth/magic-link/verify?token=<valid> → 200 + tokens
  - Test: GET /api/auth/magic-link/verify?token=<invalid> → 401
  - Test: token ya usado → 401
- [ ] 5.2 Mock de ResendService en E2E (no enviar emails reales)
- [ ] 5.3 Crear `apps/nominas/test/auth-magic-link.e2e-spec.llm-context.md`
- [ ] 5.4 Verificar: `npm run test:e2e -- auth-magic-link.e2e-spec` pasa

## Phase 6 — Documentación

- [ ] 6.1 Actualizar `packages/auth/README.md`:
  - Sección "AUTH_DEMO_MODE" con tabla de comportamiento
  - Sección "E2E Testing" con comandos y estructura de archivos
- [ ] 6.2 Actualizar `AGENTS.md` §6: agregar `AUTH_DEMO_MODE` a env vars
- [ ] 6.3 Actualizar `AGENTS.md` §12: Issue #1 "Auth es stub" → "Gateado con AUTH_DEMO_MODE"
- [ ] 6.4 Actualizar `AGENTS.md` §12: agregar `auth-e2e-hardening` al dashboard
- [ ] 6.5 Cross-indexing: spec ↔ README ↔ código ↔ tests en cada archivo
- [ ] 6.6 `npm run build` pasa sin errores
- [ ] 6.7 `npm run lint` pasa sin errores
- [ ] 6.8 `npm run test` pasa (todas las suites)
- [ ] 6.9 `npm run test:e2e` pasa (todos los E2E tests)
