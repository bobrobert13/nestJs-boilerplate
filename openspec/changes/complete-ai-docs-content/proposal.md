# Proposal: Complete AI-Friendly Documentation Content

## Why

El change `documentation-llm-readiness-audit` (Fase 1+2) construyó la
**infraestructura** de documentación IA-friendly: scripts de auditoría,
regla ESLint custom, generador de `.llm-context.md`, specs OpenSpec, y
el Cognitive Ranking en AGENTS.md.

Sin embargo, una auditoría realizada el 2026-07-22 revela que el
**contenido real** tiene una brecha crítica respecto a lo que la
infraestructura promete:

| Métrica | Valor actual | Target | Gap |
|---------|-------------|--------|-----|
| JSDoc en exports públicos | **~0-5%** (376 métodos) | **80%+** | **-75%** |
| `.llm-context.md` con contenido real | **2/108** (1.8%) | **108/108** | **-98%** |
| `docs/COVERAGE.md` | **No existe** | Existe + actualizado | **-100%** |
| `packages/inngest` documentado | **Sin README, sin package.json** | README + spec | **-100%** |
| Módulo `health` documentado | **Sin README, sin .llm-context** | README + .llm-context | **-100%** |
| Números en AGENTS.md/README.md | **Desactualizados** (27 specs → hay 43) | Precisos | Stale |
| JSDoc duplicado en `ai.service.ts` | **2 bloques por método** (real + stub) | 1 bloque limpio | Noise |
| Regla ESLint `require-public-jsdoc` | **warn** (debía promoverse a error) | error | Sin enforcement |
| Changes OpenSpec sin archivar | **5+ cambios** en `changes/` | Archivados | Clutter |

### Impacto en un LLM

Un modelo de IA operando en este repositorio:

- ✅ Puede entender QUÉ hace cada módulo (READMEs son buenos)
- ✅ Puede seguir el flujo SDD (OpenSpec está bien estructurado)
- ✅ Puede crear módulos nuevos (PATTERNS.md + CONTRIBUTING.md)
- ❌ **No puede entender contratos de métodos** (JSDoc ~0%)
- ❌ **Pierde tokens en 106 archivos .llm-context vacíos** (ruido)
- ❌ **No sabe qué es `packages/inngest`** (paquete fantasma)
- ❌ **Confía en números incorrectos** (AGENTS.md dice 27 specs, hay 43)
- ❌ **Lee JSDoc duplicado/confuso** en `ai.service.ts`

## What Changes

### Bloque A — JSDoc (impacto máximo)

1. **Completar JSDoc** en los 376 exports públicos de `packages/*/src` y
   `apps/*/src/modules`, siguiendo el template de
   `docs/JSDOC-MIGRATION-PLAN.md`.
2. **Limpiar JSDoc duplicado** en `packages/ai/src/ai.service.ts`
   (eliminar stubs `/** methodName (see class JSDoc for context). */`).
3. **Regenerar `.llm-context.md`** con `npm run docs:context` para que
   los 108 archivos reflejen el JSDoc real.

### Bloque B — Paquetes/módulos fantasma

4. **Documentar `packages/inngest`**: crear `README.md`, `package.json`,
   y spec OpenSpec `openspec/specs/inngest/spec.md`.
5. **Documentar módulo `health`**: crear `README.md` y `.llm-context.md`.

### Bloque C — Precisión y consistencia

6. **Actualizar AGENTS.md**: números reales (43 specs, 10 paquetes,
   incluir inngest), Cognitive Ranking actualizado, status dashboard.
7. **Actualizar README.md**: reemplazar "Tests: XXX passed" con número
   real, corregir "27 spec files" → 43.
8. **Generar `docs/COVERAGE.md`** con `npm run docs:coverage`.
9. **Unificar idioma** en READMEs de paquetes: todos en inglés
   (siguiendo la recomendación de JSDOC-MIGRATION-PLAN).

### Bloque D — Enforcement y limpieza

10. **Promover regla ESLint** `ai-readiness/require-public-jsdoc` de
    `warn` a `error` (han pasado >14 días desde rollout).
11. **Archivar cambios OpenSpec completados**: mover a `changes/archive/`
    los cambios que ya terminaron.

## Scope

### In Scope

- `packages/*/src/**/*.ts` → JSDoc en exports públicos
- `packages/ai/src/ai.service.ts` → limpiar JSDoc duplicado
- `packages/inngest/` → README.md + package.json + spec
- `apps/nominas/src/modules/health/` → README.md
- `AGENTS.md` → actualizar números, ranking, status
- `README.md` → corregir placeholders y números
- `docs/COVERAGE.md` → generar
- `eslint.config.mjs` → promover regla a error
- `.llm-context.md` → regenerar todos
- `openspec/changes/` → archivar completados
- READMEs de `resend` y `serve-static` → traducir a inglés

### Out of Scope

- Reescribir lógica de negocio
- Cambiar APIs públicas (breaking changes)
- Crear tests nuevos (solo documentar)
- Modificar scripts `audit-docs.js` o `generate-llm-context.js`
- Auth stub → implementación real (cambio separado)

## Findings (Auditoría 2026-07-22)

### 🔴 Críticos (3)

| # | Hallazgo | Ubicación | Síntoma |
|---|----------|-----------|---------|
| 1 | JSDoc ~0% en 376 exports públicos | `packages/*/src`, `apps/*/src` | LLM no puede inferir contratos de métodos |
| 2 | 106/108 `.llm-context.md` son placeholders vacíos | Todos los `.llm-context.md` | 98% de archivos son ruido para el LLM |
| 3 | `packages/inngest` sin README, package.json, ni spec | `packages/inngest/` | Paquete fantasma — invisible para LLM |

### 🟠 Altos (4)

| # | Hallazgo | Ubicación | Síntoma |
|---|----------|-----------|---------|
| 4 | `docs/COVERAGE.md` no existe | `docs/` | Spec dice MUST, nunca se generó |
| 5 | JSDoc duplicado en `ai.service.ts` | `packages/ai/src/ai.service.ts` | 2 bloques JSDoc por método (real + stub) |
| 6 | README.md con placeholder "Tests: XXX passed" | `README.md:288` | LLM lee dato falso |
| 7 | AGENTS.md dice "27 spec files" pero hay 43 | `AGENTS.md`, `README.md` | Números desactualizados |

### 🟡 Medios (4)

| # | Hallazgo | Ubicación | Síntoma |
|---|----------|-----------|---------|
| 8 | Módulo `health` sin README ni .llm-context | `apps/nominas/src/modules/health/` | Viola spec de documentación |
| 9 | Idioma inconsistente (ES/EN) en READMEs | `resend`, `serve-static` (ES) vs resto (EN) | Incoherencia para LLM |
| 10 | Regla ESLint en `warn` indefinidamente | `eslint.config.mjs:58` | Sin enforcement real |
| 11 | 5+ cambios OpenSpec sin archivar | `openspec/changes/` | Workspace sucio |

### 🟢 Bajos (1)

| # | Hallazgo | Ubicación | Síntoma |
|---|----------|-----------|---------|
| 12 | Cognitive Ranking no incluye `inngest` | `AGENTS.md` §14 | Ranking incompleto |

## Risk

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| JSDoc generado de baja calidad | Media | Seguir template de JSDOC-MIGRATION-PLAN.md; revisión por paquete |
| Promover ESLint a error rompe build | Media | Verificar `npm run lint` antes de promover; mantener exclusión de DTOs/schemas/specs |
| Traducir READMEs introduce errores | Baja | Traducción directa, mantener ejemplos de código sin cambios |
| Archivar changes rompe referencias | Baja | Solo archivar cambios con verify-report completado |

## Affected Packages

- `@common/ai` (JSDoc + limpiar duplicados)
- `@common/auth` (JSDoc)
- `@common/common` (JSDoc)
- `@common/database` (JSDoc — ya tiene parcial)
- `@common/documents` (JSDoc)
- `@common/http` (JSDoc)
- `@common/inngest` (README + package.json + spec — NUEVO)
- `@common/playwright` (JSDoc)
- `@common/resend` (JSDoc + traducir README a EN)
- `@common/serve-static` (JSDoc + traducir README a EN)
- `apps/nominas/health` (README — NUEVO)
- `apps/nominas/usuarios` (JSDoc)
- `apps/nominas/dynamic-schema` (JSDoc)
- `apps/nominas/scraper` (JSDoc)
- Root: `AGENTS.md`, `README.md`, `docs/COVERAGE.md`, `eslint.config.mjs`

## Rollback Plan

```bash
# 1. Revertir el PR completo
git revert -m 1 <merge-commit-sha>

# 2. Si la regla ESLint en error rompe CI
# Editar eslint.config.mjs: cambiar "error" → "warn"

# 3. Si .llm-context.md regenerados causan problemas
npm run docs:context  # regenerar desde source
```

## Success Criteria

- [ ] `npm run audit:docs` reporta cobertura JSDoc ≥80%
- [ ] `npm run lint` pasa con regla `require-public-jsdoc` en `error`
- [ ] 108/108 `.llm-context.md` tienen contenido real (no placeholder)
- [ ] `packages/inngest/README.md` existe con Quick Start + API
- [ ] `openspec/specs/inngest/spec.md` existe con ≥5 escenarios
- [ ] `apps/nominas/src/modules/health/README.md` existe
- [ ] `docs/COVERAGE.md` existe y muestra score ≥80%
- [ ] `AGENTS.md` refleja números reales (43 specs, 10 paquetes, inngest incluido)
- [ ] `README.md` sin placeholders ("XXX") y con números correctos
- [ ] `ai.service.ts` tiene 1 solo bloque JSDoc por método
- [ ] READMEs de `resend` y `serve-static` en inglés
- [ ] Changes OpenSpec completados archivados
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores
