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
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InngestModule,
  ],
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
  }
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

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/inngest` | ALL | Inngest server sync (fetch deployed functions) |
| `/api/inngest-events/:name` | POST | Send test events during development |

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
{ event: 'user/created' }

// Multiple events (OR)
{ events: ['user/created', 'user/updated'] }

// Cron schedule
{ cron: '*/5 * * * *' }  // Every 5 minutes
```

---

## Step Retry Behavior

Steps automatically retry on failure:

| Attempt | Delay | Notes |
|--------|-------|-------|
| 1 | immediate | |
| 2 | 30 seconds | |
| 3 | ~1 minute | Exponential backoff |
| 4 | ~2 minutes | |
| 5 | failure | Final attempt |

Configurable via `retries` option:

```typescript
inngest.createFunction(
  {
    id: 'my-function',
    retries: 3,  // Override default (5)
  },
  { event: 'app/data' },
  async ({ event, step }) => { /* ... */ }
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

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Event sent but function not triggered` | Function not synced | POST to `/api/inngest` to sync |
| `fetch failed` | Inngest server unreachable | Check `INNGEST_BASE_URL` is correct |
| `ECONNREFUSED` | Inngest server not running | Start Inngest server or check URL |
| Function not in dashboard | Not synced yet | Trigger sync via `/api/inngest` endpoint |