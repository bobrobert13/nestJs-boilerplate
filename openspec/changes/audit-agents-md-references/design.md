# Design: AGENTS.md Reference Audit

## Approach
Edición directa de `AGENTS.md`. No se toca código fuente, no se modifican specs de dominio, no se agregan/eliminan packages reales.

## Changes by Section

| Section | Change |
|---------|--------|
| §1 | `#issues-conocidos` → `#12-project-status-dashboard` |
| §3 | Agregar `common/`, `documentation/`, `dynamic-schema/` al árbol de directorios. Eliminar `inngest/`. |
| §4 | Eliminar fila `@common/inngest` de la matriz. Eliminar notas de `@common/inngest`. Eliminar del diagrama de dependencias. Agregar `scraper` y `health` como módulos de app. |
| §6 | Eliminar `@common/inngest` de tsconfig paths. Cambiar marcadores de INNGEST_EVENT_KEY e INNGEST_SIGNING_KEY de `⚠️ REQUIRED` a `✓ optional` con nota aclaratoria. |
| §9 | Limpiar líneas vacías sobrantes. |
| §11 | Eliminar `two-factor/README.md`. |
| §12 | Eliminar `@common/inngest` de tabla de documentación por paquete. Agregar `scraper` y `health`. |
| §13 | Eliminar `inngest` de Cross-Reference Matrix. Agregar `scraper`, `health`, `usuarios`. |

## Files Modified
- `AGENTS.md` solo

## Files Not Modified
- No code changes
- No spec changes (delta specs in `specs/agents/spec.md` document what changed)
- No config changes
