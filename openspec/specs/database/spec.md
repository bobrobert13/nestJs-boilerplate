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
