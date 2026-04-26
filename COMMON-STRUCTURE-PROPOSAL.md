# 📂 Propuesta de Reorganización de `src/common/`

## 1️⃣ Objetivo
Aplicar las mejores prácticas de NestJS (según el skill *nestjs‑best‑practices*) para conseguir:

* Modularidad explícita.
* Separación clara de infraestructura, lógica de dominio y cross‑cutting concerns.
* Código más fácil de testear y escalar.
* Rutas de importación cortas y estables.

---

## 2️⃣ Principios de NestJS que guían la reorganización
| Principio | Implementación |
|-----------|----------------|
| **Modularidad** | Cada capa tiene su propio módulo (`DatabaseModule`, `PlaywrightModule`, `InngestModule`). |
| **Inyección de Dependencias** | Todos los servicios se inyectan vía constructor; nunca se usa Service Locator. |
| **Separación de Concerns** | `adapters/` (transformación), `filters/` (excepciones), `utils/` (helpers), `config/` (variables de entorno). |
| **ConfigModule** | Centraliza y valida variables de entorno con `EnvSchema`. |
| **Barrels** (`index.ts`) | Re‑exporta símbolos para importaciones tipo `import { PlaywrightService } from '@/common/infrastructure/playwright';`. |
| **Tipo‑safety** | Uso de `type`/`interface`, `readonly` y evitación de `any`. |
| **Testing** | La separación de infraestructura permite mockear módulos completos en pruebas unitarias. |
| **Documentación** | Cada sub‑módulo incluye JSDoc y un pequeño `README.md`. |

---

## 3️⃣ Nuevo árbol de carpetas
```
src/
├─ app.module.ts
├─ common/
│   ├─ config/
│   │   ├─ env.schema.ts
│   │   ├─ app-config.service.ts
│   │   └─ index.ts
│   ├─ infrastructure/
│   │   ├─ database/
│   │   │   ├─ schemas/
│   │   │   ├─ repositories/
│   │   │   └─ index.ts
│   │   ├─ playwright/
│   │   │   ├─ playwright.service.ts
│   │   │   └─ index.ts
│   │   ├─ inngest/
│   │   │   ├─ inngest.service.ts
│   │   │   ├─ serve/
│   │   │   │   ├─ inngest.controller.ts
│   │   │   │   └─ inngest-events.controller.ts
│   │   │   └─ index.ts
│   │   └─ ... (futuras integraciones)
│   ├─ adapters/
│   │   ├─ manhwaweb.adapter.ts
│   │   └─ index.ts
│   ├─ filters/
│   │   ├─ http-exception.filter.ts
│   │   └─ index.ts
│   └─ utils/
│       ├─ constants.ts
│       └─ index.ts
├─ scrapping/
│   ├─ strategies/
│   │   ├─ orchestrator/
│   │   │   └─ orchestrator.service.ts
│   │   └─ manhwaweb/
│   │       └─ manhwaweb.strategy.ts
│   ├─ scrapping.controller.ts
│   ├─ scrapping.service.ts
│   └─ scrapping.module.ts
└─ main.ts
```
---

## 4️⃣ Plan de acción (road‑map)
| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| **1** | Crear la nueva estructura de carpetas. | Directorios listos para recibir archivos. |
| **2** | Mover los archivos actuales a sus nuevos destinos. | Código físico organizado. |
| **3** | Generar `index.ts` (barrels) en cada sub‑carpeta. | Importaciones simplificadas. |
| **4** | Refactorizar todos los `import` del proyecto. | Compilación sin errores. |
| **5** | Implementar los módulos Nest (`DatabaseModule`, `PlaywrightModule`, `InngestModule`). | Cada módulo exporta sus providers y puede ser importado en `ScrappingModule`. |
| **6** | Inyectar los nuevos módulos en `ScrappingModule` (y en otros feature‑modules si aparecen). | Dependencias resueltas vía DI. |
| **7** | Ajustar los tests (rutas de imports, mocks). | `npm run test` pasa sin fallos. |
| **8** | Ejecutar lint & format. | Código limpio y coherente. |
| **9** | Documentar la arquitectura (`ARCHITECTURE.md` o actualización de `AGENTS.md`). | Equipo alineado y referencia futura. |
| **10** | Commit & Pull Request (`refactor(common): restructure shared modules into clear layers`). | Cambios revisados y mergeados. |
---

## 5️⃣ Checklist de *Best Practices* (post‑migración)
- [ ] Cada módulo tiene `providers` y `exports` explícitos.  
- [ ] Configuración global mediante `ConfigModule` + schema.  
- [ ] Logger de NestJS disponible en todos los servicios.  
- [ ] Exception filters registrados globalmente.  
- [ ] DTOs validados con `class-validator`.  
- [ ] No se utiliza `any`.  
- [ ] Tests unitarios usan mocks de los módulos de infraestructura.  
- [ ] Todos los imports usan alias (`@/common/...`).

---

## 6️⃣ Próximos pasos
1. **Crear la rama `refactor/common-structure`** desde `main`.  
2. **Aplicar el plan** siguiendo el roadmap anterior.  
3. **Abrir PR** y solicitar revisión de arquitectura.

---

*Fin de la propuesta*. Si necesitas aclaraciones adicionales o quieres ajustar algún detalle antes de empezar, avísame. 🚀