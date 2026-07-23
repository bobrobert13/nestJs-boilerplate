# Proposal: Testing Coverage & CI/CD Pipeline

## Why

El boilerplate tiene **22 suites / 130 tests pasando**, pero la cobertura es
asimétrica: los paquetes de autenticación, common y módulos de app están
cubiertos, mientras que **6 paquetes `@common/*` tienen 0 tests unitarios**:

| Package | Tests actuales | Riesgo |
|---------|---------------|--------|
| `@common/database` | 0 | Transacciones, retry logic, conexión |
| `@common/ai` | 0 | Multi-provider, structured output, vision |
| `@common/http` | 0 | HTTP client, download service |
| `@common/documents` | 0 | PDF/DOCX extraction |
| `@common/resend` | 0 | Email sending, newsletter |
| `@common/serve-static` | 0 | EJS rendering, caching |

Además, **no existe pipeline CI/CD**: no hay `.github/workflows/`,
`.gitlab-ci.yml` ni `Jenkinsfile`. Los errores llegan a producción sin
validación automatizada de lint, tests ni build.

### Impacto

- **Sin tests en `@common/database`**: un cambio en retry logic o transacciones
  puede romper silenciosamente la persistencia de datos.
- **Sin tests en `@common/ai`**: un cambio en la serialización multi-provider
  puede romper la generación de schemas dinámicos.
- **Sin CI/CD**: un PR con errores de TypeScript o tests rotos se mergea sin
  detección automática.
- **Sin E2E**: no hay validación de flujos completos (HTTP → controller →
  service → repository → MongoDB → response).

## What Changes

1. **Crear spec OpenSpec** para el dominio `testing` (nuevo dominio que
   documenta la estrategia de testing del proyecto).
2. **Tests unitarios** para los 6 paquetes `@common/*` sin cobertura:
   - `@common/database`: DatabaseService, TransactionManager, retry logic
   - `@common/ai`: AiService (chat, generateSchema, embeddings), providers
   - `@common/http`: HttpClient, DownloadService
   - `@common/documents`: DocumentProcessor (PDF, DOCX)
   - `@common/resend`: ResendService, NewsletterService
   - `@common/serve-static`: ServeStaticService (render, cache)
3. **Infraestructura E2E** con Supertest + Testcontainers:
   - MongoDB efímero (ReplicaSet) para tests de integración
   - Helper `createTestApp()` que levanta el AppModule completo
   - Tests E2E para health, usuarios CRUD, auth flow
4. **Pipeline CI/CD** (GitHub Actions):
   - Job `lint`: ESLint + Prettier check
   - Job `test`: Jest unit tests con coverage
   - Job `build`: `npm run build`
   - Job `e2e`: Tests E2E con MongoDB en Docker
   - Trigger: push a `main` + pull requests
5. **Documentación AI-friendly**:
   - Actualizar AGENTS.md §4 (matriz de paquetes: Tests ⚠️→✅)
   - Actualizar AGENTS.md §12 (dashboard)
   - Actualizar AGENTS.md §14 (Cognitive Ranking con tests)
   - `.llm-context.md` en archivos de test nuevos

## Affected Packages

| Package | Tipo de cambio |
|---------|---------------|
| `@common/database` | Nuevos tests unitarios |
| `@common/ai` | Nuevos tests unitarios |
| `@common/http` | Nuevos tests unitarios |
| `@common/documents` | Nuevos tests unitarios |
| `@common/resend` | Nuevos tests unitarios |
| `@common/serve-static` | Nuevos tests unitarios |
| `apps/nominas` | Tests E2E + infra |
| `root` | GitHub Actions workflow |

## Rollback Plan

- **Tests**: son aditivos, no modifican código de producción. Eliminar los
  archivos `.spec.ts` revierte el cambio sin impacto.
- **CI/CD**: eliminar `.github/workflows/ci.yml` desactiva el pipeline.
- **Flag**: no se necesita feature flag — los tests no afectan runtime.

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Tests frágiles por timing (retry, timeouts) | Media | Usar `jest.useFakeTimers()` |
| Testcontainers lento en CI | Media | Cache de Docker layers en GitHub Actions |
| Mocks desactualizados vs implementación | Baja | Revisar en cada PR que toca el paquete |
| E2E requiere MongoDB ReplicaSet | Baja | Testcontainers con `mongo:7.0 --replSet rs0` |
