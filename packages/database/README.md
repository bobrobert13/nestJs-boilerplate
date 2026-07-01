<!-- @common/database — status: partial -->

# @common/database

MongoDB connection module for NestJS with automatic retry logic and transaction support.

## Features

- **Automatic reconnection** — Exponential backoff retry when MongoDB is unavailable
- **Transaction support** — Atomic operations across multiple collections with automatic retry on transient errors
- **Mongoose integration** — Full Mongoose ODM support with schema decorators
- **Configurable options** — All connection parameters via environment variables

---

### Quick API Index

> **Context budget:** Jump directly to the section you need.

| If you need to... | Use | Jump to | Files to read |
|---|---|---|---|
| Simple multi-collection write | `TransactionService.withTransaction()` | [§ Transaction Support](#transaction-support) | `transaction/transaction.service.ts` |
| Declarative transaction on a method | `@Transaction()` decorator | [§ Transaction Support](#transaction-support) | `transaction/decorators/transaction.decorator.ts` |
| Inject session into controller | `@TransactionParam()` decorator | [§ Transaction Support](#transaction-support) | `transaction/decorators/transaction-param.decorator.ts` |
| Manual commit/abort control | `TransactionManager` (request-scoped) | [§ Transaction Support](#transaction-support) | `transaction/transaction-manager.ts` |
| Wrap any operation in transaction | `TransactionalWrapper.execute()` | [§ Transaction Support](#transaction-support) | `transaction/transactional-wrapper.ts` |
| Handle connection failures | Retry logic, connection events | [§ Retry Logic](#retry-logic), [§ Connection Events](#connection-events) | `database.service.ts` |
| Configure MongoDB URI / options | Env vars + programmatic config | [§ Configuration Options](#configuration-options) | `config/database.config.ts` |
| Debug connection issues | Connection events + common issues | [§ Connection Events](#connection-events), [§ Common Issues](#common-issues) | — |
| Handle DB/transaction errors | Error tables per error type | [§ Error Handling](#error-handling) | — |

---

## Installation

```bash
npm install @common/database mongoose @nestjs/config
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@common/database';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
})
export class AppModule {}
```

### 2. Configure .env

```env
MONGODB_URI=mongodb://localhost:27017/boilerplate_db
```

---

## Transaction Support

Use transactions for atomic operations that touch multiple collections/models.

### WithTransaction Service Pattern

```typescript
import { TransactionService } from '@common/database';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly transaction: TransactionService,
  ) {}

  async createOrderWithInventory(dto: CreateOrderDto) {
    return this.transaction.withTransaction(async (session) => {
      const order = await this.orderRepo.create(dto, { session });
      await this.inventoryService.decrementStock(dto.items, { session });
      return order;
    });
  }
}
```

### Transaction Options

```typescript
await this.transaction.withTransaction(
  async (session) => {
    /* operations */
  },
  {
    retry: true, // Auto-retry on transient errors (default: true)
    maxRetries: 3, // Maximum retry attempts (default: 3)
  },
);
```

### When to Use Transactions

- **YES:** Creating an order AND decrementing inventory atomically
- **YES:** Transferring funds between accounts
- **YES:** Updating multiple related documents in one logical operation
- **NO:** Simple single-document reads/writes
- **NO:** Read-only operations (transactions add overhead)

### Transient Error Handling

The transaction service automatically retries on transient errors (network issues, replica set elections). Errors like "transaction aborted" or "commit failed" trigger automatic retry with exponential backoff.

### Declarative Transaction API

The package provides decorators for marking service methods as transactional without manual `withTransaction()` calls.

#### @Transaction() Decorator

```typescript
import { Transaction, TransactionParam } from '@common/database';
import { ClientSession } from 'mongoose';

@Injectable()
export class OrderService {
  @Transaction({ retry: true, maxRetries: 3 })
  async createOrder(
    dto: CreateOrderDto,
    @TransactionParam() session?: ClientSession,
  ) {
    // Automatically wrapped in withTransaction()
    const order = await this.orderRepo.create(dto, { session });
    await this.inventoryService.decrementStock(dto.items, { session });
    return order;
  }
}
```

**Options:**

| Option       | Type      | Default | Description                    |
| ------------ | --------- | ------- | ------------------------------ |
| `retry`      | `boolean` | `true`  | Auto-retry on transient errors |
| `maxRetries` | `number`  | `3`     | Maximum retry attempts         |

**@TransactionParam() Decorator:**
Injects the current `ClientSession` into method parameters:

```typescript
import { TransactionParam } from '@common/database';

@Post()
async create(
  @Body() dto: CreateDto,
  @TransactionParam() session: ClientSession,
) {
  return this.service.create(dto, session);
}
```

### TransactionManager (Request-Scoped)

For manual transaction lifecycle control:

```typescript
import { TransactionManager } from '@common/database';

@Injectable()
export class ComplexService {
  constructor(private readonly transactionManager: TransactionManager) {}

  async multiStepOperation() {
    await this.transactionManager.start({ retry: true, maxRetries: 3 });

    try {
      const session = this.transactionManager.getSession();
      // ... perform operations with session
      await this.transactionManager.commit();
    } catch (error) {
      await this.transactionManager.abort();
      throw error;
    } finally {
      await this.transactionManager.end();
    }
  }
}
```

**TransactionManager Methods:**

| Method            | Returns          | Description                         |
| ----------------- | ---------------- | ----------------------------------- |
| `start(options?)` | `Promise<void>`  | Begin a new transaction             |
| `commit()`        | `Promise<void>`  | Commit the current transaction      |
| `abort()`         | `Promise<void>`  | Rollback the current transaction    |
| `end()`           | `Promise<void>`  | End the session (call in finally)   |
| `getSession()`    | `ClientSession`  | Returns the current `ClientSession` |
| `isActive()`      | `boolean`        | Check if transaction is active      |
| `getSessionId()`  | `string \| null` | Get session ID string or null       |

### TransactionalWrapper

Wraps an operation in a transaction with optional isolation level:

```typescript
import { TransactionalWrapper } from '@common/database';

@Injectable()
export class MyService {
  constructor(private readonly transactional: TransactionalWrapper) {}

  async doWork() {
    return this.transactional.execute(
      async (session) => {
        // All operations share the session
        return await this.repo.create(data, { session });
      },
      {
        retry: true,
        maxRetries: 3,
        isolationLevel: 'snapshot',
      },
    );
  }
}
```

**TransactionalOptions:**

| Option           | Type                                                                     | Default | Description                    |
| ---------------- | ------------------------------------------------------------------------ | ------- | ------------------------------ |
| `retry`          | `boolean`                                                                | `true`  | Auto-retry on transient errors |
| `maxRetries`     | `number`                                                                 | `3`     | Maximum retry attempts         |
| `isolationLevel` | `'read uncommitted' \| 'read committed' \| 'snapshot' \| 'serializable'` | (none)  | Transaction isolation level    |

### Transaction API Comparison

| API                                    | Scope          | Best For                                                  |
| -------------------------------------- | -------------- | --------------------------------------------------------- |
| `TransactionService.withTransaction()` | Singleton      | Simple multi-collection atomic writes                     |
| `@Transaction()` decorator             | Method-level   | Entire service methods that always need transactions      |
| `TransactionManager`                   | Request-scoped | Complex multi-step logic with conditional commit/rollback |
| `TransactionalWrapper`                 | Singleton      | Programmatic isolation level control                      |

---

## Retry Logic

The `DatabaseService` implements exponential backoff on connection failures:

```
Attempt 1: immediate
Attempt 2: 100ms delay
Attempt 3: 200ms delay
Attempt 4: 400ms delay
... up to maxRetries (default: 5)
```

After max retries, the server continues without DB connection (allows partial functionality).

---

## Configuration Options

### Environment Variables

| Variable          | Default                                    | Description         |
| ----------------- | ------------------------------------------ | ------------------- |
| `MONGODB_URI`     | `mongodb://localhost:27017/boilerplate_db` | Full connection URI |
| `MONGODB_DB_NAME` | (from URI)                                 | Database name       |

### Programmatic Config

```typescript
DatabaseModule.forRoot({
  uri: 'mongodb://user:pass@host:27017/db',
  options: {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    replicaSet: 'rs0',
  },
  retry: {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 30000,
  },
}),
```

---

## Connection Events

The service logs important lifecycle events:

| Event                                       | Log Level | Meaning                               |
| ------------------------------------------- | --------- | ------------------------------------- |
| `✅ Successfully connected to MongoDB`      | log       | Initial connection succeeded          |
| `⚠️ MongoDB disconnected`                   | warn      | Lost connection, attempting reconnect |
| `✅ MongoDB reconnected`                    | log       | Reconnection succeeded                |
| `❌ MongoDB connection error`               | error     | Connection failed                     |
| `🚨 Max MongoDB connection retries reached` | error     | All retries exhausted                 |

---

## Error Handling

### Connection Errors

The `DatabaseService` implements exponential backoff on connection failures. When MongoDB is unreachable, the server continues running (partial functionality) rather than crashing.

| Error                       | Description                   | Behavior                                                                  |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `MongoServerSelectionError` | Cannot reach any MongoDB node | Retry with exponential backoff (100ms → 200ms → 400ms … up to 5 attempts) |
| `MongoNetworkError`         | Network-level failure         | Same retry strategy; server stays alive after max retries                 |
| Connection timeout          | Slow or unresponsive node     | Controlled by `serverSelectionTimeoutMS` (default: 5000ms)                |

### Transaction Errors

| Error                       | Description                                    | Behavior                                                        |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `TransientTransactionError` | Temporary failure (e.g., replica set election) | Automatic retry within `withTransaction()` (default: 3 retries) |
| `MongoError: WriteConflict` | Concurrent write detected                      | Retried automatically by MongoDB driver                         |
| Transaction aborted         | Explicit abort or step failure                 | Wrapped in `HttpError` for consistent error handling            |

### Retry Configuration

```typescript
// Connection retry (database.module.ts)
DatabaseModule.forRoot({
  retry: {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 30000,
  },
});

// Transaction retry (per operation)
await this.transaction.withTransaction(operation, {
  retry: true,
  maxRetries: 3,
});
```

---

---

## Cross-Cutting

> When modifying this package, also check:
> - [`usuarios` module](../../apps/nominas/src/modules/usuarios/) — CRUD modules use MongoDB schemas; verify schema changes don't break queries
> - [`dynamic-schema` module](../../apps/nominas/src/modules/dynamic-schema/) — AI-generated schemas compile against this database connection

---

## Common Issues

| Issue                            | Cause                            | Solution                                 |
| -------------------------------- | -------------------------------- | ---------------------------------------- |
| `MongoServerSelectionError`      | MongoDB not running              | Start MongoDB or check connection string |
| Connection hangs                 | Wrong replicaSet config          | Remove `replicaSet` option if standalone |
| `TransientTransactionError`      | Replica set election in progress | Wait and retry; transactions auto-retry  |
| `Max connection retries reached` | Persistent network issue         | Check firewall, MongoDB logs             |
| `peer is not a valid member`     | Malformed URI                    | Check `&replicaSet=rs0` syntax in URI    |
