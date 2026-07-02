<!-- @common/changelog — status: active -->
<!-- Actualizado automáticamente por el agente IA al finalizar cada cambio significativo. -->

# Changelog

> Automatically validated by CI (`doc-check.yml`). PRs without changelog updates get a reminder.

## [0.2.0] - 2026-07-02

### Added

- ci: `.github/workflows/doc-check.yml` — 6-job CI pipeline (status tags, README presence, JSDoc coverage, version sync, broken links, convention compliance)
- ci: `.github/workflows/changelog-reminder.yml` — auto-comments on PRs missing changelog updates
- ci: `.github/markdown-link-check.json` — config for broken link detection
- tooling: husky + lint-staged pre-commit hooks for doc validation
- tooling: `scripts/check-doc-status.js` — local doc checker (mirrors CI)
- tooling: `npm run docs:check`, `docs:generate`, `docs:serve` scripts
- meta: `package.json` description and author populated
- meta: Swagger tags added for `auth`, `2fa`, `passkeys`, `dynamic-schema`
- meta: version synced to 0.2.0 (was 0.0.1 in package.json)

### Changed

- docs: audit complete — 4 archivos basura/redundantes eliminados (docker-playwright-config.md, inngest-config-context.md, README.mdgit, packages/inngest/src/README.md)

### Changed (from June 2026 session)

- fix(@common/auth): Swagger decorators agregados en AuthController, TwoFactorController, PasskeysController
- fix(@common/http): http-error.ts ahora re-exporta desde @common/common
- fix: @types/bcrypt removido de devDependencies
- fix: tsconfig.json paths agregados para @common/auth, @common/resend, @common/serve-static
- fix: eslint.config.mjs — agregado packages/\*/dist/ a ignores
- docs: status tags HTML agregados en los 10 READMEs de packages
- docs: CHANGELOG.md creado con template de registro
- docs: AGENTS.md restructured — Feature-to-File Index, Capability Matrix, Error Handling table, Module Patterns, cross-references

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
