<!-- @common/changelog — status: active -->
<!-- Actualizado automáticamente por el agente IA al finalizar cada cambio significativo. -->

# Changelog

> Este registro se actualiza automáticamente como parte del checklist de finalización del agente IA.
> No requiere intervención manual.

## [0.6.0] - 2026-07-14

### Added
- feat(@common/common): `LogCategory` enum — extensible log domain taxonomy (BOOT, DB, AUTH, PLAYWRIGHT, FEATURE, CONFIG, API)
- feat(@common/common): `BootstrapLogger` static helper — rich startup banner, step timing, section grouping, feature summary
- feat(app): Rich bootstrap banner in `main.ts` with phase timing and endpoint summary
- feat(app): `AppModule.onApplicationBootstrap()` — aggregated feature availability summary (MongoDB, Auth, Playwright, Inngest, Resend, AI Providers, Dynamic Schema)
- feat(@common/auth): `AuthModule.onModuleInit()` uses `BootstrapLogger.log(LogCategory.AUTH, ...)`
- feat(@common/database): `DatabaseService` uses `BootstrapLogger.log(LogCategory.DB, ...)` for connect/success/failure
- feat(@common/playwright): `PlaywrightService` uses `BootstrapLogger.log(LogCategory.PLAYWRIGHT, ...)` for chromium init

### Changed
- refactor: `LOG_STYLE=plain` env var fallback for log aggregators that dislike Unicode box-drawing
- docs: `packages/common/README.md` updated with new logging exports

---

## [0.5.0] - 2026-07-13

### Added
- feat(config): `apps/nominas/src/config/env.validation.ts` — validación centralizada de env vars al arranque
- feat(config): `.env.example` — template de referencia con todas las variables y marcas required/optional
- feat(@common/playwright): `packages/playwright/src/config/playwright.config.ts` — namespace `registerAs('playwright')` con defaults

### Changed
- feat(app.module): `ConfigModule.forRoot()` ahora usa `validate: validateEnv` — falla temprano si faltan `JWT_SECRET` o `MONGODB_URI`
- feat(@common/playwright): `PlaywrightModule` usa `ConfigModule.forFeature(playwrightConfig)` — lectura namespaced de env vars
- feat(@common/playwright): `PlaywrightService.getChromiumPath()` lee desde namespace `playwright.browsersPath`
- docs(AGENTS.md): §6 env vars ahora con leyenda ⚠️ REQUIRED / ✓ optional + defaults + AI providers
- chore: `openspec/changes/env-validation-defaults/` — proposal, specs, design, tasks

### Removed
- chore: Playwright ya no lee `PLAYWRIGHT_BROWSERS_PATH` directo de `configService.get<string>()` — ahora via namespace

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
