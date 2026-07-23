# Tasks: Testing Coverage & CI/CD Pipeline

## Phase 0 — Infraestructura de testing

- [ ] 0.1 Instalar `mongodb-memory-server` como devDependency: `npm i -D mongodb-memory-server`
- [ ] 0.2 Crear `apps/nominas/test/utils.ts` con `createTestApp()` y `teardownTestApp()`
- [ ] 0.3 Crear `apps/nominas/test/utils.llm-context.md` explicando la infra E2E
- [ ] 0.4 Crear `apps/nominas/test/health.e2e-spec.ts` (GET /api/health → 200)
- [ ] 0.5 Verificar: `npm run test:e2e` pasa con health test

## Phase 1 — Tests unitarios: @common/database

- [ ] 1.1 Crear `packages/database/src/database.service.spec.ts`
  - Test: `connect()` establece conexión exitosa (mock mongoose)
  - Test: `connect()` retry con backoff exponencial (fake timers)
  - Test: `connect()` lanza error tras maxRetries
  - Test: `disconnect()` cierra conexión
  - Test: `disconnect()` cancela retry timer pendiente
  - Test: `isConnected()` retorna estado correcto
- [ ] 1.2 Crear `packages/database/src/transaction/transaction-manager.spec.ts`
  - Test: `withTransaction()` commitea en éxito
  - Test: `withTransaction()` aborta en error
  - Test: `withTransaction()` retry en TransientTransactionError
  - Test: `@Transactional` decorator integra con TransactionManager
- [ ] 1.3 Crear `packages/database/src/__tests__/.llm-context.md`
- [ ] 1.4 Verificar: `npm run test -- packages/database` pasa

## Phase 2 — Tests unitarios: @common/ai

- [ ] 2.1 Crear `packages/ai/src/ai.service.spec.ts`
  - Test: `chat()` envía mensajes al provider correcto
  - Test: `chat()` lanza error si provider no configurado
  - Test: `generateSchemaFromText()` retorna schema válido (mock LLM)
  - Test: `generateSchemaFromText()` retry con response_format ante JSON inválido
  - Test: `generateSchemaFromImage()` serializa content array por provider
  - Test: `generateSchemaFromImage()` lanza VISION_NOT_SUPPORTED si provider sin vision
  - Test: `embeddings()` retorna vector (mock)
- [ ] 2.2 Crear `packages/ai/src/providers/openai-compatible.provider.spec.ts`
  - Test: serialización de mensajes multimodales (text + image_url)
  - Test: manejo de error de API (rate limit, timeout)
- [ ] 2.3 Crear `packages/ai/src/__tests__/.llm-context.md`
- [ ] 2.4 Verificar: `npm run test -- packages/ai` pasa

## Phase 3 — Tests unitarios: @common/http

- [ ] 3.1 Crear `packages/http/src/http-client.service.spec.ts`
  - Test: `get()` retorna data (mock axios)
  - Test: `post()` envía body correctamente
  - Test: timeout configurado se aplica
  - Test: error de red lanza HttpError
- [ ] 3.2 Crear `packages/http/src/download.service.spec.ts`
  - Test: `download()` guarda archivo (mock fs + axios)
  - Test: `downloadAndOptimize()` procesa imagen con sharp (mock)
  - Test: URL inválida lanza error
- [ ] 3.3 Crear `packages/http/src/__tests__/.llm-context.md`
- [ ] 3.4 Verificar: `npm run test -- packages/http` pasa

## Phase 4 — Tests unitarios: @common/documents

- [ ] 4.1 Crear `packages/documents/src/document-processor.service.spec.ts`
  - Test: `extract()` con PDF (mock pdf-parse)
  - Test: `extract()` con DOCX (mock mammoth)
  - Test: `extract()` con formato no soportado lanza error
  - Test: parser interface extensible (custom parser)
- [ ] 4.2 Crear `packages/documents/src/__tests__/.llm-context.md`
- [ ] 4.3 Verificar: `npm run test -- packages/documents` pasa

## Phase 5 — Tests unitarios: @common/resend

- [ ] 5.1 Crear `packages/resend/src/resend.service.spec.ts`
  - Test: `sendEmail()` envía con datos correctos (mock Resend SDK)
  - Test: `sendEmail()` sin API key lanza error descriptivo
  - Test: `sendTemplate()` renderiza template con datos
- [ ] 5.2 Crear `packages/resend/src/modules/newsletter/newsletter.service.spec.ts`
  - Test: `subscribe()` agrega suscriptor
  - Test: `subscribe()` duplicado no crea entrada extra
  - Test: `unsubscribe()` elimina suscriptor
  - Test: `getSubscribers()` retorna lista
- [ ] 5.3 Crear `packages/resend/src/__tests__/.llm-context.md`
- [ ] 5.4 Verificar: `npm run test -- packages/resend` pasa

## Phase 6 — Tests unitarios: @common/serve-static

- [ ] 6.1 Crear `packages/serve-static/src/serve-static.service.spec.ts`
  - Test: `render()` retorna HTML con datos inyectados (mock ejs)
  - Test: `render()` con layout + partials
  - Test: `render()` cachea resultado por 60s (fake timers)
  - Test: `render()` con template inexistente lanza error
- [ ] 6.2 Crear `packages/serve-static/src/__tests__/.llm-context.md`
- [ ] 6.3 Verificar: `npm run test -- packages/serve-static` pasa

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

- [ ] 9.1 Actualizar `AGENTS.md` §4: Tests ❌ → ✅ para database, ai, http, documents, resend, serve-static
- [ ] 9.2 Actualizar `AGENTS.md` §12: agregar `testing-coverage-cicd` al dashboard
- [ ] 9.3 Actualizar `AGENTS.md` §14: recalcular Cognitive Ranking con test_coverage=2
- [ ] 9.4 Actualizar READMEs de cada paquete con sección "Testing"
- [ ] 9.5 `npm run build` pasa sin errores
- [ ] 9.6 `npm run lint` pasa sin errores
- [ ] 9.7 `npm run test` pasa (todas las suites)
