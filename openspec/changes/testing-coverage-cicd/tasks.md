# Tasks: Testing Coverage & CI/CD Pipeline

## Phase 0 — Infraestructura de testing

- [x] 0.1 Instalar `mongodb-memory-server` como devDependency: `npm i -D mongodb-memory-server`
- [x] 0.2 Crear `apps/nominas/test/utils.ts` con `createTestApp()` y `teardownTestApp()`
- [x] 0.3 Crear `apps/nominas/test/utils.llm-context.md` explicando la infra E2E
- [x] 0.4 Crear `apps/nominas/test/health.e2e-spec.ts` (GET /api/health → 200)
- [x] 0.5 Verificar: `npm run test:e2e` pasa con health test

> Nota: `jest-e2e.json` recibió `moduleNameMapper` para `@common/*` y
> `utils.ts` replica el wiring global de `main.ts` (ValidationPipe,
> DatabaseExceptionFilter, ResponseInterceptor). Fix incluido:
> `DatabaseService.onModuleDestroy` evita el ciclo de reconexión que
> dejaba Jest colgado tras el teardown.

## Phase 1 — Tests unitarios: @common/database

- [x] 1.1 Crear `packages/database/src/database.service.spec.ts`
  - Test: `connect()` establece conexión exitosa (mock mongoose)
  - Test: `connect()` retry con backoff exponencial (fake timers)
  - Test: `connect()` lanza error tras maxRetries
  - Test: `disconnect()` cierra conexión
  - Test: `disconnect()` cancela retry timer pendiente
  - Test: `isConnected()` retorna estado correcto
- [x] 1.2 Crear `packages/database/src/transaction/transaction-manager.spec.ts`
  - Test: `withTransaction()` commitea en éxito
  - Test: `withTransaction()` aborta en error
  - Test: `withTransaction()` retry en TransientTransactionError
  - Test: `@Transactional` decorator integra con TransactionManager
- [x] 1.3 Documentación LLM de tests: cubierta por los `.llm-context.md` co-located de cada fuente testeada
- [x] 1.4 Verificar: `npm run test -- packages/database` pasa

## Phase 2 — Tests unitarios: @common/ai

- [x] 2.1 Crear `packages/ai/src/ai.service.spec.ts`
  - Test: `chat()` envía mensajes al provider correcto
  - Test: `chat()` lanza error si provider no configurado
  - Test: `generateSchemaFromText()` retorna schema válido (mock LLM)
  - Test: `generateSchemaFromText()` retry con response_format ante JSON inválido
  - Test: `generateSchemaFromImage()` serializa content array por provider
  - Test: `generateSchemaFromImage()` lanza VISION_NOT_SUPPORTED si provider sin vision
  - Test: `embeddings()` retorna vector (mock)
- [x] 2.2 Tests de providers: cubiertos en `packages/ai/src/ai.service.spec.ts`
  - Test: serialización de mensajes multimodales (text + image_url)
  - Test: manejo de error de API (rate limit, timeout)
- [x] 2.3 Documentación LLM de tests: cubierta por los `.llm-context.md` co-located
- [x] 2.4 Verificar: `npm run test -- packages/ai` pasa

## Phase 3 — Tests unitarios: @common/http

- [x] 3.1 Crear `packages/http/src/services/http.service.spec.ts`
  - Test: `get()` retorna data (mock axios)
  - Test: `post()` envía body correctamente
  - Test: timeout configurado se aplica
  - Test: error de red lanza HttpError
- [x] 3.2 Crear `packages/http/src/services/download.service.spec.ts`
  - Test: `download()` guarda archivo (mock fs + axios)
  - Test: `downloadAndOptimize()` procesa imagen con sharp (mock)
  - Test: URL inválida lanza error
- [x] 3.3 Documentación LLM de tests: cubierta por los `.llm-context.md` co-located
- [x] 3.4 Verificar: `npm run test -- packages/http` pasa

## Phase 4 — Tests unitarios: @common/documents

- [x] 4.1 Crear `packages/documents/src/services/document-processor.service.spec.ts`
  - Test: `extract()` con PDF (mock pdf-parse)
  - Test: `extract()` con DOCX (mock mammoth)
  - Test: `extract()` con formato no soportado lanza error
  - Test: parser interface extensible (custom parser)
- [x] 4.2 Documentación LLM de tests: cubierta por los `.llm-context.md` co-located
- [x] 4.3 Verificar: `npm run test -- packages/documents` pasa

## Phase 5 — Tests unitarios: @common/resend

- [x] 5.1 Crear `packages/resend/src/services/resend.service.spec.ts`
  - Test: `sendEmail()` envía con datos correctos (mock Resend SDK)
  - Test: `sendEmail()` sin API key lanza error descriptivo
  - Test: `sendTemplate()` renderiza template con datos
- [x] 5.2 Crear `packages/resend/src/modules/newsletter/newsletter.service.spec.ts`
  - Test: `subscribe()` agrega suscriptor
  - Test: `subscribe()` duplicado no crea entrada extra
  - Test: `unsubscribe()` elimina suscriptor
  - Test: `getSubscribers()` retorna lista
- [x] 5.3 Documentación LLM de tests: cubierta por los `.llm-context.md` co-located
- [x] 5.4 Verificar: `npm run test -- packages/resend` pasa

## Phase 6 — Tests unitarios: @common/serve-static

- [x] 6.1 Crear `packages/serve-static/src/serve-static.service.spec.ts`
  - Test: `render()` retorna HTML con datos inyectados (mock ejs)
  - Test: `render()` con layout + partials
  - Test: `render()` cachea resultado por 60s (fake timers)
  - Test: `render()` con template inexistente lanza error
- [x] 6.2 Documentación LLM de tests: cubierta por los `.llm-context.md` co-located
- [x] 6.3 Verificar: `npm run test -- packages/serve-static` pasa

## Phase 7 — E2E tests

- [ ] 7.1 Crear `apps/nominas/test/usuarios.e2e-spec.ts`
  - Test: CRUD completo con auth (register → login → create → findAll → update → remove)
  - Test: acceso sin token retorna 401
- [ ] 7.2 Crear `apps/nominas/test/README.md` documentando infra E2E
- [ ] 7.3 Verificar: `npm run test:e2e` pasa con todos los E2E tests

## Phase 8 — CI/CD Pipeline

- [ ] 8.1 Crear `.github/workflows/ci.yml` con jobs: lint → test → build → e2e
- [ ] 8.2 Verificar: workflow YAML es válido (revisar sintaxis)
- [ ] 8.3 Documentar en `README.md` sección "CI/CD" con badges

## Phase 9 — Documentación

- [x] 9.1 Actualizar `AGENTS.md` §4: Tests ❌ → ✅ para database, ai, http, documents, resend, serve-static
- [x] 9.2 Actualizar `AGENTS.md` §12: agregar `testing-coverage-cicd` al dashboard
- [ ] 9.3 Actualizar `AGENTS.md` §14: recalcular Cognitive Ranking con test_coverage=2
- [ ] 9.4 Actualizar READMEs de cada paquete con sección "Testing"
- [x] 9.5 `npm run build` pasa sin errores
- [x] 9.6 `npm run lint` pasa sin errores
- [x] 9.7 `npm run test` pasa (todas las suites)
