# @common/common

Common utilities for NestJS — base adapters, exception filters, and HTTP error handling.

## Features

- **BaseAdapter<T>** — Interface for data mapping adapters (transform external data into domain models)
- **DatabaseExceptionFilter** — Global MongoDB exception filter with standardized error responses
- **HttpError** — Hierarchical HTTP error classes for precise error handling

## Installation

```bash
npm install @common/common
```

## Quick Start

```typescript
import { Module } from '@nestjs/common';
import { DatabaseExceptionFilter } from '@common/common';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
})
export class AppModule {}
```

---

## BaseAdapter<T>

Use when you need to map external/unstructured data into domain models.

```typescript
import { BaseAdapter, DataMapping } from '@common/common';

interface UserOutput {
  id: string;
  name: string;
  email: string;
}

export class UserAdapter implements BaseAdapter<UserOutput> {
  readonly name = 'UserAdapter';

  adapt(rawData: unknown): UserOutput | UserOutput[] {
    if (Array.isArray(rawData)) {
      return rawData.map(item => this.mapFields(item as Record<string, unknown>, []));
    }
    return this.mapFields(rawData as Record<string, unknown>, []);
  }

  mapFields(
    rawData: Record<string, unknown>,
    mappings: DataMapping[],
  ): Partial<UserOutput> {
    const result: Partial<UserOutput> = {};
    for (const mapping of mappings) {
      result[mapping.targetField] = rawData[mapping.sourceField];
    }
    return result;
  }
}
```

**When to use:**
- Integrating external APIs with different data shapes
- Normalizing database documents to domain models
- Transforming webhook payloads into internal representations

---

## DatabaseExceptionFilter

Global filter that catches Mongoose/MongoDB errors and returns consistent HTTP responses.

```typescript
import { APP_FILTER } from '@nestjs/common';
import { DatabaseExceptionFilter } from '@common/common';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
})
export class AppModule {}
```

**Error mappings:**
| MongoDB Error Code | HTTP Status | Description |
|--------------------|-------------|-------------|
| 11000 (duplicate) | 409 Conflict | Unique constraint violation |
| 66 (duplicate key) | 409 Conflict | Compound unique index violation |
| 14 (host unreachable) | 503 Service Unavailable | Database unavailable |
| default | 500 Internal Server Error | Unknown database error |

---

## HttpError Hierarchy

Custom HTTP error classes for precise error handling.

```typescript
import { HttpError, createHttpError } from '@common/common';

// Manual instantiation
throw new HttpError(404, 'Not Found', 'User not found', '/users/123');

// Factory function
throw createHttpError(400, 'Bad Request', 'Invalid email format', '/auth/register');

// Check error type
if (error instanceof HttpError) {
  console.log(error.statusCode); // 404
  console.log(error.message);    // 'User not found'
}
```

**Error classes available:**
- `HttpError( status, message, cause?, path? )` — Base class
- `BadRequestError` — 400
- `UnauthorizedError` — 401
- `ForbiddenError` — 403
- `NotFoundError` — 404
- `ConflictError` — 409
- `InternalServerError` — 500

---

## Error Handling Patterns

### Service Layer

```typescript
async findUserByEmail(email: string): Promise<User> {
  try {
    return await this.userModel.findOne({ email });
  } catch (error) {
    throw new HttpError(500, 'Database query failed', error);
  }
}
```

### Repository Layer with Adapter

```typescript
async findAndAdapt<T>(query: Record<string, unknown>, adapter: BaseAdapter<T>): Promise<T[]> {
  try {
    const rawResults = await this.collection.find(query).toArray();
    return adapter.adapt(rawResults) as T[];
  } catch (error) {
    throw new HttpError(503, 'External service unavailable', error);
  }
}
```

---

## Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `MongoServerSelectionError` | Database unavailable | Check MongoDB connection string and ensure server is running |
| `MongoServerError: 11000` | Duplicate key | Check unique indexes, handle 409 in client |
| `HttpError: 500` | Unknown error | Check logs for `cause` field with original error |