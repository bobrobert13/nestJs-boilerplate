<!-- @common/changelog — status: active -->
<!-- Actualizado automáticamente por el agente IA al finalizar cada cambio significativo. -->

# Changelog

> Este registro se actualiza automáticamente como parte del checklist de finalización del agente IA.
> No requiere intervención manual.

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
