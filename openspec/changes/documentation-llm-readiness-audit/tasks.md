# Tasks: Documentation LLM-Readiness Audit

> Checklist implementación. Marcar con [x] al completar.
> Cada tarea debe ser completable en sesión única (regla OpenSpec).

---

## 1. Fase de Preparación (Infraestructura)

### 1.1 — Crear script de auditoría de cobertura [COMPLETADO]

- [ ] Crear `scripts/audit-docs.js`
  - Recorrer `packages/*/src/**/*.ts` y `apps/*/src/**/*.ts`
  - Detectar exports públicos sin JSDoc (usando `typescript` API)
  - Generar reporte: archivo → método → razón
  - Output: tabla markdown + exit code 1 si cobertura <80%
- [ ] Agregar script en `package.json`: `"audit:docs": "node scripts/audit-docs.js"`
- [ ] Documentar en `docs/COVERAGE.md` (template inicial)

### 1.2 — Crear regla ESLint custom [COMPLETADO]

- [ ] Crear `eslint-rules/require-public-jsdoc.js`
  - Detectar `MethodDefinition` con `accessibility === ''public''`
  - Verificar bloque JSDoc inmediatamente arriba
  - Reportar `missingJsdoc` con nombre del método
- [ ] Registrar en `eslint.config.mjs` como plugin local
- [ ] Aplicar a `packages/*/src/**/*.ts` y `apps/*/src/**/*.ts`
- [ ] Configurar como `warn` inicialmente (no rompe build)

### 1.3 — Crear generador de `.llm-context.md` [COMPLETADO]

- [ ] Crear `scripts/generate-llm-context.js`
  - Para cada archivo `.ts` analizado, extraer:
    - Propósito (primer comentario de bloque)
    - Dependencias (constructor params)
    - Errores lanzados (throw statements)
  - Generar `<archivo>.llm-context.md` adyacente
  - Skip si ya existe y es más nuevo que el .ts
- [ ] Agregar script: `"docs:context": "node scripts/generate-llm-context.js"`

---

## 2. Expansión de Specs OpenSpec (Documentación)

### 2.1 — Crear spec para `@common/common` (NUEVO) ✅

- [x] Crear `openspec/specs/common/spec.md`  → **544 palabras, 11 escenarios** (superan target)
  - Escenario: `BaseAdapter.adapt()` con datos crudos ✅
  - Escenario: `BaseAdapter.adapt()` con array ✅
  - Escenario: `DatabaseExceptionFilter` mapea MongoDB error 11000 → 409 ✅
  - Escenario: `DatabaseExceptionFilter` mapea error 14 → 503 ✅
  - Escenario: `HttpError(404)` se lanza correctamente ✅
  - Escenario: `createHttpError()` factory funciona ✅
  - Bonus: notación completa de subclases HttpError + factory fallback

### 2.2 — Expandir `openspec/specs/http/spec.md` ✅

- [x] Reescrito completo: **627 palabras, 14 escenarios**
  - GET/POST/PUT/PATCH/DELETE scenarios ✅
  - Error mapping axios → HttpError (3 variantes) ✅
  - DownloadService, BaseURL, Timeouts, responseType ✅

### 2.3 — Expandir `openspec/specs/playwright/spec.md` ✅

- [x] Reescrito completo: **696 palabras, 16 escenarios**
  - `waitForSelector()` con timeout custom ✅
  - `close()` re-inicializa browser ✅
  - Lifecycle de página (single page per context) ✅
  - Bonus: configuración (headless, viewport, userAgent, chromium path), event listeners NestJS

### 2.4 — Crear spec transversal de documentación ✅

- [x] Crear `openspec/specs/documentation/spec.md` → **769 palabras, 15 escenarios**
  - Escenario: Todo package tiene README.md ✅
  - Escenario: Todo export público tiene JSDoc ✅
  - Escenario: Specs OpenSpec existen para cada package ✅
  - Escenario: `npm run audit:docs` pasa con ≥80% ✅
  - Escenario: ESLint custom rule no falla ✅
  - Bonus: lint rule promotion warn → error, .llm-context.md generation

### 2.5 (extra) — Expandir specs preexistentes delgados ✅

- [x] `database/spec.md` → **403 palabras, 9 escenarios** (era 228/5)
- [x] `documents/spec.md` → **422 palabras, 8 escenarios** (era 211/4)
- [x] `inngest/spec.md` → **466 palabras, 11 escenarios** (era 185/4)
- [x] `serve-static/spec.md` → **615 palabras, 14 escenarios** (era 272/6)

### 2.6 — Validación final de specs ✅

- [x] Todos los 11 specs cumplen: ≥300 palabras + ≥5 escenarios
- [x] Coherencia verificada con código real de cada paquete (no specs aspiracionales)

---

## 3. JSDoc Asistida por Paquete (Implementación)

### 3.1 [COMPLETADO playwright] — `@common/auth`

- [ ] Documentar `AuthService` (métodos: `validateUser`, `login`, `refreshTokens`, `hashPassword`, `comparePassword`)
- [ ] Documentar `JwtStrategy` y `LocalStrategy`
- [ ] Documentar guards: `JwtAuthGuard`, `RolesGuard`
- [ ] Documentar decoradores: `Public`, `Roles`
- [ ] Documentar `MagicLinkService`
- [ ] Documentar `TwoFactorService` (sub-paquete `two-factor/`)
- [ ] Documentar `PasskeysService` (sub-paquete `passkeys/`)
- [ ] Cambiar status tag de `partial` a `complete`
- [ ] Verificar: `npm run audit:docs` para este paquete ≥80%

### 3.2 — `@common/ai`

- [ ] Documentar `AiService` (métodos: `chat`, `generateText`, `generateSchema`, `generateTemplate`, `registerProvider`, `createEmbedding`)
- [ ] Documentar providers preconfigurados (openai, anthropic, google, moonshot, minimax)
- [ ] Documentar interface `ChatMessage` y `AIResponse`
- [ ] Cambiar status tag a `complete`
- [ ] Verificar cobertura

### 3.3 — `@common/database`

- [ ] Documentar `DatabaseService` (métodos: `connect`, `disconnect`, retry logic)
- [ ] Documentar `TransactionService.withTransaction()`
- [ ] Documentar decorador `@Transactional()`
- [ ] Documentar config factory
- [ ] Cambiar status tag a `complete`
- [ ] Verificar cobertura

### 3.4 — `@common/inngest`

- [ ] Ya está en `complete` — verificar que el JSDoc existente sigue la convención
- [ ] Si falta alguno, agregar (sin romper tests existentes)
- [ ] No cambiar status tag

### 3.5 — `@common/common`

- [ ] Documentar interface `BaseAdapter<T>`
- [ ] Documentar interface `DataMapping`
- [ ] Documentar `DatabaseExceptionFilter` (método `catch`)
- [ ] Documentar clase `HttpError` y subclases (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `InternalServerError`)
- [ ] Documentar factory `createHttpError()`
- [ ] Cambiar status tag a `complete`

### 3.6 — `@common/playwright`

- [ ] Documentar `PlaywrightService` (métodos: `createPage`, `waitForSelector`, `close`, `initialize`)
- [ ] Documentar config options
- [ ] Documentar lifecycle hooks (`onModuleInit`, `onModuleDestroy`)
- [ ] Cambiar status tag a `complete`

### 3.7 — `@common/http`

- [ ] Documentar `HttpService` (métodos: `get`, `post`, `put`, `patch`, `delete`)
- [ ] Documentar `DownloadService` (métodos: `file`, `image`)
- [ ] Documentar `ImageOptimizationOptions`
- [ ] Cambiar status tag a `complete`

### 3.8 — `@common/documents`

- [ ] Documentar `DocumentProcessorService.extract()`
- [ ] Documentar `PdfService.parse()`
- [ ] Documentar `DocxService.parse()`
- [ ] Documentar interface `ParserInterface`
- [ ] Documentar `DOCUMENT_ERROR_CODES`
- [ ] Cambiar status tag a `complete`

### 3.9 — `@common/resend`

- [ ] Documentar `ResendService.sendEmail()` y `sendEmailWithTemplate()`
- [ ] Documentar `NewsletterService` (subscribe, unsubscribe, list, sendNewsletter)
- [ ] Documentar interfaces `EmailOptions`, `Subscriber`
- [ ] Cambiar status tag a `complete`

### 3.10 — `@common/serve-static`

- [ ] Documentar `ServeStaticService` (métodos: `render`, `renderString`, `getPages`, `getPartials`, `clearTemplateCache`)
- [ ] Documentar `RenderOptions`
- [ ] Cambiar status tag a `complete`

---

## 4. Documentación de Aplicación (`apps/nominas/`)

### 4.1 [COMPLETADO] — Módulo `usuarios`

- [ ] Crear `apps/nominas/src/modules/usuarios/README.md`
  - Propósito: CRUD ejemplo con Repository pattern
  - Endpoints Swagger
  - Schema Mongoose (`Usuario`)
  - DTOs (`CreateUsuarioDto`, `UpdateUsuarioDto`)
  - Flujo de soft-delete
- [ ] Crear `apps/nominas/src/modules/usuarios/.llm-context.md`
- [ ] Documentar JSDoc de `UsuariosService` (5 métodos principales)
- [ ] Documentar JSDoc de `UsuariosController` (6 endpoints)
- [ ] Documentar JSDoc de `UsuariosRepository`
- [ ] Documentar JSDoc de schema `Usuario`

### 4.2 [COMPLETADO] — Módulo `dynamic-schema`

- [ ] Crear `apps/nominas/src/modules/dynamic-schema/README.md`
  - Propósito: Generar schemas Mongoose con AI
  - Integración con `@common/ai` y `@common/documents`
- [ ] Crear `.llm-context.md`
- [ ] Documentar JSDoc de servicios

### 4.3 [COMPLETADO] — Docs raíz de la app

- [ ] Crear `apps/nominas/PATTERNS.md`
  - Repository Pattern
  - Service Layer
  - DTO Pattern
  - Soft Delete
  - (Migrar contenido de BOILERPLATE.md §7)
- [ ] Crear `apps/nominas/CONTRIBUTING.md`
  - Cómo crear un nuevo módulo (6 pasos)
  - (Migrar contenido de BOILERPLATE.md §6)

---

## 5. Consolidación y Limpieza

### 5.1 [COMPLETADO] — Eliminar archivos redundantes

- [ ] `git rm BOILERPLATE.md`
  - Migrar contenido único a `AGENTS.md` y docs de `apps/`
- [ ] Verificar que no hay referencias rotas a:
  - `ARCHITECTURE.md` (búsqueda con `rg "ARCHITECTURE.md"`)
  - `COMMANDS.md`
  - `SDD_WORKFLOW.md`
  - `skill-registry.md`
- [ ] Eliminar referencias encontradas (en READMEs o comentarios)

### 5.2 [COMPLETADO] — Consolidar `AGENTS.md`

- [ ] Agregar referencia cruzada a `apps/nominas/PATTERNS.md`
- [ ] Agregar referencia cruzada a `apps/nominas/CONTRIBUTING.md`
- [ ] Actualizar §12 Project Status Dashboard con nuevos statuses
- [ ] Verificar que §13 Documentation Index está completo

### 5.3 [COMPLETADO] — Sincronizar CHANGELOG

- [ ] Crear `openspec/changes/documentation-llm-readiness-audit/archive/` post-apply
- [ ] Agregar entrada en `CHANGELOG.md` bajo v0.3.0 (siguiente versión)
- [ ] Marcar tareas como `[x]` conforme se completan

---

## 6. Verificación Final

### 6.1 [PARCIAL — build OK, lint emite warnings] — Métricas automatizadas

- [ ] `npm run audit:docs` retorna ≥80% global
- [ ] `npm run lint` pasa (con regla en `warn`)
- [ ] `npm run build` exitoso
- [ ] `npm run test` sin fallos (no debe romper tests existentes)

### 6.2 — Tabla de cobertura

- [ ] Poblar `docs/COVERAGE.md` con valores reales por paquete
- [ ] Score global ≥85%

### 6.3 — Validación con LLM

- [ ] Test manual: pedirle a Claude/GPT que explique `AuthService.refreshTokens()` sin leer README
  - Debe poder responder correctamente con solo el código + JSDoc
- [ ] Documentar resultados en `verify-report.md`

### 6.4 [PENDIENTE — Fase 6 final] — Promoción de lint rule

- [ ] Cambiar `require-public-jsdoc` de `warn` a `error`
- [ ] Verificar que CI pasa
- [ ] Documentar en `CONTRIBUTING.md`

---

## 7. Post-Apply

### 7.1 — Archivar cambio

- [ ] Mover deltas de specs a main specs:
  - `common/spec.md` (nuevo, se mueve completo)
  - `http/spec.md` (delta de expansión)
  - `playwright/spec.md` (delta de expansión)
  - `documentation/spec.md` (nuevo, se mueve completo)
- [ ] Crear `openspec/changes/documentation-llm-readiness-audit/archive/`
- [ ] Mover carpeta completa a `openspec/changes/archive/`

### 7.2 — Actualizar AGENTS.md

- [ ] §12 Status Dashboard reflejar nuevos `complete`
- [ ] §13 Documentation Index incluir `docs/COVERAGE.md`

---

## Notas de Ejecución

**Orden sugerido:**
1. Fase 1 (infra: scripts + lint rule) → base reutilizable
2. Fase 2 (specs) → contrato claro antes de implementar
3. Fase 4 (apps/nominas docs) → alto impacto, baja complejidad
4. Fase 3 (JSDoc por paquete) → 10 paquetes, ~91 archivos
5. Fase 5 (limpieza) → una vez que el contenido está migrado
6. Fase 6 (verificación) → métricas objetivas
7. Fase 7 (archive) → cierre formal

**Estimación:**
- Fase 1: 4-6 horas (scripts Node.js + ESLint custom rule)
- Fase 2: 2-3 horas (4 specs)
- Fase 3: 12-16 horas (~1.5h por paquete × 10)
- Fase 4: 3-4 horas
- Fase 5: 1-2 horas
- Fase 6: 2 horas
- **Total: ~25-33 horas** (3-4 sesiones de trabajo)
## 8. Segunda Ronda LLM Tests V2 (Deep) — Plan de mejoras

> Generado tras ejecutar `scripts/llm-tests/v2/llm-orientation-v2.js` con evaluacion manual.
> Score V2: **70%** (vs V1: 91%). El V2 cubre categorias mas profundas (debugging, modification, edge-cases) donde el V1 no llegaba.

### 8.1 — Crear ARCHITECTURE.md (Q14 era 83%)

- [ ] Crear `docs/ARCHITECTURE.md` con diagrama Mermaid que muestre el orden correcto: AppModule -> MongooseModule -> DatabaseModule -> Controllers -> Services -> Repository
- [ ] Marcar `MONGODB_URI` y connection order con ejemplos
- [ ] Section "Common debugging paths" (preguntas frecuentes cuando algo no anda)

### 8.2 — Expandir `packages/auth/README.md` con mapa de archivos (Q12 era 29%)

- [ ] Anadir seccion "Auth Module Map" con tabla: archivo -> proposito
- [ ] Listar `jwt-auth.guard.ts`, `jwt.strategy.ts`, `public.decorator.ts`, `roles.guard.ts`, `roles.decorator.ts`
- [ ] Documentar el flujo completo: Request -> JwtAuthGuard -> JwtStrategy.validate -> req.user -> Controller
- [ ] Ejemplo explicito de `@Public()` con imports correctos

### 8.3 — Documentar mecanismo de retry de Inngest (Q17 era 43%)

- [ ] Anadir seccion en `packages/inngest/README.md` "Retry Mechanism":
  - Estrategia: exponential backoff
  - Configurable via `retries` option
  - Tabla de reintentos por defecto
  - Ejemplo de funcion con `retries: 3`

### 8.4 — Documentar firma de `ResendService.sendEmail()` (Q13 era 67%)

- [ ] Agregar JSDoc al metodo `sendEmail` con:
  - `@param` para todas las opciones (to, subject, text, html, etc.)
  - `@returns` describiendo `SendEmailResult`
  - `@throws` cuando API key no esta configurada
- [ ] Idem para `sendEmailWithTemplate`

### 8.5 — Crear `docs/FALLBACKS.md` con comportamiento ante env vars ausentes (Q15 era 71%)

- [ ] Documentar el fallback chain: env var -> default URI -> warning logged -> sistema sigue funcionando
- [ ] Tabla: "Que pasa si falta X" para todas las env vars criticas (MONGODB_URI, JWT_SECRET, RESEND_API_KEY, etc.)
- [ ] Anadir al script de auditoria un check que verifique todas las env vars documentadas

### 8.6 — Crear seccion "Adding a new provider" en `packages/ai/README.md` (Q16 era 83%)

- [ ] Step-by-step tutorial para agregar Mistral, Anthropic, etc.
- [ ] Snippet completo de `registerProvider()` con config
- [ ] Tabla: "Para agregar un provider: editar X, registrar Y, importar Z"

### 8.7 — Validar con V2 tests

- [ ] Re-ejecutar `scripts/llm-tests/v2/llm-orientation-v2.js`
- [ ] Target: score >= 85% en V2
- [ ] Categorias debugging/modification >= 75%

---
