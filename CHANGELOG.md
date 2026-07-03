<!-- @common/changelog — status: active -->
<!-- Actualizado automáticamente por el agente IA al finalizar cada cambio significativo. -->

# Changelog

> Automatically validated by CI (`doc-check.yml`). PRs without changelog updates get a reminder.

## [0.2.0] - 2026-07-02

### Added

- feat(inngest): add 4 missing create*Payload methods to InngestService
- feat(usuarios): add admin bootstrap from ADMIN_EMAIL env var
- feat(usuarios): apply RBAC to controller + add role management endpoint
- feat(usuarios): add assignRoles + grantAdminByEmail service methods
- feat(usuarios): add updateRoles + legacy doc normalization
- feat(usuarios): add roles field to Usuario schema
- feat(usuarios): add AssignRolesDto with role validation
- feat(usuarios): add UsuarioRole enum and role hierarchy
- feat(rbac): consolidate RBAC exports through rbac/
- feat(rbac): add assertCanModifyOtherRoles self-modification guard
- feat(rbac): add hasAtLeastRole generic hierarchy utility

- ci: `.github/workflows/doc-check.yml` — 6-job CI pipeline (status tags, README presence, JSDoc coverage, version sync, broken links, convention compliance)
- ci: `.github/workflows/changelog-reminder.yml` — auto-comments on PRs missing changelog updates
- ci: `.github/markdown-link-check.json` — config for broken link detection
- tooling: husky + lint-staged pre-commit hooks for doc validation
- tooling: `scripts/check-doc-status.js` — local doc checker (mirrors CI)
- tooling: `npm run docs:check`, `docs:generate`, `docs:serve` scripts
- meta: `package.json` description and author populated
- meta: Swagger tags added for `auth`, `2fa`, `passkeys`, `dynamic-schema`
- meta: version synced to 0.2.0 (was 0.0.1 in package.json)

### Removed

- chore: eliminado directorio `setup/` completo (wizard de selección de paquetes, scripts setup.sh/bat, templates, package-config.json) — no era necesario por ahora
- chore: removida Section 11 (Package Setup Wizard) de AGENTS.md, referencias en Quick Reference, Troubleshooting, Key Files; secciones reenumeradas 12-15 → 11-14
- chore: removido paso de setup wizard de CONTRIBUTING.md y apps/nominas/README.md

### Changed

- docs(sdd): include fix-pre-existing-issues change record
- docs(sdd): add archive report for fix-pre-existing-issues
- docs(specs): sync delta specs from fix-pre-existing-issues to canonical location
- docs(sdd): include usuarios-add-rbac-tests change record
- chore(format): apply prettier formatting from previous format run
- docs(sdd): add archive report for usuarios-add-rbac-tests
- docs(specs): sync delta specs from usuarios-add-rbac-tests to canonical location
- test(usuarios): add E2E test for 400 from global ValidationPipe
- test(usuarios): add onApplicationBootstrap admin seed tests in module spec
- test(usuarios): add AssignRolesDto validation tests
- test(rbac): add updateRoles + addRole + findRawByEmail + toPublic tests in repository spec
- test(usuarios): add assignRoles + grantAdminByEmail + default-roles tests in service spec
- test(usuarios): add assignRoles delegation + guard chain test in controller spec
- test(rbac): add hierarchy-aware RolesGuard tests
- test(rbac): add assertCanModifyOtherRoles self-modification guard tests
- test(rbac): add hasAtLeastRole hierarchy utility tests
- chore(test): add jest moduleNameMapper for @common/* paths
- docs(sdd): include usuarios-rbac change record
- docs(sdd): add archive report for usuarios-rbac
- docs(specs): sync delta specs from usuarios-rbac to canonical location
- docs(agents): document usuarios RBAC pattern in §8
- refactor(rbac): move Roles decorator to rbac/
- refactor(rbac): move RolesGuard to rbac/ with optional hierarchy support

- docs: improve JSDoc for HttpErrorResponse interface

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

- fix(lint): separate lint:fix script and disable prettier rule
- fix(lint): repair eslint config + remove dead fail() in test
- fix(scripts): correct lint and format glob patterns in package.json
- fix(main): add global ValidationPipe to enforce DTO validation
- fix(passkeys): migrate to @simplewebauthn/server v10 API
- fix(usuarios-rbac): add @common/auth path + CreateUsuarioDto.roles + import-type guard

- scope: descripción (ej. `fix(@common/ai): error en streaming con Gemini`)

### Removed

- scope: descripción (ej. `chore: @types/bcrypt eliminado`)
```
