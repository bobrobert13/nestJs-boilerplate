# packages-database-readme Specification

## Purpose

Verify that `packages/database/README.md` documents the declarative transaction API: `@Transaction()` decorator, `TransactionManager`, and `TransactionalWrapper`, as required by the `database-transaction-decorators` spec.

## Requirements

### Requirement: Declarative Transaction API Present

The README MUST document all three transaction APIs (`@Transaction()`, `TransactionManager`, `TransactionalWrapper`) with import paths from `@common/database`, complete code examples, and option tables.

#### Scenario: Agent finds @Transaction decorator documentation

- GIVEN an agent reads `packages/database/README.md`
- WHEN the agent searches for declarative transaction patterns
- THEN a heading SHALL contain `@Transaction()` with a code example showing `{ retry: true, maxRetries: 3 }`
- AND an options table SHALL list `retry: boolean` (default `true`) and `maxRetries: number` (default `3`)

#### Scenario: Agent finds TransactionManager lifecycle documentation

- GIVEN an agent needs manual transaction lifecycle control
- WHEN the agent reads the TransactionManager section
- THEN the doc SHALL show the `start() → commit()/abort() → end()` pattern in a try/catch/finally block
- AND the methods table SHALL list `getSession()`, `isActive()`, and `getSessionId()`

### Requirement: TransactionalWrapper API Present

The README MUST document `TransactionalWrapper.execute()` with its `TransactionalOptions` interface (`retry`, `maxRetries`, `isolationLevel`). The doc SHALL note that `isolationLevel` accepts `'read uncommitted' | 'read committed' | 'snapshot' | 'serializable'`.

#### Scenario: Agent uses TransactionalWrapper for isolation control

- GIVEN an agent needs snapshot isolation for a multi-document read
- WHEN the agent reads the TransactionalWrapper documentation
- THEN the code example SHALL show `isolationLevel: 'snapshot'` in the options object
- AND the import `from '@common/database'` SHALL be visible
