# Dynamic Schema Specification (delta)

## Purpose

Modulo de generacion dinamica de schemas Mongoose desde multiples fuentes de entrada (texto, imagen, documento, manual JSON, JSON Schema draft-07, DSL declarativo, inferencia desde coleccion Mongo). Pipeline orquestado por `DynamicSchemaService` que produce un `GeneratedSchema` intermedio, lo valida, y lo registra en la conexion Mongo activa via `connection.model()`.

El registro es persistente: la metadata del schema se guarda en la collection `dynamic_schemas` (modelo `DynamicSchema`) y se rehidrata al arranque del modulo (`OnModuleInit`), garantizando que los modelos compilados sobreviven reinicios.

Documentacion asociada: `apps/nominas/src/modules/dynamic-schema/README.md`, `AGENTS.md` (seccion 2 y 12).

## Requirements

### Multi-Source Schema Generation

The system MUST accept seven distinct input sources and convert each into a valid `GeneratedSchema` intermediate representation.

#### Scenario: Generate schema from natural language text

- GIVEN a text describing an entity (e.g., "User with name and email")
- WHEN `POST /api/dynamic-schema/generate-from-text` is called with `{text, provider}`
- THEN the system returns `{schema: GeneratedSchema, collectionName: string}`
  - AND `schema.fields` is a non-empty array of `SchemaFieldDefinition`
  - AND `schema.collectionName` is singular, lowercase, alphanumeric + underscores

#### Scenario: Generate schema from image with vision

- GIVEN a base64 image and a vision-capable provider (openai/anthropic/google)
- WHEN `POST /api/dynamic-schema/generate-from-image` is called with `{imageData, provider}`
- THEN the system sends the image as a multimodal content array (image_url for OpenAI, source for Anthropic, inline_data for Google)
  - AND returns a `GeneratedSchema` derived from the visual content
- IF the provider lacks `vision: true` capability THEN the system returns `VISION_NOT_SUPPORTED` error.

#### Scenario: Generate schema from extracted document text

- GIVEN a PDF or DOCX base64 document
- WHEN `POST /api/dynamic-schema/pipeline` is called with `{document, format}`
- THEN the system extracts text via `DocumentProcessorService`
  - AND generates schema via `generateSchemaFromText`
  - AND compiles + registers the schema
  - AND returns `{documentContent, schema, collectionName}`

#### Scenario: Compile schema from manual JSON

- GIVEN a client-authored `GeneratedSchema` JSON
- WHEN `POST /api/dynamic-schema/compile` is called with `{schema, collectionName}`
- THEN the system validates `collectionName` (regex + reserved words)
  - AND validates each field against `SchemaFieldDefinition` rules
  - AND registers the Mongoose model via `connection.model(name, schema)`
  - AND persists metadata in `DynamicSchema` collection
  - AND returns `{collectionName, success: true, fieldsHash}`

#### Scenario: Compile from JSON Schema (draft-07)

- GIVEN a JSON Schema draft-07 document
- WHEN `POST /api/dynamic-schema/compile-from-json-schema` is called
- THEN the system maps JSON Schema types to `GeneratedSchema`:
  - string/number/integer/boolean/null -> string/number/number/boolean/string
  - array -> array with `items` mapped
  - object -> object with `properties` mapped
  - required: string[] -> required: true per field
  - enum: any[] -> preserved in `SchemaFieldDefinition.enum`
  - AND compiles + registers with the same flow as manual JSON

#### Scenario: Compile from DSL declarative

- GIVEN a DSL string like `Entity Employee { name:string required; age:number; tags: string[]; }`
- WHEN `POST /api/dynamic-schema/compile-from-dsl` is called
- THEN the system parses the DSL (line/column-aware)
  - AND produces a `GeneratedSchema` with `collectionName: employee`
  - AND compiles + registers
  - IF the DSL has syntax errors THEN returns `DSL_PARSE_ERROR` with line/column.

#### Scenario: Infer schema from existing Mongo collection

- GIVEN a collection name that exists in the active Mongo connection
- WHEN `POST /api/dynamic-schema/infer-from-collection/:collectionName` is called
- THEN the system samples up to 50 documents
  - AND infers field types by majority type-coercion:
    - strings matching ISO 8601 -> date
    - 24-hex-char strings -> objectId
    - all-numeric strings -> number
    - arrays -> array with items inferred from element type
    - nested objects -> object with properties inferred
  - AND marks fields present in >90% of samples as required: true
  - AND compiles + registers the inferred schema

### Schema Compilation and Registration

The system MUST compile a validated `GeneratedSchema` into a Mongoose `Schema`, register it on the active connection, and persist metadata for rehydration.

#### Scenario: Compile-only (dry-run) does not register

- GIVEN a `GeneratedSchema`
- WHEN `POST /api/dynamic-schema/compile/dry-run` is called with `{schema, collectionName}`
- THEN the system validates without calling `connection.model()`
  - AND returns `{valid: true|false, errors?: string[], normalizedSchema: GeneratedSchema}`

#### Scenario: collectionName validation rejects invalid names

- GIVEN a `collectionName` that fails `^[a-z][a-z0-9_]{0,63}$`
- WHEN compile is called
- THEN the system returns `SCHEMA_VALIDATION_ERROR` with reason
  - AND does NOT call `connection.model()`

#### Scenario: collectionName reserved words are rejected

- GIVEN a `collectionName` matching a reserved word (`system`, `admin`, `local`, `config`, `__schema__`)
- WHEN compile is called
- THEN the system returns `SCHEMA_VALIDATION_ERROR: reserved collection name`.

#### Scenario: field type array requires items

- GIVEN a field `{name: tags, type: array}` without `items`
- WHEN compile is called
- THEN the system returns `SCHEMA_VALIDATION_ERROR: array field requires items`.

#### Scenario: field type object requires properties

- GIVEN a field `{name: address, type: object}` without `properties`
- WHEN compile is called
- THEN the system returns `SCHEMA_VALIDATION_ERROR: object field requires properties`.

#### Scenario: idempotent compilation

- GIVEN a `collectionName` already registered with identical `fieldsHash`
- WHEN compile is called
- THEN the system returns `{success: true, idempotent: true}` without re-registering.

### Schema Lifecycle (CRUD)

The system MUST expose endpoints to list, inspect, and unregister dynamically compiled schemas.

#### Scenario: List registered schemas

- GIVEN N dynamically registered schemas
- WHEN `GET /api/dynamic-schema/schemas` is called
- THEN the system returns `{schemas: [{collectionName, source, provider, registeredAt, fieldsHash}]}`.

#### Scenario: Unregister a schema

- GIVEN a registered `collectionName`
- WHEN `DELETE /api/dynamic-schema/schemas/:collectionName` is called
- THEN the system removes the Mongoose model from the connection
  - AND removes the metadata document from `DynamicSchema` collection
  - AND returns `{success: true, collectionName}`.

### Rehydration on Startup

The system MUST rehydrate all persisted schemas when the module initializes.

#### Scenario: OnModuleInit reloads schemas from Mongo

- GIVEN N persisted schemas in `DynamicSchema` collection
- WHEN `DynamicSchemaModule.onModuleInit()` runs
- THEN the system loads each metadata document
  - AND re-registers each Mongoose model via `connection.model(name, schema)`
  - AND logs `{rehydrated: N, errors: M}`.

#### Scenario: Rehydration failure on individual schema

- GIVEN one persisted schema whose `schemaDefinition` is corrupted
- WHEN rehydration runs
- THEN the system logs the error for that schema
  - AND continues with the rest
  - AND increments `rehydration.errors` counter.

### Error Codes and Observability

The system MUST emit structured error codes and in-memory metrics.

#### Scenario: Standardized error codes

- WHEN any operation fails THEN the error message MUST start with one of:
  - SCHEMA_VALIDATION_ERROR
  - SCHEMA_COMPILATION_ERROR
  - SCHEMA_GENERATION_ERROR
  - VISION_NOT_SUPPORTED
  - DSL_PARSE_ERROR
  - INFERENCE_ERROR
  - DUPLICATE_COLLECTION_NAME
  - COLLECTION_NOT_FOUND

#### Scenario: In-memory metrics counters

- WHEN operations complete THEN the system increments counters:
  - `pipeline.calls.{source}` (text/image/document/manual/json-schema/dsl/inference)
  - `pipeline.success.{source}` / `pipeline.error.{source}`
  - `pipeline.latencyMs.{source}` (running average)
  - `pipeline.tokens.{provider}` (prompt + completion)
- AND `GET /api/dynamic-schema/metrics` returns the current snapshot.

### Legacy Mode Compatibility

The system MUST support a legacy compatibility flag for rollback scenarios.

#### Scenario: DYNAMIC_SCHEMA_LEGACY=true bypasses registration

- GIVEN env `DYNAMIC_SCHEMA_LEGACY=true`
- WHEN compile is called
- THEN the system uses the previous behavior (Map in-memory, no `connection.model()` call, no `DynamicSchema` persistence).

## Affected Documentation

- `apps/nominas/src/modules/dynamic-schema/README.md`
- `AGENTS.md` section 12 (Project Status Dashboard)
- New: `openspec/specs/dynamic-schema/spec.md` (this file)
