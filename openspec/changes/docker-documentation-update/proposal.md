# Proposal: docker-documentation-update

## Why

README.Docker.md desactualizado. Muestra 3 packages, existen 10. No documenta servicios externos (Resend API, AI providers). Env vars incompletas. Troubleshooting no cubre casos comunes.

Inngest excluido — se eliminará del proyecto próximamente.

## What Changes

1. Tree packages: 3 → 10 packages reales
2. Sección "External Service Dependencies": Resend API, AI providers
3. Tabla env vars completa: Auth (JWT, Argon2, 2FA, Passkeys), Resend, Playwright, App
4. Entrypoint script `apps/nominas/entrypoint.sh` documentado
5. Tabla Dev vs Prod mejorada (target stage, entrypoint)
6. Troubleshooting: Resend falla, auth stub, imagen grande, permisos Playwright
7. Cross-references: ARCHITECTURE.md diagrama con externos, AGENTS.md §7, CHANGELOG.md

## Scope

### In Scope
- README.Docker.md — reescritura parcial
- docs/ARCHITECTURE.md — diagrama Docker
- AGENTS.md — sección 7
- CHANGELOG.md — entrada v0.4.0

### Out of Scope
- docker-compose.yml, Dockerfile, docker-compose.dev.yml, docker-test.sh
- Inngest (próxima eliminación)
- JSDoc, tests, cambios de código

## Risk

Bajo. Solo documentación. Riesgo único: diagrama se desincronice pronto. Mitigación: nota "Última actualización: 2026-07-13" + source of truth es docker-compose.yml.
