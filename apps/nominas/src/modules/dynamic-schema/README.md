<!-- apps/nominas/src/modules/dynamic-schema — status: complete -->

# Modulo Dynamic Schema

Modulo de generacion dinamica de schemas Mongoose desde multiples fuentes de entrada. Acepta texto, imagen, documento (PDF/DOCX), JSON Schema draft-07, DSL declarativo, inferencia desde coleccion Mongo, o un `GeneratedSchema` manual; produce un schema Mongoose registrado de verdad en la conexion activa y persistido para rehidratacion al arranque.

## Proposito

Permitir crear definiciones de entidades (schema Mongoose) automaticamente a partir de:

- Texto en lenguaje natural
- Imagen (vision real multi-provider: OpenAI / Anthropic / Google)
- Documento PDF o DOCX (extrayendo texto primero via `@common/documents`)
- JSON Schema draft-07 (mapeo deterministico, sin AI)
- DSL declarativo mini-lenguaje (parser local, sin AI)
- Coleccion Mongo existente (inferencia por sampleo, sin AI)
- `GeneratedSchema` manual enviado por el cliente

## Arquitectura

```
Controller (8 endpoints POST + 2 lifecycle)
       |
       v
DynamicSchemaService (orquesta)
       |
       +-> SchemaRegistryService (compile + persist + rehydrate)
       |        |
       |        +-> SchemaCompilerService (connection.model())
       |        +-> DynamicSchemaRepository (DynamicSchemaEntity collection)
       |
       +-> AiService (@common/ai) - vision real + structured retry
       +-> DocumentProcessorService (@common/documents)
```
## Fuentes de entrada (8)

| # | Endpoint | Fuente | Backend | Persiste |
|---|----------|--------|---------|----------|
| 1 | `POST /api/dynamic-schema/extract` | PDF/DOCX (base64) | `@common/documents` | No |
| 2 | `POST /api/dynamic-schema/generate-from-text` | Texto libre | `AiService.generateSchemaFromText` | No |
| 3 | `POST /api/dynamic-schema/generate-from-image` | Imagen (base64) | `AiService.generateSchemaFromImage` (vision real) | No |
| 4 | `POST /api/dynamic-schema/compile` | `GeneratedSchema` JSON | manual + `SchemaCompilerService` | **Si** |
| 5 | `POST /api/dynamic-schema/compile/dry-run` | `GeneratedSchema` JSON | solo validacion | No |
| 6 | `POST /api/dynamic-schema/compile-from-json-schema` | JSON Schema draft-07 | mapeo deterministico | **Si** |
| 7 | `POST /api/dynamic-schema/compile-from-dsl` | DSL `Entity { ... }` | parser local | **Si** |
| 8 | `POST /api/dynamic-schema/infer-from-collection/:collectionName` | Coleccion Mongo | sampleo 50 docs | **Si** |
| 9 | `POST /api/dynamic-schema/pipeline` | PDF/DOCX + provider | extract + generate + compile + register | **Si** |

## Lifecycle endpoints (2)

| Method | Path | Descripcion |
|--------|------|-------------|
| GET | `/api/dynamic-schema/schemas` | Lista metadata de schemas registrados |
| DELETE | `/api/dynamic-schema/schemas/:collectionName` | Da de baja modelo + metadata |

## Validaciones

Toda llamada a `compile` ejecuta:

1. `validateCollectionName(name)` regex `^[a-z][a-z0-9_]{0,63}$` + reserved words (`system`, `admin`, `local`, `config`, `__schema__`).
2. `validateFields(fields)` recursivo: tipos validos, `array` requiere `items`, `object` requiere `properties`, nombres como JS identifiers, no duplicados.
3. Computa `fieldsHash` (FNV-1a) sobre la lista normalizada. Si ya existe con mismo hash => **idempotent** sin re-registrar.
4. Solo si todo pasa: `connection.model(collectionName, mongooseSchema)` + persistencia en `DynamicSchemaEntity`.

Codigos de error estandarizados: `SCHEMA_VALIDATION_ERROR`, `SCHEMA_COMPILATION_ERROR`, `SCHEMA_GENERATION_ERROR`, `VISION_NOT_SUPPORTED`, `DSL_PARSE_ERROR`, `INFERENCE_ERROR`, `DUPLICATE_COLLECTION_NAME`, `COLLECTION_NOT_FOUND`, `REPOSITORY_ERROR`.
## Rehidratacion al arranque

`SchemaRegistryService.onModuleInit()` lee todos los documentos de `DynamicSchemaEntity`, los parsea como `GeneratedSchema`, y llama `SchemaCompilerService.rehydrate()` que los registra via `connection.model()`. Log final: `rehydration complete: rehydrated=N errors=M`.

Si el flag `DYNAMIC_SCHEMA_LEGACY=true` esta activo, el servicio salta la rehidratacion y mantiene el comportamiento previo (Map in-memory, sin `connection.model()`).

## Tipos soportados

`SchemaFieldDefinition.type` admite: `string`, `number`, `boolean`, `date`, `array`, `object`, `mixed`, `objectId`.

Atributos por campo: `required`, `unique`, `index`, `ref`, `default`, `enum`, `validate`, `items` (si `type=array`), `properties` (si `type=object`).

A nivel schema: `timestamps` (default true), `options.strict`, `options.versionKey`, `options.minimize`.

## DynamicSchemaModule

```typescript
@Module({
  imports: [
    AiModule,
    DocumentsModule,
    MongooseModule.forFeature([{ name: DynamicSchemaEntity.name, schema: DynamicSchemaSchema }]),
  ],
  controllers: [DynamicSchemaController],
  providers: [DynamicSchemaService, DynamicSchemaRepository, SchemaCompilerService, SchemaRegistryService],
  exports: [DynamicSchemaService, SchemaRegistryService, SchemaCompilerService],
})
export class DynamicSchemaModule {}
```

## Configuracion Requerida

- `OPENAI_API_KEY` (o el provider AI que se use)
- `MONGODB_URI` con replica set si se quiere atomicidad en `pipeline`
- `DYNAMIC_SCHEMA_LEGACY=true` para rollback al comportamiento previo

## Auditoria

Ver `openspec/changes/dynamic-schema-pipeline-hardening/proposal.md` para los 16 hallazgos (5 criticos, 8 medios, 3 bajos) y el plan de mejora completo.

## Status

- **Spec OpenSpec**: `openspec/specs/dynamic-schema/spec.md` (25 escenarios Given/When/Then)
- **Documentacion**: complete
- **JSDoc**: pending (Fase 3)
- **Tests**: sin tests (cubierto en change futuro `add-dynamic-schema-tests`)