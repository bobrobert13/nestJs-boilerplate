# Proposal: Auth E2E Hardening

## Why

El módulo `@common/auth` tiene **tests unitarios** (auth.service.spec.ts,
jwt.strategy.spec.ts, magic-link.service.spec.ts, two-factor tests), pero
**carece de tests E2E** que validen el flujo completo de autenticación a
través de HTTP.

### Estado actual (verificado en código)

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| `IUserService` implementado | ✅ | `UsuariosService implements IUserService` |
| Cableado via DI | ✅ | `{ provide: USER_SERVICE, useExisting: UsuariosService }` |
| Demo stub | ⚠️ Activo como fallback | `if (email === 'demo@example.com')` en `auth.service.ts:93` |
| Refresh tokens en MongoDB | ✅ | `MongoRefreshTokenStore` + `RefreshToken` schema |
| Rate limiting | ✅ | `ThrottlerGuard` global via `APP_GUARD` |
| Tests unitarios | ✅ | 8 spec files en `packages/auth/src/` |
| **Tests E2E** | ❌ | **Ninguno** |
| **Demo stub gateado** | ❌ | **Siempre activo si no hay IUserService** |

### Problemas concretos

1. **Demo stub sin gate**: si un consumidor olvida cablear `IUserService`,
   el fallback `demo@example.com / demo123` queda activo en producción.
   No hay warning en logs ni flag para desactivarlo.

2. **Sin validación E2E del flujo auth**: register → login → access token →
   protected route → refresh → logout no está probado end-to-end. Los tests
   unitarios mockean todo, así que un error de wiring DI o de middleware
   (Helmet, CORS, guards) no se detecta.

3. **Refresh token rotation no validado E2E**: el `MongoRefreshTokenStore`
   implementa rotación (invalida el token anterior al refrescar), pero esto
   solo se prueba con mocks.

4. **2FA/TOTP sin E2E**: el flujo setup → verify → login-with-2fa no está
   validado a nivel HTTP.

## What Changes

1. **Delta spec** para `openspec/specs/auth/spec.md`:
   - Requisito: demo stub MUST estar gateado por `AUTH_DEMO_MODE=true`
   - Requisito: flujo auth completo MUST estar cubierto por E2E tests
   - Requisito: refresh token rotation MUST invalidar tokens anteriores
   - Escenarios Given/When/Then para cada flujo

2. **Gate del demo stub**:
   - Nueva env var `AUTH_DEMO_MODE` (default: `false`)
   - Si `false` y no hay `IUserService` → log ERROR + `validateUser` retorna
     `null` siempre (no hay fallback)
   - Si `true` → comportamiento actual (demo@example.com / demo123)
   - Warning en BootstrapLogger si demo mode está activo

3. **E2E tests** (`apps/nominas/test/`):
   - `auth.e2e-spec.ts`: register → login → protected → refresh → logout
   - `auth-2fa.e2e-spec.ts`: setup → verify → login-with-code
   - `auth-magic-link.e2e-spec.ts`: request → verify (con mock de Resend)
   - `usuarios.e2e-spec.ts`: CRUD completo con auth

4. **Infraestructura E2E**:
   - Helper `createTestApp()` en `apps/nominas/test/utils.ts`
   - MongoDB efímero via Testcontainers (ReplicaSet para refresh tokens)
   - Override de `RESEND_API_KEY` con mock

5. **Documentación AI-friendly**:
   - Actualizar `packages/auth/README.md` con sección E2E testing
   - Actualizar AGENTS.md §12 (Issue #1 "Auth es stub" → resuelto)
   - `.llm-context.md` en archivos E2E nuevos
   - Cross-indexing: spec ↔ README ↔ código ↔ tests

## Affected Packages

| Package | Tipo de cambio |
|---------|---------------|
| `@common/auth` | Gate demo stub + E2E tests |
| `apps/nominas` | E2E infrastructure + test files |
| `root` | Env var `AUTH_DEMO_MODE` en validación |

## Rollback Plan

- **Demo stub gate**: `AUTH_DEMO_MODE=true` restaura el comportamiento
  anterior. El cambio es backwards-compatible por defecto en desarrollo.
- **E2E tests**: son aditivos. Eliminar los archivos `.e2e-spec.ts` revierte.
- **Flag**: `AUTH_DEMO_MODE` es la única env var nueva. Default `false`
  es más seguro que el estado actual.

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| E2E tests lentos (MongoDB startup) | Media | Testcontainers con cache + `--replSet rs0` |
| Demo mode desactivado rompe DX local | Baja | Default `true` en `.env.example` |
| Refresh token rotation requiere ReplicaSet | Baja | Testcontainers configura rs0 automáticamente |
| Resend mock no cubre edge cases de email | Baja | E2E de magic link usa mock, unit tests cubren lógica |
