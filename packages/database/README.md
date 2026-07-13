<!-- @common/database — status: docs-complete | jsdoc-pending -->

# @common/database

MongoDB connection module for NestJS with automatic retry logic and transaction support.

## Features

- **Automatic reconnection** — Exponential backoff retry when MongoDB is unavailable
- **Transaction support** — Atomic operations across multiple collections with automatic retry on transient errors
- **Mongoose integration** — Full Mongoose ODM support with schema decorators
- **Configurable options** — All connection parameters via environment variables

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
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
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
  async (session) => { /* operations */ },
  {
    retry: true,        // Auto-retry on transient errors (default: true)
    maxRetries: 3,      // Maximum retry attempts (default: 3)
  }
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

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/boilerplate_db` | Full connection URI |
| `MONGODB_DB_NAME` | (from URI) | Database name |

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

| Event | Log Level | Meaning |
|-------|-----------|---------|
| `✅ Successfully connected to MongoDB` | log | Initial connection succeeded |
| `⚠️ MongoDB disconnected` | warn | Lost connection, attempting reconnect |
| `✅ MongoDB reconnected` | log | Reconnection succeeded |
| `❌ MongoDB connection error` | error | Connection failed |
| `🚨 Max MongoDB connection retries reached` | error | All retries exhausted |

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `MongoServerSelectionError` | MongoDB not running | Start MongoDB or check connection string |
| Connection hangs | Wrong replicaSet config | Remove `replicaSet` option if standalone |
| `TransientTransactionError` | Replica set election in progress | Wait and retry; transactions auto-retry |
| `Max connection retries reached` | Persistent network issue | Check firewall, MongoDB logs |
| `peer is not a valid member` | Malformed URI | Check `&replicaSet=rs0` syntax in URI |