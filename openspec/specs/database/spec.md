# Database Specification

## Purpose

Módulo de conexión MongoDB con soporte para transacciones (requiere ReplicaSet), retry logic, y decorator `@Transactional`.

Documentación asociada: `packages/database/README.md`

## Requirements

### Connection with Retry

The system MUST connect to MongoDB with exponential backoff retry logic on failure.

#### Scenario: Connection succeeds

- GIVEN a valid MONGODB_URI pointing to a running MongoDB instance
- WHEN the application starts
- THEN the system establishes a connection

#### Scenario: Connection retries on failure

- GIVEN a MongoDB URI that is temporarily unreachable
- WHEN the application starts
- THEN the system retries with exponential backoff
- AND the system eventually connects when MongoDB becomes available

### Transaction Support

The system MUST support MongoDB transactions via TransactionService.

#### Scenario: Successful transaction

- GIVEN an operation that creates and updates multiple documents
- WHEN `TransactionService.withTransaction(operation)` is called
- THEN all operations succeed atomically
- AND the transaction commits

#### Scenario: Transaction rollback on error

- GIVEN an operation that fails mid-way
- WHEN `TransactionService.withTransaction(operation)` is called
- THEN all prior operations are rolled back

### @Transactional Decorator

The system SHOULD provide a `@Transactional()` decorator for declarative transaction management.

#### Scenario: Decorated method with transaction

- GIVEN a service method decorated with `@Transactional()`
- WHEN the method executes
- THEN it runs within a MongoDB transaction session

## Affected Documentation

- `packages/database/README.md`
- `AGENTS.md` — section 3 (Packages Index)
