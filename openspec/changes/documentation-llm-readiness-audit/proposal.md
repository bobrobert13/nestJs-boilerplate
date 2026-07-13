# Proposal: Documentation LLM-Readiness Audit

## Why

La auditoría inicial (revisión manual + análisis cuantitativo) reveló que el
proyecto tiene una **cobertura documental asimétrica**:

| Métrica | Valor actual | Target | Gap |
|---------|-------------|--------|-----|
| Archivos `.md` en raíz | 8 | 6-8 (consolidar) | Duplicación |
| READMEs de packages | 10/10 ✅ | 10/10 | ✅ |
| Specs OpenSpec | 9/10 (falta common) | 10/10 | -1 |
| **JSDoc cobertura** | **3.3%** (3/91 archivos) | **80%+** | **-77%** |
| Docs en `apps/nominas/` | **0%** | **100%** | **-100%** |
| Specs con ≥300 palabras | 7/9 | 9/9 | -2 (http, playwright) |
| Archivos fantasma (referenciados, no existen) | 4 | 0 | -4 |

Un modelo LLM operando en este repositorio:
- ✅ Puede entender QUÉ hace cada módulo (READMEs son buenos)
- ❌ **No puede entender CÓMO usarlo desde código** (sin JSDoc)
- ❌ **Alucina en `apps/nominas/`** (no hay docs de módulos app)

## What Changes

1. **Cerrar gap de JSDoc** en `packages/*/src/**/*.ts` (script automatizado)
2. **Crear docs para `apps/nominas/`** (módulo `usuarios` y `dynamic-schema`)
3. **Crear spec faltante** para `@common/common`
4. **Expandir specs delgados** (`http`, `playwright`)
5. **Eliminar archivos fantasma** + referencias rotas
6. **Consolidar duplicación** entre `BOILERPLATE.md` y `AGENTS.md`
7. **Agregar enforcement** vía lint rule custom para JSDoc
8. **Crear tabla de cobertura IA-Readiness** como métrica observable

## Scope

### In Scope
- `packages/*/src/**/*.ts` → agregar JSDoc
- `packages/*/README.md` → mejorar estado a `complete` donde aplique
- `apps/nominas/src/modules/**` → agregar README + `.llm-context.md`
- `openspec/specs/common/spec.md` → crear
- `openspec/specs/http/spec.md`, `playwright/spec.md` → expandir
- `scripts/audit-docs.js` → nuevo
- `eslint-rules/require-public-jsdoc.js` → nuevo
- `docs/COVERAGE.md` → nuevo

### Out of Scope
- Reescribir lógica de negocio
- Cambiar APIs públicas (breaking changes)
- Migrar de Jest a otro framework de tests
- Crear tests nuevos (solo documentar los existentes)

## Risk

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Lint rule rompe build | Media | Flag `--no-warn` durante primeras semanas |
| JSDoc generado automáticamente es de baja calidad | Media | Revisión humana por paquete antes de marcar complete |
| Conflictos con archivos eliminados en git | Baja | Usar `git rm` para mantener historial |
| Specs nuevos divergen de implementación | Baja | Cada spec se valida con código actual antes de commit |

## Affected Packages

- `@common/auth` (expandir JSDoc)
- `@common/ai` (expandir JSDoc)
- `@common/database` (expandir JSDoc)
- `@common/inngest` (ya complete, mantener)
- `@common/common` (spec nuevo + JSDoc)
- `@common/playwright` (spec expandido + JSDoc)
- `@common/http` (spec expandido + JSDoc)
- `@common/documents` (JSDoc)
- `@common/resend` (JSDoc)
- `@common/serve-static` (JSDoc)
- `apps/nominas/usuarios` (doc nueva)
- `apps/nominas/dynamic-schema` (doc nueva)
- `openspec/specs/common` (spec nuevo)

## Rollback Plan

Si la implementación causa regresiones:

```bash
# 1. Revertir último commit
git revert HEAD --no-edit

# 2. Si el lint rule rompe CI
npm uninstall eslint-plugin-require-jsdoc
# Eliminar regla de eslint.config.mjs

# 3. Si los .llm-context.md confunden al LLM
# Mover a /docs/internal/ (no los borres, son útiles)
```

## Success Criteria

- [ ] `npm run audit:docs` retorna cobertura ≥80%
- [ ] `npm run lint` pasa con regla `require-public-jsdoc` activa
- [ ] `apps/nominas/src/modules/*/` tiene README + `.llm-context.md`
- [ ] `openspec/specs/common/spec.md` existe y tiene ≥5 escenarios
- [ ] `openspec/specs/{http,playwright}/spec.md` tienen ≥300 palabras cada uno
- [ ] Cero referencias rotas a archivos inexistentes
- [ ] `docs/COVERAGE.md` muestra score global ≥85%
- [ ] `npm run build` y `npm run test` pasan sin cambios