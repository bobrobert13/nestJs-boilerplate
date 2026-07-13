# OpenSpec SDD Workflow

> Spec-Driven Development workflow for every significant change in the project.

OpenSpec es el sistema de especificaciones por cambios (Spec-Driven Development). Todo cambio significativo en el proyecto debe pasar por este flujo.

---

## OpenSpec Structure

```
openspec/
├── config.yaml              ← Configuración del proyecto
├── specs/                   ← Source of truth (specs principales)
│   ├── auth/spec.md
│   ├── ai/spec.md
│   ├── database/spec.md
│   ├── email/spec.md
│   ├── documents/spec.md
│   ├── http/spec.md
│   ├── playwright/spec.md
│   └── serve-static/spec.md
├── changes/                 ← Cambios activos
│   ├── {change-name}/       ← Carpeta del cambio activo
│   │   ├── state.yaml       ← Estado del DAG
│   │   ├── proposal.md      ← Propuesta
│   │   ├── specs/           ← Delta specs
│   │   ├── design.md        ← Diseño técnico
│   │   ├── tasks.md         ← Checklist de tareas
│   │   └── verify-report.md ← Reporte de verificación
│   └── archive/             ← Cambios completados
```

---

## SDD Flow for Each Change

```
/sdd-new <change-name>     → Crea proposal + specs + design + tasks
/sdd-continue <change-name> → Ejecuta la siguiente fase disponible
/sdd-verify <change-name>   → Verifica contra specs
/sdd-archive <change-name>  → Archiva el cambio (mergea deltas a main specs)
```

---

## Cycle Phases

| Fase | Output | Depende de | Descripción |
|------|--------|------------|-------------|
| proposal | `proposal.md` | — | Qué, por qué, alcance, riesgos |
| specs | `specs/{domain}/spec.md` | proposal | Requisitos con Given/When/Then |
| design | `design.md` | proposal | Decisiones técnicas, diagramas |
| tasks | `tasks.md` | specs + design | Checklist de implementación |
| apply | Cambios en código | tasks | Implementación |
| verify | `verify-report.md` | tasks + specs | Validación |
| archive | Mover a archive/ | verify | Merge specs + archivo |

---

## OpenSpec Rules

1. **Nunca** modificar `openspec/specs/` directamente. Los cambios se hacen via delta specs en `openspec/changes/{name}/` y se mergean al archivar.
2. **Siempre** leer las specs del dominio afectado antes de implementar.
3. **Cada cambio debe tener al menos** un proposal y un spec. Design y tasks son recomendados.
4. **Al archivar**, el delta spec se mergea al main spec del dominio.
5. **Commitel mensaje**: `feat({domain}): {desc}` o `fix({domain}): {desc}` para cambios con spec.
6. **state.yaml** se actualiza automáticamente en cada fase. No modificarlo manualmente.

---

## Finding Specs by Domain

```bash
# Encontrar spec de un dominio
openspec/specs/<domain>/spec.md

# Ver cambios activos
ls openspec/changes/

# Ver cambios archivados
ls openspec/changes/archive/
```

Si un agente IA necesita entender cómo funciona un módulo, DEBE leer primero:
1. `openspec/specs/{domain}/spec.md` — contrato del módulo
2. `packages/{name}/README.md` — documentación de uso
3. El código fuente — implementación

---

## Topic Keys & State Management

Cada cambio activo se almacena en `openspec/changes/{change-name}/` y se rastrea mediante `state.yaml`.

| Artifact | Ruta dentro del cambio |
|----------|------------------------|
| Proposal | `openspec/changes/{change-name}/proposal.md` |
| Delta spec | `openspec/changes/{change-name}/specs/{domain}/spec.md` |
| Design | `openspec/changes/{change-name}/design.md` |
| Tasks | `openspec/changes/{change-name}/tasks.md` |
| Verify report | `openspec/changes/{change-name}/verify-report.md` |
| State / DAG | `openspec/changes/{change-name}/state.yaml` |

> `state.yaml` se actualiza automáticamente en cada fase. No modificarlo manualmente.

---

## Appendix: AI Decision Flow Diagram

```mermaid
flowchart TD
    A[Tarea asignada] --> B{¿Qué tipo de cambio?}
    B -->|Nuevo| C0[Leer openspec/specs del dominio]
    B -->|Modificar| D[Leer README del paquete + openspec/specs]

    C0 --> C{¿Paquete o Módulo?}

    C -->|Paquete| F[Crear en packages/]
    C -->|Módulo| G[Crear en apps/nominas/src/modules/]

    F --> H[README.md + JSDoc + tsconfig + nest-cli]
    G --> I[Módulo NestJS estándar + Swagger]

    D --> J[Hacer cambio]
    H --> J
    I --> J

    J --> K0{¿Cambio significativo?}
    K0 -->|Sí| L0[/sdd-new change-name → proposal → specs → design → tasks]
    K0 -->|No| K

    L0 --> K
    K[Correr: npm run build]
    K --> L{¿Build OK?}
    L -->|Sí| M[Correr: npm run lint]
    L -->|No| J
    M --> N{¿Lint OK?}
    N -->|Sí| O[Checklist pre-commit]
    N -->|No| J
    O --> P[Commit + Push]
```
