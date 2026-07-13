# Capability: dynamic-schema-runtime-registry

## Purpose

Specifies the `DynamicModelRegistry` service that registers compiled Mongoose `Schema` objects with the live Mongoose `Connection` and caches the returned `Model` references by collection name. The registry is the runtime layer that makes dynamically-generated schemas immediately available to the rest of the application. It is persisted via the `dynamic_schemas` collection and replayed on `OnApplicationBootstrap` so the registry is restart-safe.

## Requirements

### Requirement: Service Surface

The `apps/nominas/src/modules/dynamic-schema/services/dynamic-model-registry.service.ts` file MUST exist and MUST be registered in `DynamicSchemaModule.providers`. The service MUST inject `@InjectConnection()` from `@nestjs/mongoose` and MUST expose four methods: `register(name: string, schema: mongoose.Schema): Model<any>`, `get(name: string): Model<any> | undefined`, `has(name: string): boolean`, and `list(): string[]`.

#### Scenario: Agent locates the registry service

- GIVEN an agent reads AGENTS.md or the dynamic-schema module's source tree
- WHEN the agent searches for "registry" or "model registration"
- THEN the doc SHALL point to `services/dynamic-model-registry.service.ts`
- AND SHALL list the four public methods with their signatures

#### Scenario: Registry is wired in the module

- GIVEN the registry is exported from the module
- WHEN the agent inspects `DynamicSchemaModule`
- THEN `DynamicModelRegistry` SHALL appear in `providers`
- AND SHALL NOT appear in `exports` (internal to the module)

### Requirement: Register Caches by Name

`DynamicModelRegistry.register(name, schema)` MUST call `this.connection.model(name, schema)` and MUST cache the returned `Model<any>` in a private `Map<string, Model<any>>` keyed by `name`. The method MUST return the cached `Model`. The Mongoose connection itself caches models by name, so a second `register` with the same name and a structurally identical schema is a no-op at the Mongoose level and the in-memory cache SHALL return the same `Model` instance.

#### Scenario: Agent registers a new schema

- GIVEN a compiled `mongoose.Schema` and `name: 'dyn_invoices'`
- WHEN `DynamicModelRegistry.register('dyn_invoices', schema)` is called
- THEN `connection.model('dyn_invoices', schema)` SHALL be called exactly once
- AND the returned `Model` SHALL be cached in the internal `Map`
- AND `DynamicModelRegistry.get('dyn_invoices')` SHALL return the cached `Model`

#### Scenario: Agent re-registers the same schema

- GIVEN `dyn_invoices` is already registered with hash `H1`
- WHEN `register('dyn_invoices', sameSchema)` is called with a schema that produces hash `H1`
- THEN the registry SHALL return the same `Model` instance
- AND no duplicate Mongo collection SHALL be created

### Requirement: Additive Schema Evolution via `schema.add()`

`DynamicModelRegistry.register(name, newSchema)` MUST compute a hash of the incoming schema. If `name` is already registered with a structurally identical schema (same hash), the call is idempotent (no-op). If the incoming schema has NEW fields not present in the registered schema, the registry MUST call `existingSchema.add(newFieldDef)` to merge — the new fields SHALL be `null` for old records, and the call SHALL NOT throw. The hash SHALL be computed from a canonicalized JSON form of the schema (sorted field order, no whitespace).

#### Scenario: Agent adds a new field to an existing schema

- GIVEN `dyn_invoices` is registered with `{ invoiceNumber, amount }` (hash `H1`)
- WHEN `register('dyn_invoices', newSchema)` is called where `newSchema` is `{ invoiceNumber, amount, dueDate }` (hash `H2 != H1`)
- THEN the registry SHALL call `existingSchema.add({ dueDate: { type: Date } })`
- AND `dyn_invoices` records created before the addition SHALL continue to be readable
- AND `dueDate` SHALL be `null` on those pre-existing records
- AND the registry SHALL return the same `Model` instance (the in-memory cache is not replaced)

#### Scenario: Agent re-registers the same schema (idempotent)

- GIVEN `dyn_invoices` is registered with hash `H1`
- WHEN `register('dyn_invoices', schemaWithHashH1)` is called
- THEN no `schema.add()` call SHALL be made
- AND the existing `Model` SHALL be returned

### Requirement: Incompatible Type Change Rejection

`DynamicModelRegistry.register(name, newSchema)` MUST detect when a field present in both the registered and incoming schema has a different `type`. In that case, the registry MUST throw an `UnprocessableEntityException` with `{ code: 'INCOMPATIBLE_SCHEMA_CHANGE', field: '...' }` (HTTP 422). The registry MUST NOT call `schema.add()` for the incompatible field, MUST NOT mutate the existing `Model`, and MUST NOT update the persisted `dynamic_schemas` row.

#### Scenario: Agent changes the type of an existing field

- GIVEN `dyn_invoices.amount` is registered as `Number`
- WHEN `register('dyn_invoices', newSchema)` is called where `newSchema.amount` is `String`
- THEN the registry SHALL throw `UnprocessableEntityException` with `{ code: 'INCOMPATIBLE_SCHEMA_CHANGE', field: 'amount' }`
- AND the existing `Model` SHALL remain unchanged
- AND the existing Mongo data SHALL NOT be modified

#### Scenario: Agent renames a field

- GIVEN `dyn_invoices.invoiceNumber` is registered as `String`
- WHEN `register('dyn_invoices', newSchema)` is called where `newSchema.invoiceCode: String` replaces it
- THEN the registry SHALL add `invoiceCode` (additive) via `schema.add()`
- AND `invoiceNumber` SHALL remain in the registered schema
- AND the agent SHALL be able to read both fields

### Requirement: has and list

`DynamicModelRegistry.has(name)` MUST return `true` if a `Model` is cached under `name`, `false` otherwise. `DynamicModelRegistry.list()` MUST return a `string[]` of all cached names in insertion order. Both methods MUST be O(1) (has) / O(n) (list) and MUST NOT throw on empty input.

#### Scenario: Agent checks for a registered model

- GIVEN `dyn_invoices` is registered and `dyn_unknown` is not
- WHEN the agent calls `has('dyn_invoices')` and `has('dyn_unknown')`
- THEN the first call returns `true` and the second returns `false`

#### Scenario: Agent lists all registered models

- GIVEN `dyn_invoices` and `dyn_contracts` are registered (in that order)
- WHEN the agent calls `list()`
- THEN the returned array SHALL be `['dyn_invoices', 'dyn_contracts']`

#### Scenario: Empty registry

- GIVEN no models are registered
- WHEN the agent calls `list()` and `has('anything')`
- THEN `list()` returns `[]` and `has('anything')` returns `false`
