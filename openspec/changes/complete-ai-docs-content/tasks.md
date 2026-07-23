# Tasks: Complete AI-Friendly Documentation Content

> Checklist implementación. Marcar con [x] al completar.
> Cada tarea debe ser completable en sesión única (regla OpenSpec).
> **Requiere confirmación del usuario antes de ejecutar (apply).**

---

## Phase 1 — JSDoc Cleanup & Completion (Bloque A)

### 1.1 — Limpiar JSDoc duplicado en `@common/ai` [CRÍTICO]

- [ ] Eliminar todos los stubs `/** methodName (see class JSDoc for context). */` en `packages/ai/src/ai.service.ts`
- [ ] Eliminar stubs en `packages/ai/src/providers/openai-compatible.provider.ts` (si existen)
- [ ] Verificar que cada método público tiene exactamente 1 bloque JSDoc con `@param`/`@returns`
- [ ] Agregar JSDoc faltante en métodos de `ai.service.ts` que no lo tengan
- [ ] Agregar JSDoc en `packages/ai/src/interfaces/provider.interface.ts`
- [ ] Agregar JSDoc en `packages/ai/src/types/ai.types.ts` (types/interfaces públicos)

### 1.2 — JSDoc en `@common/auth` [CRÍTICO]

- [ ] Agregar JSDoc en todos los métodos públicos de `packages/auth/src/`
- [ ] Incluir `@param`, `@returns`, `@throws` donde aplique
- [ ] Documentar el flujo: Request → JwtAuthGuard → JwtStrategy.validate → req.user

### 1.3 — JSDoc en `@common/database` [MEDIO]

- [ ] Revisar JSDoc existente en `database.service.ts` (preservar si es bueno)
- [ ] Agregar JSDoc faltante en `transaction.service.ts`
- [ ] Agregar JSDoc en `database.module.ts` (exports públicos)
- [ ] Documentar decorators `@Transactional` si existen

### 1.4 — JSDoc en `@common/http` [MEDIO]

- [ ] Agregar JSDoc en HTTP client service (get, post, put, patch, delete)
- [ ] Agregar JSDoc en download service
- [ ] Documentar error mapping (axios → HttpError)

### 1.5 — JSDoc en `@common/playwright` [MEDIO]

- [ ] Agregar JSDoc en browser service (init, navigate, waitForSelector, close)
- [ ] Documentar lifecycle (single page per context)
- [ ] Documentar configuración (headless, viewport, userAgent)

### 1.6 — JSDoc en `@common/documents` [MEDIO]

- [ ] Agregar JSDoc en document processor service
- [ ] Documentar formatos soportados (PDF, DOCX)
- [ ] Documentar parser interface extensible

### 1.7 — JSDoc en `@common/common` [BAJO]

- [ ] Agregar JSDoc en BaseAdapter interface
- [ ] Agregar JSDoc en DatabaseExceptionFilter
- [ ] Agregar JSDoc en HttpError + factory
- [ ] Agregar JSDoc en BootstrapLogger / LogCategory

### 1.8 — JSDoc en `@common/resend` [BAJO]

- [ ] Agregar JSDoc en ResendService (sendEmail, sendEmailWithTemplate)
- [ ] Agregar JSDoc en NewsletterModule/Service
- [ ] Documentar `@throws` cuando API key no está configurada

### 1.9 — JSDoc en `@common/serve-static` [BAJO]

- [ ] Agregar JSDoc en ServeStaticService (render)
- [ ] Documentar layouts, partials, caché 60s

### 1.10 — JSDoc en `@common/inngest` [BAJO]

- [ ] Agregar JSDoc en todos los exports públicos del paquete

### 1.11 — JSDoc en `apps/nominas` modules [BAJO]

- [ ] `usuarios`: controller, service, repository
- [ ] `dynamic-schema`: controller, service, schema-compiler, repository
- [ ] `scraper`: controller, service, repository, strategies
- [ ] `health`: controller (ya tiene JSDoc parcial)

### 1.12 — Regenerar `.llm-context.md` [CRÍTICO]

- [ ] Ejecutar `npm run docs:context`
- [ ] Verificar: 0 archivos con "(Sin descripcion JSDoc"
- [ ] Verificar: 108 archivos con contenido real (≥10 líneas)

---

## Phase 2 — Paquetes/Módulos Fantasma (Bloque B)

### 2.1 — Documentar `packages/inngest` [CRÍTICO]

- [ ] Crear `packages/inngest/README.md` (Overview, Quick Start, API, Config, Troubleshooting)
- [ ] Crear `packages/inngest/package.json` (name, version, main, dependencies)
- [ ] Crear `openspec/specs/inngest/spec.md` (≥5 escenarios Given/When/Then)
- [ ] Agregar status tag: `<!-- @common/inngest — status: complete -->`

### 2.2 — Documentar módulo `health` [MEDIO]

- [ ] Crear `apps/nominas/src/modules/health/README.md`
- [ ] Documentar: GET /api/health, response shape, use cases (Docker, K8s, LB)
- [ ] Generar `.llm-context.md` para el módulo

---

## Phase 3 — Precisión y Consistencia (Bloque C)

### 3.1 — Actualizar AGENTS.md [ALTO]

- [ ] §4: Agregar fila `@common/inngest` en matriz de paquetes
- [ ] §4: Agregar nota por paquete para inngest
- [ ] §12: Agregar `complete-ai-docs-content` en cambios activos
- [ ] §13: Agregar fila inngest en Documentation Index
- [ ] §14: Agregar `@common/inngest` en Cognitive Ranking
- [ ] §14: Actualizar scores JSDoc post-implementación
- [ ] §14: Corregir conteo de tests (43, no 27)

### 3.2 — Actualizar README.md [ALTO]

- [ ] Reemplazar "Tests: XXX passed" con número real
- [ ] Corregir "27 spec files" → "43 spec files"
- [ ] Verificar que no queden otros placeholders

### 3.3 — Generar `docs/COVERAGE.md` [ALTO]

- [ ] Ejecutar `npm run docs:coverage`
- [ ] Verificar que el archivo existe y muestra score ≥80%
- [ ] Verificar que lista cobertura por paquete

### 3.4 — Traducir READMEs a inglés [MEDIO]

- [ ] Traducir `packages/resend/README.md` de ES → EN
- [ ] Traducir `packages/serve-static/README.md` de ES → EN
- [ ] Preservar: code examples, status tags, estructura

---

## Phase 4 — Enforcement y Limpieza (Bloque D)

### 4.1 — Promover regla ESLint a error [MEDIO]

- [ ] Pre-check: `npm run lint` tiene 0 warnings de `require-public-jsdoc`
- [ ] Editar `eslint.config.mjs`: `"warn"` → `"error"`
- [ ] Post-check: `npm run lint` pasa sin errores

### 4.2 — Archivar changes OpenSpec completados [BAJO]

- [ ] Mover `documentation-llm-readiness-audit` → `changes/archive/`
- [ ] Mover `audit-agents-md-references` → `changes/archive/` (si existe y está completo)
- [ ] Mover `docker-documentation-update` → `changes/archive/` (si existe y está completo)
- [ ] Mover `dynamic-schema-complete-pipeline` → `changes/archive/` (si existe y está completo)
- [ ] Mover `env-validation-defaults` → `changes/archive/` (si existe y está completo)
- [ ] Verificar: solo `complete-ai-docs-content` queda en `changes/`

---

## Phase 5 — Verificación Final

### 5.1 — Validación completa

- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores (regla en error)
- [ ] `npm run audit:docs` reporta ≥80%
- [ ] 0 archivos `.llm-context.md` con placeholder
- [ ] `docs/COVERAGE.md` existe
- [ ] `packages/inngest/README.md` existe
- [ ] `openspec/specs/inngest/spec.md` existe
- [ ] `apps/nominas/src/modules/health/README.md` existe
- [ ] AGENTS.md sin números stale
- [ ] README.md sin placeholders

---

## Notas de Ejecución

**Orden sugerido:**
1. Phase 1.1 (limpiar ai.service.ts) → elimina noise inmediato
2. Phase 1.2-1.11 (JSDoc por paquete) → bulk del trabajo
3. Phase 1.12 (regenerar .llm-context) → depende de JSDoc completo
4. Phase 2 (inngest + health) → independiente
5. Phase 3 (AGENTS.md + README + COVERAGE) → depende de Phase 1
6. Phase 4 (ESLint + archive) → último, requiere todo lo anterior

**Estimación:**
- Phase 1: 12-16 horas (~1.5h por paquete × 10 + limpieza)
- Phase 2: 2-3 horas
- Phase 3: 2-3 horas
- Phase 4: 1 hora
- Phase 5: 1 hora
- **Total: ~18-24 horas** (3-4 sesiones de trabajo)

**Dependencias:**
- Phase 1.12 depende de Phase 1.1-1.11
- Phase 3.3 depende de Phase 1 (coverage necesita JSDoc)
- Phase 4.1 depende de Phase 1 (lint debe pasar)
- Phase 2 es independiente (puede paralelizarse)