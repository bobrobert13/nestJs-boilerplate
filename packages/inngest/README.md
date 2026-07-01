<!-- @common/inngest — status: complete -->

# @common/inngest

Inngest event-driven task queue module for NestJS — run background jobs, scheduled tasks, and event-triggered workflows.

## Features

- **Event-driven architecture** — Decouple services with typed events
- **Step functions** — Multi-step workflows with automatic retry
- **Self-hosted or cloud** — Works with any Inngest endpoint
- **Type-safe events** — Full TypeScript inference for event payloads
- **Dashboard integration** — Monitor functions in Inngest dashboard

## Installation

```bash
npm install @common/inngest inngest
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InngestModule } from '@common/inngest';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), InngestModule],
})
export class AppModule {}
```

### 2. Create your first function

```typescript
// packages/inngest/src/functions/index.ts
import { inngest } from './inngest.module';

export const myFirstFunction = inngest.createFunction(
  { id: 'my-first-function' },
  { event: 'app/initialized' },
  async ({ event, step }) => {
    // Step 1: Send welcome email
    await step.run('send-welcome-email', async () => {
      console.log(`Welcome, ${event.data.email}`);
    });

    // Step 2: Create user record
    await step.run('create-user', async () => {
      return { userId: '123', email: event.data.email };
    });
  },
);
```

### 3. Send events from any service

```typescript
import { InngestService } from '@common/inngest';

@Injectable()
export class OnboardingService {
  constructor(private readonly inngest: InngestService) {}

  async triggerOnboarding(email: string) {
    await this.inngest.sendEvent({
      name: 'app/initialized',
      data: { email, timestamp: new Date().toISOString() },
    });
  }
}
```

---

## Event Naming Convention

Use `domain/action` format for event names:

```
app/user.created        ✓ Good
scrapping/hola-inngest  ✓ Good (from example)
userCreated            ✗ Missing domain prefix
```

The prefix (`app/`, `scrapping/`, etc.) helps organize events in the Inngest dashboard.

---

## Endpoints

The module automatically registers two endpoints:

| Endpoint                    | Method | Purpose                                        |
| --------------------------- | ------ | ---------------------------------------------- |
| `/api/inngest`              | ALL    | Inngest server sync (fetch deployed functions) |
| `/api/inngest-events/:name` | POST   | Send test events during development            |

---

## sendEvent vs sendEvents

```typescript
// Single event — fire and forget
await inngest.sendEvent({ name: 'user/created', data: { userId: '123' } });

// Batch events — all sent in one request
await inngest.sendEvents([
  { name: 'user/created', data: { userId: '123' } },
  { name: 'analytics/track', data: { event: 'signup' } },
]);
```

---

## Trigger Options

Functions can be triggered by:

```typescript
// Single event
{
  event: 'user/created';
}

// Multiple events (OR)
{
  events: ['user/created', 'user/updated'];
}

// Cron schedule
{
  cron: '*/5 * * * *';
} // Every 5 minutes
```

---

## Step Retry Behavior

Steps automatically retry on failure:

| Attempt | Delay      | Notes               |
| ------- | ---------- | ------------------- |
| 1       | immediate  |                     |
| 2       | 30 seconds |                     |
| 3       | ~1 minute  | Exponential backoff |
| 4       | ~2 minutes |                     |
| 5       | failure    | Final attempt       |

Configurable via `retries` option:

```typescript
inngest.createFunction(
  {
    id: 'my-function',
    retries: 3, // Override default (5)
  },
  { event: 'app/data' },
  async ({ event, step }) => {
    /* ... */
  },
);
```

---

## Environment Variables

```env
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
INNGEST_BASE_URL=https://inngest.treborjs-dev.online/
```

---

## API Reference

### InngestService

#### `sendEvent(event)`

Send a single event to the Inngest server.

```typescript
await inngest.sendEvent({
  name: 'user/created',
  data: { userId: '123', email: 'user@example.com' },
  user: { id: '123' },
});
// Returns: Promise<EventResponse>
```

#### `sendEvents(events)`

Send multiple events in a single batch request.

```typescript
await inngest.sendEvents([
  { name: 'user/created', data: { userId: '123' } },
  { name: 'analytics/track', data: { event: 'signup' } },
]);
// Returns: Promise<EventResponse>
```

#### `getClient()`

Returns the underlying Inngest client instance for advanced usage.

```typescript
const client = inngest.getClient();
```

### Inngest Client (via createFunction)

Define background functions that react to events or schedules:

```typescript
import { inngest } from './inngest.module';

// Event-triggered function
export const myFunction = inngest.createFunction(
  { id: 'my-function', retries: 3 },
  { event: 'user/created' },
  async ({ event, step }) => {
    await step.run('send-email', async () => {
      // Send welcome email
    });
    return { status: 'done' };
  },
);

// Cron-triggered function
export const scheduledTask = inngest.createFunction(
  { id: 'hourly-cleanup' },
  { cron: '0 * * * *' },
  async ({ step }) => {
    await step.run('cleanup-temp-files', async () => {
      // Clean up temporary data
    });
  },
);
```

### Trigger Options

| Trigger         | Syntax                                         | Description                      |
| --------------- | ---------------------------------------------- | -------------------------------- |
| Single event    | `{ event: 'user/created' }`                    | Fire on a specific event name    |
| Multiple events | `{ events: ['user/created', 'user/updated'] }` | Fire on any of these events (OR) |
| Cron schedule   | `{ cron: '*/5 * * * *' }`                      | Fire on a time schedule          |

---

## Error Handling

### Connection Errors

| Error                   | Cause                      | Resolution                                                      |
| ----------------------- | -------------------------- | --------------------------------------------------------------- |
| `fetch failed`          | Inngest server unreachable | Verify `INNGEST_BASE_URL` is correct and server is running      |
| `ECONNREFUSED`          | Port closed or server down | Start Inngest server or check firewall                          |
| `TLS certificate error` | Self-signed cert in dev    | Set `NODE_TLS_REJECT_UNAUTHORIZED=0` for local development only |

### Event Sync

| Issue                        | Cause                      | Resolution                                              |
| ---------------------------- | -------------------------- | ------------------------------------------------------- |
| Event sent but not triggered | Functions not synced       | POST to `/api/inngest` to sync deployed functions       |
| Function not in dashboard    | Registration not picked up | Check Inngest module imports; trigger sync via endpoint |

### Step Retry Pattern

Steps automatically retry with exponential backoff on failure:

```typescript
inngest.createFunction(
  { id: 'resilient-function', retries: 5 },
  { event: 'app/process' },
  async ({ event, step }) => {
    await step.run('critical-step', async () => {
      // This step retries up to 5 times:
      // attempt 1 → immediate
      // attempt 2 → 30s delay
      // attempt 3 → ~1 min
      // attempt 4 → ~2 min
      // attempt 5 → final, function fails if still failing
    });
  },
);
```

---

---

## Cross-Cutting

> When modifying this package, also check:
> - [`serve/` sub-module](src/serve/) — Wraps `InngestModule` for HTTP endpoints (`/api/inngest` sync, `/api/inngest-events/` triggers)

---

## Common Issues

| Issue                                   | Cause                      | Solution                                 |
| --------------------------------------- | -------------------------- | ---------------------------------------- |
| `Event sent but function not triggered` | Function not synced        | POST to `/api/inngest` to sync           |
| `fetch failed`                          | Inngest server unreachable | Check `INNGEST_BASE_URL` is correct      |
| `ECONNREFUSED`                          | Inngest server not running | Start Inngest server or check URL        |
| Function not in dashboard               | Not synced yet             | Trigger sync via `/api/inngest` endpoint |
