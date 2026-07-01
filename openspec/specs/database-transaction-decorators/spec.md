# database-transaction-decorators Specification

## Purpose

Specifies what the AGENTS.md and packages/database/README.md documentation MUST teach an AI agent about the declarative transaction API: `@Transaction()` decorator, `@TransactionParam()` decorator, and `TransactionManager` class — in addition to the already-documented `TransactionService.withTransaction()`.

## Requirements

### Requirement: Decorator API Documentation

The documentation MUST describe `@Transaction()` as a method decorator (imported from `@common/database`) that wraps a service method in a MongoDB transaction. It MUST document options: `retry?: boolean` (default `true`) and `maxRetries?: number` (default `3`).

#### Scenario: Agent applies Transaction decorator to a service method

- GIVEN an agent reads the transaction decorators section
- WHEN the agent needs atomic operations without manual `withTransaction()` calls
- THEN the doc SHALL show `@Transaction({ retry: true, maxRetries: 3 })` applied above an `async` method
- AND SHALL state that the DatabaseModule middleware auto-wraps annotated methods

#### Scenario: Agent disables retries for idempotency-sensitive operations

- GIVEN an agent handles operations where retry would be harmful (e.g., external payment calls)
- WHEN the agent reads the options documentation
- THEN the doc SHALL show `@Transaction({ retry: false })` as a valid configuration

### Requirement: TransactionManager Programmatic API

The documentation MUST describe `TransactionManager` as a REQUEST-scoped injectable with lifecycle methods: `start()`, `commit()`, `abort()`, `end()`, `getSession()`, `isActive()`. It MUST note that `TransactionManager` is registered in `DatabaseModule.providers` and is available for injection.

#### Scenario: Agent uses TransactionManager for multi-step operations

- GIVEN an agent needs fine-grained transaction control across multiple repository calls
- WHEN the agent reads the TransactionManager documentation
- THEN the doc SHALL show `await tx.start()` → perform operations → `await tx.commit()` pattern
- AND SHALL document that `getSession()` returns the Mongoose `ClientSession` to pass to Mongoose operations

#### Scenario: Agent handles TransactionManager lifecycle errors

- GIVEN an agent reads the TransactionManager error handling
- WHEN the agent calls `commit()` or `abort()` without `start()`
- THEN the doc SHALL state that `Error('No active transaction')` is thrown
- AND SHALL show the `end()` call in a `finally` block for cleanup

### Requirement: Decorator vs Service Comparison

The documentation MUST compare `@Transaction()` (declarative) with `TransactionService.withTransaction()` (programmatic) and `TransactionManager` (manual lifecycle), providing a decision table for when to use each.

#### Scenario: Agent chooses the right transaction API

- GIVEN an agent needs atomic operations
- WHEN the agent consults the comparison documentation
- THEN the table SHALL recommend `@Transaction()` for simple single-method transactions
- AND `withTransaction()` for wrapping multiple operations in a callback
- AND `TransactionManager` for manual `start()/commit()/abort()` control
