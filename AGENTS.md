# AGENTS.md - NestJS Boilerplate Service

> **Note:** This document is for AI agents and developers working on this NestJS monorepo. Follow these guidelines for consistency.

---

## Quick Reference

| Task                 | Command                                |
| -------------------- | -------------------------------------- |
| **Dev Server**       | `npm run start:dev`                    |
| **Build**            | `npm run build`                        |
| **Lint**             | `npm run lint`                         |
| **Test Unit**        | `npm run test`                         |
| **Test Single File** | `npm run test -- path/to/file.spec.ts` |
| **Test E2E**         | `npm run test:e2e`                    |
| **Format**           | `npm run format`                       |
| **Prod Start**       | `npm run start:prod`                  |

---

## 1. Project Overview

**Architecture:** NestJS 11 monorepo with TypeScript
**Database:** MongoDB via Mongoose
**Task Queue:** Inngest (self-hosted)
**Browser Automation:** Playwright
**API Docs:** Swagger at `/api`

### Structure

```
api-nominas/
├── packages/                    # Reusable packages (extractable)
│   ├── common/                 # Common utilities
│   │   └── src/
│   │       ├── base-adapter.interface.ts
│   │       └── database-exception.filter.ts
│   ├── database/              # MongoDB module
│   │   └── src/
│   │       ├── database.module.ts
│   │       ├── database.service.ts
│   │       ├── config/database.config.ts
│   │       └── transaction/    # Transaction wrappers
│   ├── inngest/               # Inngest module
│   │   └── src/
│   │       ├── inngest.module.ts
│   │       ├── inngest.service.ts
│   │       └── functions/
│   ├── playwright/             # Playwright module
│   │   └── src/
│   │       ├── playwright.module.ts
│   │       └── playwright.service.ts
│   └── resend/                 # Email module
│       └── src/
│           ├── resend.module.ts
│           ├── resend.service.ts
│           ├── config/resend.config.ts
│           └── modules/newsletter/  # Newsletter functionality
│
├── apps/
│   └── nominas/      # Main application
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           └── modules/
│               └── usuarios/   # Example CRUD module
│
├── Dockerfile
├── docker-compose.yml
├── nest-cli.json
└── tsconfig.json
```

---

## 2. Using Shared Packages

Imports use `@common/*` paths:

```typescript
import { DatabaseModule } from '@common/database';
import { InngestModule } from '@common/inngest';
import { PlaywrightModule } from '@common/playwright';
import { ResendModule } from '@common/resend';
import { DatabaseExceptionFilter } from '@common/common';
```

---

## 3. Development Setup

### Environment Variables (.env)

```env
MONGODB_URI=mongodb://localhost:27017/boilerplate_db
PORT=3000

# Resend
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=your@domain.com
RESEND_FROM_NAME=Your App Name
RESEND_REPLY_TO=reply@domain.com

# Playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
PLAYWRIGHT_RETRIES=3

# Inngest (self-hosted)
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
INNGEST_BASE_URL=https://inngest.treborjs-dev.online/
```

### Prerequisites

- Node.js 20+
- MongoDB running locally or connection string
- Inngest server (self-hosted or cloud)

---

## 4. Commands Reference

### Build & Run

```bash
npm run build                    # Compile TypeScript (apps + packages)
npm run start                    # Start dev server
npm run start:dev               # Start with watch mode
npm run start:prod              # Start production build
```

### Testing

```bash
npm run test                    # Run unit tests
npm run test -- --watch        # Watch mode
npm run test -- path.spec.ts   # Single test file
npm run test:cov               # With coverage
npm run test:e2e               # E2E tests only
```

### Code Quality

```bash
npm run lint                   # ESLint with auto-fix
npm run format                 # Prettier formatting
```

---

## 5. Code Style Guidelines

### Imports Order

```typescript
// 1. NestJS core
import { Module, Injectable } from '@nestjs/common';

// 2. External packages
import { Inngest } from 'inngest';

// 3. Shared packages
import { DatabaseModule } from '@common/database';
import { InngestService } from '@common/inngest';

// 4. DTOs/Interfaces (local)
import { CreateUsuarioDto } from './dto';
```

### Naming Conventions

- **Files:** `kebab-case.ts`
- **Classes:** `PascalCase`
- **Interfaces:** `PascalCase`
- **DTOs:** `PascalCase` with `Dto` suffix
- **Constants:** `UPPER_SNAKE_CASE`
- **Variables/Functions:** `camelCase`

### Dependency Injection

```typescript
// ✅ CORRECT: Constructor injection
@Injectable()
export class UsuariosService {
  constructor(
    private readonly repository: UsuariosRepository,
    private readonly inngest: InngestService,
  ) {}
}
```

### Module Organization

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,    // @common/database
    InngestModule,     // @common/inngest
    PlaywrightModule,   // @common/playwright
    UsuariosModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class AppModule {}
```

---

## 6. External Services

### @common/database

MongoDB connection with retry logic.

**Transaction Support:**
The database package provides a transaction wrapper for atomic operations:

```typescript
import { TransactionService } from '@common/database';

// In any service
constructor(private readonly transaction: TransactionService) {}

async createOrderWithInventory(dto: CreateOrderDto) {
  return this.transaction.withTransaction(async (session) => {
    // All operations inside use the same transaction
    const order = await this.orderRepo.create(dto, { session });
    await this.inventoryService.decrementStock(dto.items, { session });
    return order;
  });
}
```

**Transaction Options:**
```typescript
await this.transaction.withTransaction(operation, {
  retry: true,        // Auto-retry on transient errors (default: true)
  maxRetries: 3,       // Maximum retry attempts (default: 3)
});
```

### @common/inngest

Event-driven task queue.

**Endpoints:**
- `/api/inngest` - Inngest function sync
- `/api/inngest-events/hola-inngest` - Test event

### @common/playwright

Browser automation for web scraping.

### @common/resend

Email service via Resend API with newsletter module.

**Basic Usage:**
```typescript
import { ResendService } from '@common/resend';

@Injectable()
export class MyService {
  constructor(private readonly resendService: ResendService) {}

  async sendWelcome(email: string) {
    return this.resendService.sendEmail({
      to: email,
      subject: 'Welcome!',
      html: '<h1>Welcome to our app</h1>',
    });
  }
}
```

**Newsletter Module:**
```typescript
import { NewsletterModule } from '@common/resend';

@Module({
  imports: [NewsletterModule],
})
export class AppModule {}
```

**Environment Variables:**
```env
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=your@domain.com
RESEND_FROM_NAME=Your App Name
RESEND_REPLY_TO=reply@domain.com
```

---

## 7. Creating New Modules

### Step 1: Create structure

```
apps/nominas/src/modules/mi-modulo/
├── dto/
├── interfaces/
├── schemas/
├── mi-modulo.controller.ts
├── mi-modulo.module.ts
├── mi-modulo.repository.ts
└── mi-modulo.service.ts
```

### Step 2: Define Schema

```typescript
@Schema({ timestamps: true })
export class MiEntidad {
  @Prop({ required: true })
  nombre: string;
}

export const MiEntidadSchema = SchemaFactory.createForClass(MiEntidad);
```

### Step 3: Create Repository, Service, Controller

### Step 4: Register in Module

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: MiEntidad.name, schema: MiEntidadSchema }])],
  controllers: [MiEntidadController],
  providers: [MiEntidadRepository, MiEntidadService],
  exports: [MiEntidadService],
})
export class MiEntidadModule {}
```

### Step 5: Import in AppModule

```typescript
@Module({
  imports: [MiEntidadModule],
})
export class AppModule {}
```

---

## 8. Extracting Packages

Packages in `packages/` are **self-contained and reusable**.

### To extract to another project:

1. Copy package folder (e.g., `packages/database/`)
2. Configure `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@common/database": ["path/to/database/src/index.ts"]
    }
  }
}
```

3. Install dependencies:

```bash
cd packages/database && npm install
```

4. Import in your AppModule:

```typescript
import { DatabaseModule } from '@common/database';
```

---

## 9. Troubleshooting

**Port already in use:**

```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**MongoDB connection failed:**

```bash
mongosh --eval "db.adminCommand('ping')"
```

**Playwright browsers not found:**

```bash
npx playwright install
```

---

## 10. Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection string set
- [ ] Inngest keys configured
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Swagger docs at `/api`
- [ ] Health check at `/api/usuarios`
- [ ] Docker image builds successfully

---

**Last Updated:** 2026-04-26
**NestJS Version:** 11.x
**TypeScript Version:** 5.7.x

## 11. Key Files

| File | Purpose |
|------|---------|
| `BOILERPLATE.md` | Complete extension guide |
| `AGENTS.md` | This file |
| `nest-cli.json` | Monorepo configuration |
| `packages/*/` | Reusable packages |

---

## 12. Docker

```bash
# Build image
docker build -t boilerplate-service .

# Run with docker-compose
docker-compose up -d

# Test script
./docker-test.sh
```

**See:** `README.Docker.md` for complete Docker documentation