# Tasks: Dynamic Schema Pipeline Hardening

## Phase 0 - Audit (read-only)

- [x] 0.1 Crear openspec/changes/dynamic-schema-pipeline-hardening/proposal.md con 16 hallazgos
- [x] 0.2 Crear state.yaml con DAG del change
- [x] 0.3 Documentar 5 criticos + 8 medios + 3 bajos en proposal.md

## Phase 1 - OpenSpec (contratos)

- [x] 1.1 Crear openspec/specs/dynamic-schema/spec.md (delta) con 25 escenarios
- [x] 1.2 Delta spec: openspec/specs/ai/spec.md (vision + retry + metadata)
- [x] 1.3 Delta spec: openspec/specs/documents/spec.md (format enum + chain)
- [x] 1.4 Delta spec: openspec/specs/database/spec.md (dynamic registration)
- [x] 1.5 Crear design.md (diagramas + decisiones + contratos)
- [x] 1.6 Crear tasks.md (este archivo)

## Phase 2 - Refactor @common/ai (vision real + retry)

- [ ] 2.1 Anadir MessageContentPart type en packages/ai/src/types/ai.types.ts
- [ ] 2.2 Ampliar ChatMessage.content a string | MessageContentPart[]
- [ ] 2.3 Refactor OpenAICompatibleProvider.chat() para serializar content multimodal por provider
- [ ] 2.4 Capability check: si vision=false -> error VISION_NOT_SUPPORTED
- [ ] 2.5 Reescribir AiService.generateSchemaFromImage() con content array real
- [ ] 2.6 Retry en generateSchemaFromText/Image: response_format json_object + temperature 0
- [ ] 2.7 Adjuntar usage + metadata.generatedAt en AIResponse
- [ ] 2.8 JSDoc en metodos publicos nuevos/modificados de @common/ai
- [ ] 2.9 Actualizar packages/ai/README.md con seccion Vision multi-provider

## Phase 3 - Core refactor dynamic-schema (registro real + validacion)

- [ ] 3.1 Crear interfaces/schema-source.enum.ts
- [ ] 3.2 Extender interfaces/generated-schema-extended.interface.ts (source, options, items, properties, ref, enum, index, unique)
- [ ] 3.3 Crear validators/collection-name.validator.ts (regex + reserved words)
- [ ] 3.4 Crear validators/schema-field.validator.ts (tipos ampliados + items/properties)
- [ ] 3.5 Refactor services/schema-compiler.service.ts:
  - Inyectar @InjectConnection()
  - Metodo compileAndRegister(schema, options) -> connection.model() + persist
  - Metodo compileOnly(schema) (dry-run)
  - fieldsHash sha256 para idempotencia
  - Soporte array items, object properties, ref, index, unique, enum
- [ ] 3.6 Crear services/schema-registry.service.ts (persiste en DynamicSchema, list, unregister, rehydrate)
- [ ] 3.7 Crear services/pipeline-metrics.service.ts (counters in-memory)
- [ ] 3.8 Flag DYNAMIC_SCHEMA_LEGACY=true mantiene comportamiento previo
- [ ] 3.9 OnModuleInit: rehidrata schemas desde DynamicSchema collection
- [ ] 3.10 JSDoc en todos los servicios
- [ ] 3.11 Refactor services/dynamic-schema.service.ts como orquestador de adapters (Strategy)

## Phase 4 - Source Adapters (Strategy pattern)

- [ ] 4.1 Crear adapters/source-adapter.interface.ts (interfaz comun)
- [ ] 4.2 adapters/text-source.adapter.ts -> AiService.generateSchemaFromText
- [ ] 4.3 adapters/image-source.adapter.ts -> AiService.generateSchemaFromImage
- [ ] 4.4 adapters/document-source.adapter.ts -> DocumentProcessor + TextSourceAdapter
- [ ] 4.5 adapters/json-schema-source.adapter.ts -> mapea JSON Schema draft-07 (sin AI)
- [ ] 4.6 adapters/dsl-source.adapter.ts -> parser mini-DSL (sin AI)
- [ ] 4.7 adapters/mongo-inference-source.adapter.ts -> sample docs (sin AI)

## Phase 5 - Controller + DTOs

- [ ] 5.1 Anadir DTOs: CompileFromJsonSchemaDto, CompileFromDslDto, CompileDryRunDto
- [ ] 5.2 Validar ExtractDocumentDto.format con IsEnum(DocumentFormat)
- [ ] 5.3 Anadir endpoints GET /schemas, DELETE /schemas/:name, GET /metrics
- [ ] 5.4 Anadir endpoints POST /compile/dry-run, /compile-from-json-schema, /compile-from-dsl, /infer-from-collection/:name
- [ ] 5.5 Swagger decorators (@ApiOperation, @ApiResponse) en todos los endpoints
- [ ] 5.6 Mantener compatibilidad con /compile existente (mismo response shape + campos adicionales)

## Phase 6 - Repositorio + persistencia

- [ ] 6.1 Crear real DynamicSchemaRepository con @InjectModel(DynamicSchema)
- [ ] 6.2 Metodos: findByCollectionName, findAll, create, remove
- [ ] 6.3 MongooseModule.forFeature([DynamicSchema]) en DynamicSchemaModule
- [ ] 6.4 Schema definition: indices unique en collectionName, indices en fieldsHash

## Phase 7 - Documentacion + verificacion

- [ ] 7.1 Reescribir apps/nominas/src/modules/dynamic-schema/README.md con tabla de 8 fuentes + 2 lifecycle
- [ ] 7.2 Actualizar packages/ai/README.md con vision multi-provider
- [ ] 7.3 Actualizar AGENTS.md seccion 12 (Project Status Dashboard)
- [ ] 7.4 npm run build pasa sin errores
- [ ] 7.5 npm run lint pasa sin errores
- [ ] 7.6 Archive change: mergear delta specs a main specs/{ai,documents,database}/spec.md
