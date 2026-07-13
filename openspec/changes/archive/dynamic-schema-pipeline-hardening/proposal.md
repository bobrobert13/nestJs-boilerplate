# Proposal: Dynamic Schema Pipeline Hardening

## Why

El módulo `apps/nominas/src/modules/dynamic-schema/` es el único punto de entrada
del sistema para generar schemas Mongoose dinámicamente desde múltiples fuentes.
Una auditoría manual del código revela **16 hallazgos** que van desde problemas
que rompen funcionalidad end-to-end hasta deudas de diseño y ausencia total de
contrato OpenSpec.

El módulo promete 3 fuentes de entrada (texto, imagen, documento) + método
manual, pero:

- La fuente "imagen" **nunca envía la imagen real al LLM** (concatena 100 chars
  en un string, perdiendo el contenido visual).
- El endpoint `compile` **no registra el modelo en Mongoose** — sólo guarda un
  `mongoose.Schema` en un `Map` in-memory que muere al reiniciar.
- El `DynamicSchemaRepository` es un stub puro con métodos no-op.
- No existen specs OpenSpec para el módulo (huérfano del flujo SDD).

Resultado: un usuario que llama `POST /pipeline` recibe `success: true` pero el
modelo **nunca queda disponible** para `mongoose.connection.model(name)` ni
para `@InjectModel()`.

## What Changes

1. **Auditar y documentar los 16 hallazgos** en este proposal + spec nuevo.
2. **Crear spec OpenSpec** para el dominio `dynamic-schema` (5 requisitos, ~20
   escenarios Given/When/Then).
3. **Refactor del paquete `@common/ai`**: vision real multi-provider
   (image_url/source/inline_data), structured-output retry, metadata de fuente.
4. **Refactor del módulo `dynamic-schema`**: registro REAL del modelo en
   Mongoose via `connection.model()`, validación de `collectionName`, soporte
   completo de `array`/`object` con `items`/`properties`, persistencia en
### 🟡 Medios (8)

| # | Hallazgo | Ubicación | Síntoma |
|---|----------|-----------|---------|
| 6 | `collectionName` sin validación de formato | `schema-compiler.service.ts:22-29` | Acepta "users 123" o "system.users". |
| 7 | `type: 'array'` → `[Object]` sin tipo de elementos | `schema-compiler.service.ts:108` | Pierde semántica de arrays tipados. |
| 8 | `type: 'object'` sin `properties` | `schema-compiler.service.ts:109` | Objetos anidados no representables. |
| 9 | Retry de AI ante JSON inválido reusa el mismo prompt | `packages/ai/src/ai.service.ts:476-504` | Sin `response_format`, sin temperature=0. |
| 10 | Validación post-generación ausente | `dynamic-schema.service.ts:48-53` | Error 500 si LLM devuelve tipo inválido. |
| 11 | No hay spec OpenSpec para `dynamic-schema` | `openspec/specs/` | Módulo huérfano del flujo SDD. |
| 12 | Cero tests del pipeline | repo completo | Riesgo de regresión alto. |
| 13 | Sin observabilidad | `dynamic-schema.service.ts` | Sólo `logger.log` ad-hoc. |

### 🟢 Bajos (3)

| # | Hallazgo | Ubicación | Síntoma |
|---|----------|-----------|---------|
| 14 | Sin rehidratación al arranque | `dynamic-schema.module.ts` | Map vacío tras reinicio. |
| 15 | `extractDocument` no valida `format` contra enum | `dynamic-schema.service.ts:120` | Llega al processor y depende de que tire. |
| 16 | Sin idempotencia en `compile` | `schema-compiler.service.ts:45` | Sobrescribe silenciosamente. |

### Notas de contexto

- `ai.service.ts:120-160` tiene un método `generateSchema()` **alternativo** que
  genera código TypeScript completo con decoradores (`@Schema()`, `@Prop()`) en
  vez del `GeneratedSchema` JSON. **No es usado** por el módulo
  `dynamic-schema`. Documentado para no confundir.
- El pipeline soporta **5 entry points** actuales (texto, imagen, doc, manual,
  extract-only) + un **pipeline compuesto** (extract → generate → compile). Los
  3 nuevos extienden este set a **8 entry points** + 2 endpoints de lifecycle.

## Scope

### In Scope

- `apps/nominas/src/modules/dynamic-schema/**` (refactor + nuevas features)
- `packages/ai/src/**` (vision real, retry, metadata)
- `packages/ai/README.md` (documentar vision multi-provider)
- `apps/nominas/src/modules/dynamic-schema/README.md` (tabla de fuentes)
- `openspec/specs/dynamic-schema/spec.md` (nuevo)
- Delta specs: `ai`, `documents`, `database`
- `AGENTS.md` sección 12 (dashboard actualizado)

### Out of Scope

- Tests e2e (cubierto en change futuro `add-dynamic-schema-tests`)
- Migración a OpenTelemetry (sólo métricas in-memory por ahora)
- Reescritura completa del `OpenAICompatibleProvider` (sólo se extiende `chat`)
- Cambiar el formato de `GeneratedSchema` existente (sólo se añaden campos
  opcionales: `source`, `options`, `items`, `properties`, `ref`, `enum`,
  `index`, `unique`).

## Risk

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Romper contratos del endpoint `compile` existente | Alta | Flag `DYNAMIC_SCHEMA_LEGACY=true` mantiene comportamiento antiguo (sólo `Map`). Default = nuevo comportamiento. |
| Cambios en `@common/ai` rompen otros consumidores | Media | `@common/ai` es `@Global()`, pero `generateSchemaFromText/Image` mantienen firma. Aditivos sólo. |
| Persistencia en `DynamicSchema` collection requiere migration | Baja | Se auto-crea la collection al primer `registerSchema()` (Mongoose). |
| Vision multi-provider diverge entre OpenAI/Anthropic/Google | Media | Capability check explícito, error claro `VISION_NOT_SUPPORTED` si provider no soporta. |
| DSL parser ambiguo | Baja | DSL minimalista (sin expresiones), sintaxis cerrada, errores con línea/columna. |

## Affected Packages

- `@common/ai` (vision, retry, metadata)
- `@common/documents` (format enum validation, pipeline chaining)
- `@common/database` (dynamic model registration, model existence)
- `apps/nominas/dynamic-schema` (refactor + 3 fuentes nuevas + lifecycle)

## Rollback Plan

```bash
# 1. Revertir merge del PR
git revert -m 1 <merge-commit-sha>

# 2. Si quedan registros huérfanos en DynamicSchema collection
mongosh <uri> --eval 'db.dynamic_schemas.drop()'

# 3. Activar modo legacy (sólo si el revert no es suficiente)
DYNAMIC_SCHEMA_LEGACY=true npm run start:prod
```

El flag `DYNAMIC_SCHEMA_LEGACY=true` en `SchemaCompilerService` mantiene el
comportamiento previo (Map in-memory, sin persistencia) mientras el resto del
sistema sigue funcionando.

## Success Criteria

- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores
- [ ] `openspec/specs/dynamic-schema/spec.md` existe con ≥5 requisitos y ≥15 escenarios
- [ ] Delta specs mergeados a `openspec/specs/{ai,documents,database}/spec.md`
- [ ] `SchemaCompilerService.compileAndRegister()` llama a `connection.model()`
- [ ] `generateSchemaFromImage` envía la imagen real como `content: [{type:'image_url',...}]`
- [ ] `POST /pipeline` registra el modelo y queda accesible vía `@InjectModel`
- [ ] `GET /schemas` lista los schemas registrados con metadata de fuente
- [ ] `OnModuleInit` rehidrata schemas desde Mongo
- [ ] 3 nuevos endpoints funcionan: `compile-from-json-schema`, `compile-from-dsl`, `infer-from-collection`
- [ ] JSDoc agregado en todos los nuevos exports públicos
- [ ] `apps/nominas/src/modules/dynamic-schema/README.md` documenta las 8 fuentes
- [ ] `AGENTS.md` sección 12 refleja el cambio
   `DynamicSchema` collection, rehidratación al arranque.
5. **Tres fuentes nuevas**: JSON Schema (draft-07), DSL declarativo
   (`Entity { ... }`), e inferencia desde colección Mongo existente.
6. **Endpoints nuevos de lifecycle**: `GET /schemas`, `DELETE /schemas/:name`,
   `POST /compile/dry-run` (validación sin registro).
7. **Observabilidad**: métricas in-memory (counters por provider/source), logs
   estructurados.
8. **Delta specs** en `ai`, `documents` y `database`.

## Findings (Auditoría)

### 🔴 Críticos (5)

| # | Hallazgo | Ubicación | Síntoma |
|---|----------|-----------|---------|
| 1 | `generateSchemaFromImage` no envía la imagen real | `packages/ai/src/ai.service.ts:347` | Concatena `imageData.substring(0,100)` al prompt, el LLM recibe sólo texto. |
| 2 | `SchemaCompilerService` no registra el modelo | `apps/nominas/src/modules/dynamic-schema/services/schema-compiler.service.ts:40-49` | `new Schema(...)` + `Map.set(name, schema)`. Nunca llama `connection.model()`. |
| 3 | No hay `MongooseModule.forFeature` dinámico | `dynamic-schema.module.ts:9-19` | Imposible inyectar el modelo compilado en otros servicios. |
| 4 | `DynamicSchemaRepository` es stub puro | `dynamic-schema.repository.ts:1-26` | `findAll → []`, `create → data`, `update → null`. |
| 5 | Schemas no persisten entre reinicios | `schema-compiler.service.ts:8` | `private readonly compiledSchemas: Map` in-memory. |