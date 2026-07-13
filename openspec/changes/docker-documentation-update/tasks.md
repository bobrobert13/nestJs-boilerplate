# Tasks: docker-documentation-update — ALL DONE

## 1 — Tree packages actualizado
- [x] Reemplazar tree packages en README.Docker.md (3 → 10)
- [x] Agregar nota: packages via nest-cli.json paths

## 2 — External Service Dependencies
- [x] Crear sección en README.Docker.md
- [x] Tabla: Resend API, AI Providers
- [x] Inngest excluido

## 3 — Tabla env vars completa
- [x] Auth JWT: 5 vars
- [x] Auth Argon2: 4 vars
- [x] Auth 2FA/TOTP: 6 vars
- [x] Auth Passkeys: 3 vars
- [x] Auth Magic Link: 2 vars
- [x] Resend: 4 vars
- [x] Playwright: 3 vars
- [x] App: PORT, MONGODB_URI, NODE_ENV
- [x] Marcar REQUIRED vs opcional en tablas

## 4 — Entrypoint script documentado
- [x] entrypoint.sh: validate build, Playwright setup, permissions
- [x] PLAYWRIGHT_BROWSERS_PATH, usuario nodejs

## 5 — Tabla Dev vs Prod mejorada
- [x] Target stage, entrypoint columnas agregadas
- [x] Nota docker-compose.dev.yml target: development

## 6 — Troubleshooting expandido
- [x] Resend no envía emails
- [x] Auth stub demo
- [x] Imagen ~3.2GB (Chromium)
- [x] Playwright permisos
- [x] Inngest NO agregado

## 7 — Cross-references
- [x] docs/ARCHITECTURE.md — diagrama Docker con externos
- [x] docs/COMMANDS.md — sin cambios (ya referencia README.Docker.md)
- [x] AGENTS.md §7 — endpoints, checklist, notas actualizados
- [x] CHANGELOG.md — entrada v0.4.0

# Tasks: docker-documentation-update

## 1 — Tree packages actualizado
- [x] Reemplazar tree packages en README.Docker.md (3 → 10)
- [x] Agregar nota: packages via nest-cli.json paths

## 2 — External Service Dependencies
- [ ] Crear sección en README.Docker.md
- [ ] Tabla: Servicio | Tipo | Env Key | Puerto
  - Resend API (externo, RESEND_API_KEY, —)
  - AI Providers (externo, config via @common/ai, —)
- [ ] Inngest excluido (próxima eliminación)

## 3 — Tabla env vars completa
- [ ] Auth JWT: 5 vars (SECRET, ACCESS_TTL, REFRESH_TTL, ISSUER, AUDIENCE)
- [ ] Auth Argon2: 4 vars (TYPE, MEMORY_COST, TIME_COST, PARALLELISM)
- [ ] Auth 2FA: 5 vars (ISSUER, ALGORITHM, DIGITS, PERIOD, BACKUP_CODES_COUNT, LENGTH)
- [ ] Auth Passkeys: 3 vars (RP_ID, RP_NAME, ORIGIN)
- [ ] Resend: 4 vars (API_KEY, FROM_EMAIL, FROM_NAME, REPLY_TO)
- [ ] Playwright: 3 vars (HEADLESS, TIMEOUT, RETRIES)
- [ ] App: PORT, MONGODB_URI, NODE_ENV
- [ ] Marcar REQUIRED vs opcional

## 4 — Entrypoint script documentado
- [ ] Explicar entrypoint.sh: validate build, setup Playwright, fix permissions
- [ ] PLAYWRIGHT_BROWSERS_PATH=/opt/playwright/browsers
- [ ] Usuario non-root nodejs (UID 1001)
- [ ] Debug permisos Playwright: `docker exec boilerplate-service ls -la /opt/playwright/browsers`

## 5 — Tabla Dev vs Prod mejorada
- [ ] Agregar fila: "Target Stage" → development | production
- [ ] Agregar fila: "Entrypoint" → npm run start:dev | entrypoint.sh + node dist/...
- [ ] Nota: docker-compose.dev.yml usa `target: development`

## 6 — Troubleshooting expandido
- [ ] "Resend emails no se envían" → RESEND_API_KEY
- [ ] "Auth no funciona" → reemplazar stub demo@example.com
- [ ] "Imagen ~3.2GB" → Chromium, sugerencias slim si no usa Playwright
- [ ] "Playwright sin permisos" → docker exec chmod +x
- [ ] Inngest troubleshooting NO agregar

## 7 — Cross-references
- [ ] docs/ARCHITECTURE.md: actualizar diagrama Docker (agregar Resend, AI providers como externos, quitar Inngest)
- [ ] docs/COMMANDS.md: verificar y alinear con README.Docker.md
- [ ] AGENTS.md §7: actualizar checklist y notas
- [ ] CHANGELOG.md: entrada v0.4.0
