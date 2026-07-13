# Database Specification (delta)

## Purpose

Extiende la spec database original con soporte para registro dinamico de
modelos Mongoose (necesario para `dynamic-schema`).

## Requirements

### Dynamic Model Registration

The system MUST allow registering new Mongoose models on the active connection at runtime, in addition to the static `MongooseModule.forFeature()` registrations.

#### Scenario: connection.model(name, schema) registers a model

- GIVEN an active Mongo connection via `@InjectConnection()` in `SchemaCompilerService`
- WHEN `connection.model(collectionName, mongooseSchema)` is called with a name not yet registered
- THEN Mongoose creates the model on the active connection
  - AND subsequent `connection.model(collectionName)` calls return the same model instance.

#### Scenario: Registering an existing model name overwrites

- GIVEN a model already registered under `collectionName`
- WHEN `connection.model(collectionName, newSchema)` is called again
- THEN Mongoose overwrites the model in the connection (with a deprecation warning in Mongoose 9).

### Model Existence Check

The system MUST provide a way to check whether a model is already registered.

#### Scenario: connection.modelNames() lists registered models

- GIVEN N models registered (static + dynamic)
- WHEN `connection.modelNames()` is called
- THEN the array contains all N names.

#### Scenario: Idempotent registration check via modelNames()

- GIVEN a `collectionName` to register
- WHEN the compiler checks `connection.modelNames().includes(collectionName)`
- THEN it can decide whether to skip or proceed based on `fieldsHash`.

## Affected Documentation

- `packages/database/README.md`
- `openspec/specs/database/spec.md` (additive only)
