# Delta for dynamic-schema-module

> **Scope**: This delta modifies the existing `dynamic-schema-module` capability (`openspec/specs/dynamic-schema-module/spec.md`) to close the five P0 blockers called out in `openspec/changes/dynamic-schema-complete-pipeline/proposal.md`: runtime model registration, persistence, ingestion, auth, and sanitization. The existing baseline requirements (file layout, module imports, 5-endpoint surface) remain true; this delta adds the new surface and rewords what was previously public-but-unsafe.

## MODIFIED Requirements

### Requirement: Module Import Contract

The documentation MUST describe the module's NestJS imports (`AiModule`, `DocumentsModule`, `MongooseModule.forFeature([{ name: DynamicSchema.name, schema: DynamicSchemaSchema }])`), providers (`DynamicSchemaService`, `DynamicSchemaRepository`, `SchemaCompilerService`, `DynamicModelRegistry`, `SanitizationService`), and the single export (`DynamicSchemaService`). The `DynamicSchemaSchema` MUST be extended with `version: number`, `hash: string`, `createdBy: string`, `createdAt: Date` and a unique compound index on `(collectionName, version)`.

(Previously: 5-endpoint surface, 3 services, no Mongoose model registration, no persistence replay.)

#### Scenario: Agent integrates the module into AppModule

- GIVEN an agent reads the registration example
- WHEN the agent adds DynamicSchema to a NestJS application
- THEN the documentation SHALL show `@Module({ imports: [DynamicSchemaModule, AuthModule], providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }] })` and list `AuthModule` as a required peer dependency
- AND SHALL list the 5 providers and the single export

#### Scenario: Agent observes the persistent model is registered

- GIVEN `MongooseModule.forFeature` is configured for `DynamicSchema`
- WHEN the application boots
- THEN the `DynamicSchema` model SHALL be injectable in the repository
- AND a unique compound index on `(collectionName, version)` SHALL be created

#### Scenario: Agent reads the schema extension

- GIVEN the `DynamicSchemaSchema` is extended
- WHEN the agent searches for persistence metadata
- THEN the documentation SHALL list `version`, `hash`, `createdBy`, `createdAt` as required fields on the persisted record

### Requirement: Endpoint Documentation

Each endpoint MUST be documented with HTTP method, path, request body shape, response shape, error responses, auth requirement, and Swagger `@ApiTags('dynamic-schema')`. The endpoint set changes from 5 to 8: the 3 new endpoints are `GET /dynamic-schema/collections/:name`, `GET /dynamic-schema/collections/:name/:id`, and `PATCH /dynamic-schema/collections/:name/:id`.

(Previously: 5 endpoints, all public, all returning 200 or 400.)

#### Scenario: Agent maps endpoints to auth requirements

- GIVEN an agent reads the endpoint table
- WHEN the agent needs to know which endpoints require auth
- THEN the table SHALL show `POST /extract` and `POST /generate-from-text` as `@Public()`
- AND SHALL show `POST /pipeline`, `POST /compile`, `GET /collections/:name`, `GET /collections/:name/:id`, `PATCH /collections/:name/:id` as `@Roles('admin')`
- AND SHALL show `POST /generate-from-image` as `@Roles('admin')`

#### Scenario: Agent calls the pipeline endpoint

- GIVEN an admin agent calls `POST /dynamic-schema/pipeline`
- WHEN the pipeline succeeds
- THEN the response SHALL be `{ collectionName, schema, documentContent, insertedId }`
- AND the Mongo collection registered in the live connection SHALL be named `dyn_<collectionName>`

#### Scenario: Agent hits a duplicate collection name

- GIVEN an admin agent calls `POST /dynamic-schema/pipeline` with a `collectionName` already registered
- WHEN the request does not include the `X-Force-Recreate: true` header
- THEN the response SHALL be HTTP 409 Conflict
- AND the existing data SHALL remain unchanged

#### Scenario: Agent force-recreates an existing collection

- GIVEN an admin agent calls `POST /dynamic-schema/pipeline` with an existing `collectionName`
- WHEN the request includes the header `X-Force-Recreate: true`
- THEN the system SHALL drop the existing Mongo collection and re-create the schema
- AND SHALL bump the `version` field on the `DynamicSchema` record

#### Scenario: Agent submits an invalid collection name

- GIVEN an admin agent calls `POST /dynamic-schema/pipeline` with a `collectionName` that fails the regex `^[a-z][a-z0-9_]{2,63}$`
- WHEN the controller validates the body
- THEN the response SHALL be HTTP 422 with `{ code: 'INVALID_NAME' }`

#### Scenario: Agent submits a denylisted field name

- GIVEN an admin agent calls `POST /dynamic-schema/pipeline` with a `field.name` in `[password, token, secret, __proto__, __v, _id]`
- WHEN the controller validates the body
- THEN the response SHALL be HTTP 422 with `{ code: 'INVALID_NAME', field: '...' }`

### Requirement: Service Layer Description

The documentation MUST distinguish five services: `DynamicSchemaService` (orchestrates the pipeline + seed insert), `SchemaCompilerService` (compiles `GeneratedSchema` into live Mongoose `Schema` objects, computes `version` + `hash`), `DynamicModelRegistry` (registers compiled schemas with the live Mongoose `Connection` and caches `Model` references by collection name), `SanitizationService` (validates `collectionName` and `field.name` against regex + denylist), and `DynamicSchemaRepository` (persists/retrieves `DynamicSchema` documents).

(Previously: 2 services; no registry, sanitization, or real repository.)

#### Scenario: Agent understands service responsibilities

- GIVEN an agent reads the services section
- WHEN the agent needs to know which service to inject
- THEN the doc SHALL state that `DynamicSchemaService` is the public API (exported)
- AND `SchemaCompilerService`, `DynamicModelRegistry`, and `SanitizationService` are internal (not exported from the module)
- AND `DynamicModelRegistry` SHALL be the only service that calls `connection.model(name, schema)`

## ADDED Requirements

### Requirement: Boot-Time Schema Replay

`DynamicSchemaModule` MUST implement `OnApplicationBootstrap`. On boot, the module MUST read every document from the `dynamic_schemas` collection, pass each through `SchemaCompilerService.compileSchema`, and call `DynamicModelRegistry.register(name, schema)` for each. A single corrupt row MUST NOT crash the boot; the failure MUST be logged and the remaining rows MUST still be registered. After replay, the previously-registered dynamic collections MUST be queryable through the registry without re-running the pipeline.

#### Scenario: Agent restarts the app and queries a previously-created collection

- GIVEN a `DynamicSchema` document for `dyn_invoices` exists in MongoDB
- WHEN the application restarts and `OnApplicationBootstrap` runs
- THEN `DynamicModelRegistry.get('dyn_invoices')` SHALL return the registered `Model`
- AND the agent can call `GET /dynamic-schema/collections/dyn_invoices/:id` and receive the persisted document

#### Scenario: A single corrupt row does not poison the boot

- GIVEN one of the rows in `dynamic_schemas` has invalid JSON in `schemaDefinition`
- WHEN the application boots
- THEN the boot SHALL complete
- AND the valid rows SHALL still be registered
- AND a warning SHALL be logged identifying the failing collection

### Requirement: Pipeline Returns Seed Inserted ID

`POST /dynamic-schema/pipeline` MUST return the `_id` of the seeded document in the `insertedId` field of the response. The seed document shape MUST be `{ rawText, parsedAt: Date, source: 'pipeline', originalFilename, schemaVersion, ...data }` where `data` is the LLM-extracted values from `AiService.generateSchemaAndData`. The seed insert MUST be wrapped in `TransactionService.withTransaction`. The model registration MUST occur BEFORE the transaction starts (Mongoose model registration is a connection-level operation and cannot participate in a transaction; this is a documented Mongoose limitation).

#### Scenario: Agent reads the insertedId from the pipeline response

- GIVEN an admin agent calls `POST /dynamic-schema/pipeline` with a base64 PDF
- WHEN the pipeline succeeds
- THEN `response.insertedId` SHALL be a non-empty string
- AND `GET /dynamic-schema/collections/<name>/<insertedId>` SHALL return the seeded document

#### Scenario: Agent inspects the seed document shape

- GIVEN a seed has been inserted
- WHEN the agent queries the document
- THEN the document SHALL have the fields `rawText`, `parsedAt`, `source`, `originalFilename`, `schemaVersion`
- AND the LLM-extracted `data` fields SHALL appear as top-level keys

### Requirement: Sanitization at the Controller Boundary

`POST /dynamic-schema/pipeline`, `POST /dynamic-schema/compile`, and `PATCH /dynamic-schema/collections/:name/:id` MUST call `SanitizationService.sanitizeCollectionName` and `SanitizationService.sanitizeFieldName` before any further processing. Sanitization failures MUST return HTTP 422 with `{ code: 'INVALID_NAME' }` (and `field` for field-name failures). The controller MUST NOT depend on the schema compiler for sanitization — sanitization is the first gate.

#### Scenario: Controller sanitizes the collection name before compile

- GIVEN an admin agent calls `POST /dynamic-schema/pipeline` with `collectionName: '__proto__'`
- WHEN the controller sanitizes the input
- THEN the response SHALL be HTTP 422 with `{ code: 'INVALID_NAME' }` BEFORE any AI call is made

#### Scenario: Controller sanitizes every field name in the PATCH body

- GIVEN an admin agent calls `PATCH /dynamic-schema/collections/dyn_invoices/abc` with `{ "$where": "1==1" }`
- WHEN the controller sanitizes the body
- THEN the response SHALL be HTTP 422 with `{ code: 'UNKNOWN_FIELD', field: '$where' }`

### Requirement: Cross-Reference to AI Methods

The documentation MUST cross-reference the `ai-schema-and-data` and `ai-field-ui-metadata` capabilities: `DynamicSchemaService.fullPipeline` MUST call `AiService.generateSchemaAndData` (one LLM call) instead of `generateSchemaFromText` followed by a separate data-extraction call. The `ui` field on each `SchemaFieldDefinition` is optional and is inferred by the LLM.

#### Scenario: Agent traces the pipeline to the AI method

- GIVEN an agent reads both the dynamic-schema and ai-schema-and-data sections
- WHEN the agent wants to understand what AI method the pipeline uses
- THEN the cross-reference SHALL link `DynamicSchemaService.fullPipeline` → `AiService.generateSchemaAndData`
- AND SHALL state the pipeline issues exactly one LLM call (verifiable by a test that asserts the LLM provider is called once)
