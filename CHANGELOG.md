<!-- @common/changelog — status: active -->
<!-- Actualizado automáticamente por el agente IA al finalizar cada cambio significativo. -->

# Changelog

> Este registro se actualiza automáticamente como parte del checklist de finalización del agente IA.
> No requiere intervención manual.

## [0.4.0] - 2026-07-13

### Changed
- docs(docker): `README.Docker.md` reescrito — estructura 10 packages, env vars completas, entrypoint, troubleshooting expandido
- docs(docker): `docs/ARCHITECTURE.md` diagrama Docker con servicios externos (Resend, AI providers)
- docs(docker): `AGENTS.md` §7 endpoints/checklist actualizados (Inngest removido, AI providers agregado)
- chore: `openspec/changes/docker-documentation-update/` creado

### Removed
- docs: Inngest endpoint removido de AGENTS.md endpoints table y checklist

---

## [0.3.0] - 2026-07-12

### Added (documentation-llm-readiness-audit)
- docs(infra): `scripts/audit-docs.js` — auditor de cobertura JSDoc con threshold 80%
- docs(infra): `scripts/generate-llm-context.js` — generador de `.llm-context.md` adyacentes
- docs(infra): `eslint-rules/require-public-jsdoc.mjs` — regla ESLint custom
- docs(infra): plugin `ai-readiness` integrado en `eslint.config.mjs` (mode: warn)
- docs(infra): 3 scripts nuevos en `package.json` (`audit:docs`, `docs:context`, `docs:coverage`)
- docs(infra): 106 archivos `.llm-context.md` auto-generados en `packages/*/src`
- docs(specs): `openspec/specs/common/spec.md` — nuevo (544 palabras, 11 escenarios)
- docs(specs): `openspec/specs/documentation/spec.md` — nuevo transversal (769 palabras, 15 escenarios)
- docs(specs): `openspec/specs/http/spec.md` — expandido (627 palabras, 14 escenarios)
- docs(specs): `openspec/specs/playwright/spec.md` — expandido (696 palabras, 16 escenarios)
- docs(specs): `openspec/specs/database/spec.md` — expandido (403 palabras, 9 escenarios)
- docs(specs): `openspec/specs/documents/spec.md` — expandido (422 palabras, 8 escenarios)
- docs(specs): `openspec/specs/inngest/spec.md` — expandido (466 palabras, 11 escenarios)
- docs(specs): `openspec/specs/serve-static/spec.md` — expandido (615 palabras, 14 escenarios)
- docs(apps): `apps/nominas/src/modules/usuarios/README.md` y `.llm-context.md`
- docs(apps): `apps/nominas/src/modules/dynamic-schema/README.md` y `.llm-context.md`
- docs(apps): `apps/nominas/PATTERNS.md` — migrado desde BOILERPLATE.md §7
- docs(apps): `apps/nominas/CONTRIBUTING.md` — migrado desde BOILERPLATE.md §6

### Changed
- docs: `AGENTS.md` sección 11 (Key Files) actualizada con docs de apps
- docs: `AGENTS.md` sección 12 (Status Dashboard) actualizada
- docs: `README.md` tabla de documentación ampliada

### Removed
- docs: `BOILERPLATE.md` eliminado (contenido consolidado en AGENTS.md y docs de apps/nominas)
- docs: 4 archivos basura eliminados (ya previamente: docker-playwright-config.md, inngest-config-context.md, README.mdgit, packages/inngest/src/README.md)

### Pending (Fase 3 — JSDoc asistida)
- ⚠️ 376 exports públicos aún sin JSDoc (0% cobertura actual, target ≥80%)
- Plan: agregar JSDoc a `packages/*/src/**/*.ts` método por método

---

## [0.2.0] - 2026-06-12

### Changed
- docs: audit complete — 4 archivos basura/redundantes eliminados (docker-playwright-config.md, inngest-config-context.md, README.mdgit, packages/inngest/src/README.md)
- fix(@common/auth): Swagger decorators (@ApiTags, @ApiOperation, @ApiResponse, @ApiBearerAuth) agregados en AuthController, TwoFactorController, PasskeysController
- fix(@common/http): http-error.ts ahora re-exporta desde @common/common — elimina duplicación de código
- fix: @types/bcrypt removido de devDependencies (nunca se usó)
- fix: tsconfig.json paths agregados para @common/auth, @common/resend, @common/serve-static
- fix: eslint.config.mjs — agregado packages/*/dist/ a ignores (elimina 1108 falsos positivos)
- docs: status tags HTML (<!-- @common/name — status: partial|complete -->) agregados en los 10 READMEs de packages

### Added
- docs: CHANGELOG.md creado con template de registro automático

---

## Format

Usar este template para cada nueva entrada. Insertar AL INICIO del changelog.

```markdown
## [x.y.z] - YYYY-MM-DD

### Added
- scope: descripción (ej. `feat(@common/auth): soporte OAuth2`)

### Changed
- scope: descripción (ej. `refactor(@common/http): http-error re-export desde common`)

### Fixed
- scope: descripción (ej. `fix(@common/ai): error en streaming con Gemini`)

### Removed
- scope: descripción (ej. `chore: @types/bcrypt eliminado`)
```
