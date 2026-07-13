# Database Specification

## Purpose

Modulo de conexion MongoDB con soporte para transacciones (requiere ReplicaSet), retry logic con backoff exponencial, y event listeners para auto-reconnect. Configuracion via `@nestjs/config` (namespace `database`).

Documentacion asociada: `packages/database/README.md`, `AGENTS.md` (seccion 4).

## Requirements

### Connection with Retry

The system MUST connect to MongoDB using `mongoose.connect()` with exponential backoff retry logic on failure.

#### Scenario: Connection succeeds on first attempt

- GIVEN a valid `database.uri` config pointing to a running MongoDB
- WHEN `DatabaseService.onModuleInit()` runs
- THEN the system calls `mongoose.connect(uri, options)`
  - AND logs `"Successfully connected to MongoDB"`
  - AND resets `retryCount` to 0

#### Scenario: Connection fails and triggers retry

- GIVEN an unreachable MongoDB URI
- WHEN `connectWithRetry()` is called
- THEN the system logs `"MongoDB connection error: <message>"`
  - AND if `retryCount < maxRetries`, schedules another attempt via `setTimeout`

#### Scenario: Exponential backoff calculation

- GIVEN `initialDelay = 100ms` and `maxDelay = 30000ms`
- WHEN backoff is calculated for attempt N (starting from 0)
- THEN delay = `100 * 2^N` capped at 30000ms

#### Scenario: Max retries reached

- GIVEN `retryCount == maxRetries`
- WHEN a connection attempt fails
- THEN the system logs `"Max MongoDB connection retries reached"`
  - AND the server continues without DB connection (does not crash)

#### Scenario: Missing config does not crash

- GIVEN no `database` config in ConfigService
- WHEN `connectWithRetry()` runs
- THEN the system logs `"Database configuration is not available"`
  - AND returns without throwing

### Transaction Support

The system MUST support MongoDB transactions via `TransactionService.withTransaction()`.

#### Scenario: Successful transaction

- GIVEN an operation creating and updating multiple documents
- WHEN `TransactionService.withTransaction(operation)` is called
- THEN all operations succeed atomically
  - AND the transaction commits

#### Scenario: Transaction rollback on error

- GIVEN an operation that fails mid-way
- WHEN `withTransaction(operation)` is called
- THEN all prior operations are rolled back

### @Transactional Decorator

The system SHOULD provide a `@Transactional()` decorator for declarative transaction management.

#### Scenario: Decorated method runs within transaction

- GIVEN a service method decorated with `@Transactional()`
- WHEN the method executes
- THEN it runs within a MongoDB transaction session

### Disconnection

The system MUST expose a `disconnect()` method for graceful shutdown.

#### Scenario: Disconnect closes connection

- GIVEN an active MongoDB connection
- WHEN `databaseService.disconnect()` is called
- THEN `mongoose.disconnect()` runs
  - AND the system logs `"MongoDB connection closed"`

## Affected Documentation

- `packages/database/README.md`
- `AGENTS.md` — section 4 (Packages Index)


---

## Dynamic Model Registration (delta)

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
