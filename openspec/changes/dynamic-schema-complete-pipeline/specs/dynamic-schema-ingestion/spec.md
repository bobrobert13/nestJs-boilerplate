# Capability: dynamic-schema-ingestion

## Purpose

Specifies the ingestion step of the `dynamic-schema` pipeline: after the LLM returns a `GeneratedSchema` and the registry has registered the compiled Mongoose model, the system MUST insert exactly one seed document into the new collection. The seed combines the raw document metadata with the LLM-extracted field values, and the insert is wrapped in a MongoDB transaction so a partial write cannot leave the collection half-populated.

## Requirements

### Requirement: One LLM Call Returns Schema and Data

`DynamicSchemaService.fullPipeline` MUST call `AiService.generateSchemaAndData(provider, text, options?)` exactly once. The method returns `AIResponse<{ schema: GeneratedSchema; data: Record<string, unknown> }>`. The pipeline MUST NOT make a second LLM call to extract data after the schema is generated. If the AI call fails, the pipeline MUST return `{ success: false, error: 'SCHEMA_GENERATION_ERROR' }` and MUST NOT register the model or insert a seed.

#### Scenario: Pipeline makes one LLM call

- GIVEN a base64 PDF and a mocked `AiService`
- WHEN the pipeline runs
- THEN the `AiService` SHALL be called exactly once
- AND the call SHALL be `generateSchemaAndData(provider, text, { temperature })`

#### Scenario: AI call failure short-circuits the pipeline

- GIVEN the mocked `AiService.generateSchemaAndData` returns `{ success: false, error: 'SCHEMA_GENERATION_ERROR' }`
- WHEN the pipeline runs
- THEN no model SHALL be registered in `DynamicModelRegistry`
- AND no seed SHALL be inserted
- AND the response SHALL be `{ success: false, error: 'SCHEMA_GENERATION_ERROR' }`

### Requirement: Seed Document Shape

The seed document inserted into the new collection MUST have the following fields:
- `rawText: string` — the extracted text from the document processor
- `parsedAt: Date` — the time the seed was inserted
- `source: 'pipeline'` — the literal string `'pipeline'`
- `originalFilename: string` — provided in the request body
- `schemaVersion: number` — the version assigned to the schema
- Spread of the LLM-extracted `data` object (`...data`)

The LLM `data` keys appear as top-level fields on the persisted document, alongside the metadata keys. If a key in `data` collides with a reserved key (`rawText`, `parsedAt`, `source`, `originalFilename`, `schemaVersion`, `_id`, `__v`), the LLM key MUST be ignored and a warning SHALL be logged.

#### Scenario: Agent inspects the inserted seed

- GIVEN a successful pipeline run with LLM `data: { invoiceNumber: 'INV-001', amount: 100 }`
- WHEN the agent queries the inserted document
- THEN the document SHALL have `rawText`, `parsedAt`, `source: 'pipeline'`, `originalFilename`, `schemaVersion` AND `invoiceNumber: 'INV-001'`, `amount: 100`

#### Scenario: Agent sees a collision warning

- GIVEN the LLM returns `data: { _id: 'attacker', invoiceNumber: 'INV-001' }`
- WHEN the seed is assembled
- THEN the persisted document SHALL have its own `_id` (not `'attacker'`)
- AND a warning SHALL be logged stating that `_id` was overridden by the system
- AND `invoiceNumber: 'INV-001'` SHALL appear at the top level

### Requirement: Transaction-Wrapped Seed Insert

The seed insert MUST be performed inside `TransactionService.withTransaction` from `@common/database`. The transaction wrapper MUST commit the write before the pipeline returns. The transaction MUST be wrapped in a `try/catch`; on commit failure, the registry MUST be informed (the registered `Model` stays — it is a connection-level cache, not a Mongo write) and the caller SHALL receive an HTTP 5xx.

#### Scenario: Agent observes a successful commit

- GIVEN a successful seed insert inside the transaction
- WHEN the pipeline returns
- THEN the response SHALL include a non-empty `insertedId`
- AND the document SHALL be queryable via `GET /dynamic-schema/collections/<name>/<insertedId>`

#### Scenario: Agent observes a transaction abort on seed failure

- GIVEN the underlying Mongo write fails inside the transaction
- WHEN the pipeline runs
- THEN `withTransaction` SHALL roll back the write
- AND the response SHALL be HTTP 5xx
- AND the registered `Model` SHALL remain in the registry (a retry can reuse it)

### Requirement: Model Registration Precedes the Transaction

The `DynamicModelRegistry.register(name, compiledSchema)` call MUST happen BEFORE `TransactionService.withTransaction` is called. This is a Mongoose limitation: `connection.model(name, schema)` is a Node-side, in-process cache operation and cannot participate in a Mongo transaction. The order is: (1) compile the `GeneratedSchema` to `mongoose.Schema`, (2) register the model via `DynamicModelRegistry`, (3) wrap the seed insert in `withTransaction`, (4) return. This is a documented limitation and MUST be commented in the code.

#### Scenario: Agent reads the inline code comment

- GIVEN the implementation in `dynamic-schema.service.ts`
- WHEN the agent reads the `fullPipeline` method
- THEN a code comment SHALL explain that model registration precedes the transaction
- AND the comment SHALL link to the Mongoose documentation about `connection.model()` not being transactional

#### Scenario: Agent verifies the call order in a test

- GIVEN a unit test that mocks both `DynamicModelRegistry` and `TransactionService`
- WHEN the pipeline runs successfully
- THEN `registry.register` SHALL have been called before `transaction.withTransaction` started
- AND the assertion SHALL use a `jest.spyOn` order check (`expect(registry.register).toHaveBeenCalledBefore(transaction.withTransaction)`)
