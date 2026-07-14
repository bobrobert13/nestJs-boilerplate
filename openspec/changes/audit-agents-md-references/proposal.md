# Proposal: audit-agents-md-references

## What
Auditar y corregir `AGENTS.md` para eliminar referencias fantasma, agregar módulos no documentados, y sincronizar el índice con el estado real del proyecto.

## Why
La auditoría encontró 6 referencias críticas a archivos/directorios que no existen, 5 omisiones de módulos existentes, y 4 imprecisiones menores. Un LLM o desarrollador confiando en AGENTS.md recibiría información incorrecta o incompleta.

## Scope

### In Scope
- C1: Eliminar `@common/inngest` de todas las secciones (§3, §4, §6, §12, §13) — es un fantasma, el package no existe
- C2: Eliminar referencia a `apps/nominas/src/modules/auth/src/two-factor/README.md` de §11
- C3: Eliminar referencia a `apps/nominas/src/modules/auth/README.md` de §13
- C4: Eliminar link roto a `packages/inngest/README.md` de §4 matriz
- C5: Eliminar `@common/inngest` de tsconfig paths en §6
- C6: Eliminar `inngest/spec.md` del directorio de specs en §3
- H1: Agregar `apps/nominas/src/modules/scraper/` a §4, §12, §13
- H2: Agregar `apps/nominas/src/modules/health/` a §4, §12, §13
- H3: Completar §3 directorio de specs con `common/`, `documentation/`, `dynamic-schema/`
- H4: Agregar scraper y health a §12 tabla de documentación
- H5: Agregar scraper, health, usuarios a §13 Cross-Reference Matrix
- M1: Arreglar anchor en §1 nota git hooks
- M3: Limpiar líneas vacías en §9
- M4: Revisar marcador REQUIRED de INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY
- L1: Aclarar status de `dynamic-schema-complete-pipeline`

### Out of Scope
- M2: Ajustar status de `@common/common` en matriz — requiere verificar JSDoc primero
- L3: Verificar versión de Argon2 en package.json — es de mantenimiento separado
- L4: Revisar relevancia de @simplewebauthn — fuera del alcance de esta auditoría

## Risks
- Bajo: solo se modifican archivos de documentación, no código
- Algunos cambios pueden requerir rebuild si afectan a `tsconfig.json`

## Estimated Effort
- ~30 minutos de edición
- 0 cambios en código fuente
