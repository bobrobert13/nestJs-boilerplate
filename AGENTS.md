# AGENTS.md - NestJS Boilerplate Service

> **Purpose:** Technical reference for AI agents and developers working on this NestJS monorepo. For the Spanish-language tutorial guide, see [BOILERPLATE.md](./BOILERPLATE.md).

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
| **Test E2E**         | `npm run test:e2e`                     |
| **Format**           | `npm run format`                       |
| **Prod Start**       | `npm run start:prod`                   |

---

## Feature-to-File Index

> **Context budget rule:** For focused changes, read ONLY the files listed below + their DTOs/interfaces. Do NOT load the full AGENTS.md unless the task spans 3+ feature areas. Use this index as a surgical lookup table.

| If the user asks about...          | Read these files                                                                                            | May also need                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Login / registro / JWT             | `packages/auth/src/services/auth.service.ts`, `strategies/auth.controller.ts`, `strategies/jwt.strategy.ts` | `interfaces/auth.interfaces.ts`, `dto/auth.dto.ts`                                |
| Magic links                        | `packages/auth/src/services/magic-link.service.ts`, `strategies/auth.controller.ts`                         | `config/auth.config.ts`                                                           |
| 2FA / TOTP                         | `packages/auth/src/two-factor/two-factor.service.ts`, `two-factor.controller.ts`                            | `interfaces/two-factor.interfaces.ts`, `dto/two-factor.dto.ts`                    |
| Passkeys / WebAuthn                | `packages/auth/src/passkeys/passkeys.service.ts`, `passkeys.controller.ts`                                  | `dto/passkeys.dto.ts`, `interfaces/passkeys.interfaces.ts`                        |
| MongoDB / conexión DB              | `packages/database/src/database.service.ts`, `config/database.config.ts`                                    | `database.module.ts`                                                              |
| Transacciones DB                   | `packages/database/src/transaction/transaction.service.ts`, `decorators/transaction.decorator.ts`           | `transaction-manager.ts`, `transactional-wrapper.ts`                              |
| Envío de emails                    | `packages/resend/src/services/resend.service.ts`, `config/resend.config.ts`                                 | `interfaces/email-options.interface.ts`                                           |
| Newsletter                         | `packages/resend/src/modules/newsletter/newsletter.service.ts`, `newsletter.controller.ts`                  | `interfaces/newsletter.interfaces.ts`                                             |
| IA / ChatGPT / AI / embeddings     | `packages/ai/src/ai.service.ts`, `types/ai.types.ts`                                                        | `interfaces/provider.interface.ts`, `providers/openai-compatible.provider.ts`     |
| Generar schema desde doc/imagen    | `apps/nominas/src/modules/dynamic-schema/services/dynamic-schema.service.ts`, `schema-compiler.service.ts`  | `dynamic-schema.controller.ts`, `dto/generate-schema.dto.ts`                      |
| Extraer texto de PDF/DOCX          | `packages/documents/src/services/document-processor.service.ts`, `pdf.service.ts`, `docx.service.ts`        | `interfaces/parser.interface.ts`, `types/document.types.ts`                       |
| HTTP requests / descargar archivos | `packages/http/src/services/http.service.ts`, `download.service.ts`                                         | `http-error.ts`, `interfaces/http-options.interface.ts`                           |
| Web scraping / Playwright          | `packages/playwright/src/playwright.service.ts`                                                             | `interfaces/playwright-options.interface.ts`, `constants/playwright.constants.ts` |
| Tareas en background / Inngest     | `packages/inngest/src/inngest.service.ts`, `functions/index.ts`                                             | `serve/inngest.serve.module.ts`, `serve/inngest-events.controller.ts`             |
| CRUD / usuarios / API REST         | `apps/nominas/src/modules/usuarios/usuarios.service.ts`, `usuarios.controller.ts`, `usuarios.repository.ts` | `schemas/usuario.schema.ts`, `dto/`                                               |
| Templates HTML / EJS               | `packages/serve-static/src/serve-static.service.ts`                                                         | `templates/layouts/`, `templates/pages/`                                          |
| Errores HTTP / excepciones         | `packages/http/src/http-error.ts`, `packages/common/src/database-exception.filter.ts`                       | —                                                                                 |
| Crear un NUEVO módulo              | AGENTS.md §9 (Creating New Modules)                                                                         | AGENTS.md §6 Module Patterns                                                      |

### Cross-Cutting Concerns

When the user's request touches multiple features, ask before expanding scope:

| If the request touches... | Also check...                              | Why                                          |
| ------------------------- | ------------------------------------------ | -------------------------------------------- |
| Auth (login/register)     | `@common/resend`                           | Email verification, magic links              |
| Auth (login/register)     | `@common/auth/two-factor/`                 | May affect 2FA flow                          |
| Auth (login/register)     | `@common/auth/passkeys/`                   | May affect WebAuthn flow                     |
| Database transactions     | `apps/nominas/src/modules/usuarios/`       | CRUD modules likely use transactions         |
| AI / schema generation    | `@common/documents`                        | Schema gen often follows document extraction |
| AI / schema generation    | `apps/nominas/src/modules/dynamic-schema/` | Pipeline depends on AI service               |
| HTTP / downloads          | `@common/playwright`                       | Downloaded files may need scraping           |
| Emails / newsletter       | `@common/resend`                           | Newsletter uses Resend under the hood        |
| Templates / EJS           | `@common/serve-static`                     | Template rendering uses EJS + TailwindCSS    |

> **Rule:** If the user asks for a change in any of the "If the request touches..." columns, STOP and ask: "This change could affect [related area]. Should I include that in scope?"

---

## Package Capability Matrix

| Package              | Import Path                 | Key Exports                                                                                               | Documented |
| -------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| @common/ai           | `@common/ai`                | AiService, ChatMessage, AIResponse, GeneratedSchema                                                       | Full       |
| @common/auth         | `@common/auth`              | AuthService, JwtAuthGuard, RolesGuard, Public, Roles, MagicLinkService, TwoFactorService, PasskeysService | Full       |
| @common/common       | `@common/common`            | BaseAdapter\<T\>, DatabaseExceptionFilter, HttpError                                                      | Full       |
| @common/database     | `@common/database`          | TransactionService, TransactionManager, TransactionalWrapper, @Transaction, @TransactionParam             | Full       |
| @common/documents    | `@common/documents`         | DocumentProcessorService, PdfService, DocxService, DocumentContent                                        | Full       |
| @common/http         | `@common/http`              | HttpService, DownloadService, HttpError, createHttpError, BadRequestError, NotFoundError...               | Full       |
| @common/inngest      | `@common/inngest`           | InngestService, InngestServeModule                                                                        | Full       |
| @common/playwright   | `@common/playwright`        | PlaywrightService, PlaywrightOptions                                                                      | Full       |
| @common/resend       | `@common/resend`            | ResendService, NewsletterModule, NewsletterService                                                        | Full       |
| @common/serve-static | `@common/serve-static`      | ServeStaticModule, ServeStaticService                                                                     | Full       |
| dynamic-schema       | `./modules/dynamic-schema/` | DynamicSchemaService, SchemaCompilerService (App Module)                                                  | Full       |
| usuarios             | `./modules/usuarios/`       | UsuariosService, UsuariosRepository (App Module)                                                          | Full       |

> **Tip:** Use Ctrl+F with the import path to jump directly to the package's API reference in §8.

---

## 1. Project Overview

**Architecture:** NestJS 11 monorepo with TypeScript
**Database:** MongoDB via Mongoose
**Task Queue:** Inngest (self-hosted)
**Browser Automation:** Playwright
**API Docs:** Swagger at `/api`

### Structure

```
nestJs-boilerplate/
├── packages/                    # Reusable packages (extractable)
│   ├── ai/                      # AI providers wrapper (OpenAI, Anthropic, Gemini, etc.)
│   │   └── src/
│   │       ├── ai.module.ts
│   │       ├── ai.service.ts
│   │       ├── types/
│   │       │   └── ai.types.ts
│   │       ├── interfaces/
│   │       │   └── provider.interface.ts
│   │       └── providers/
│   │           └── openai-compatible.provider.ts
│   ├── auth/                   # Authentication module
│   │   └── src/
│   │       ├── auth.module.ts
│   │       ├── auth.service.ts
│   │       ├── magic-link.service.ts
│   │       ├── strategies/
│   │       │   ├── jwt.strategy.ts
│   │       │   └── local.strategy.ts
│   │       ├── guards/
│   │       │   ├── jwt-auth.guard.ts
│   │       │   └── roles.guard.ts
│   │       ├── decorators/
│   │       │   ├── public.decorator.ts
│   │       │   └── roles.decorator.ts
│   │       ├── two-factor/
│   │       └── passkeys/
│   ├── common/                 # Common utilities
│   │   └── src/
│   │       ├── base-adapter.interface.ts
│   │       ├── database-exception.filter.ts
│   │       └── http-error.handler.ts
│   ├── database/              # MongoDB module
│   │   └── src/
│   │       ├── database.module.ts
│   │       ├── database.service.ts
│   │       ├── config/database.config.ts
│   │       └── transaction/
│   │           ├── transaction.service.ts
│   │           └── decorators/
│   │               └── transaction.decorator.ts
│   ├── documents/             # Document text extraction (PDF, DOCX)
│   │   └── src/
│   │       ├── document.module.ts
│   │       ├── services/
│   │       │   ├── pdf.service.ts
│   │       │   ├── docx.service.ts
│   │       │   └── document-processor.service.ts
│   │       └── interfaces/
│   │           └── parser.interface.ts
│   ├── http/                   # HTTP client module
│   │   └── src/
│   │       ├── http.module.ts
│   │       └── services/
│   │           ├── http.service.ts
│   │           └── download.service.ts
│   ├── inngest/               # Inngest module
│   │   └── src/
│   │       ├── inngest.module.ts
│   │       ├── inngest.service.ts
│   │       └── functions/
│   │           └── index.ts
│   ├── playwright/             # Playwright module
│   │   └── src/
│   │       ├── playwright.module.ts
│   │       ├── playwright.service.ts
│   │       ├── constants/
│   │       └── interfaces/
│   ├── resend/                 # Email module
│   │   └── src/
│   │       ├── resend.module.ts
│   │       ├── resend.service.ts
│   │       ├── config/resend.config.ts
│   │       └── modules/newsletter/
│   └── serve-static/           # Static file serving with templates
│       └── src/
│           ├── serve-static.module.ts
│           ├── serve-static.service.ts
│           └── index.ts
│       └── templates/          # Work folder for templates
│           ├── layouts/
│           ├── pages/
│           ├── partials/
│           └── assets/
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

## 2. Architecture & Data Flow

### Dependency Graph

\`\`\`
apps/nominas
├── @common/database —— MongoDB connection, transactions
├── @common/inngest —— Event-driven task queue
├── @common/playwright —— Browser automation
├── usuarios/ —— CRUD example module
└── dynamic-schema/ —— AI pipeline module
├── @common/ai —— Schema generation from text/images
└── @common/documents —— PDF/DOCX text extraction

@common/auth
├── two-factor/ —— TOTP 2FA sub-module
└── passkeys/ —— WebAuthn sub-module

@common/resend
└── newsletter/ —— Email newsletter sub-module
\`\`\`

### Standalone Packages

These packages have no internal dependencies and can be extracted independently:

- `@common/ai` — AI providers wrapper
- `@common/common` — Base adapters, exception filters
- `@common/http` — HTTP client with downloads
- `@common/serve-static` — EJS templates with TailwindCSS

> **Related:** [Package Capability Matrix](#package-capability-matrix), [§8 External Services](#8-external-services)

---

## 3. Using Shared Packages

Imports use `@common/*` paths:

```typescript
import { DatabaseModule } from '@common/database';
import { InngestModule } from '@common/inngest';
import { PlaywrightModule } from '@common/playwright';
import { ResendModule } from '@common/resend';
import {
  AuthModule,
  JwtAuthGuard,
  RolesGuard,
  Public,
  Roles,
} from '@common/auth';
import { ServeStaticModule, ServeStaticService } from '@common/serve-static';
import { AiModule, AiService } from '@common/ai';
import { DatabaseExceptionFilter } from '@common/common';
```

---

## 4. Development Setup

### Environment Variables (.env)

```env
MONGODB_URI=mongodb://localhost:27017/boilerplate_db
PORT=3000

# Resend
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=your@domain.com
RESEND_FROM_NAME=Your App Name
RESEND_REPLY_TO=reply@domain.com

# Auth - JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_TOKEN_TTL=900
JWT_REFRESH_TOKEN_TTL=604800
JWT_ISSUER=api-nominas
JWT_AUDIENCE=api-nominas

# Auth - Magic Link
MAGIC_LINK_ENABLED=true
MAGIC_LINK_TOKEN_TTL=300

# Auth - OAuth (Optional)
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=

# Auth - Password Hashing (Argon2)
ARGON2_TYPE=2
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4

# Auth - Two Factor (2FA)
TWO_FACTOR_ISSUER=MyApp
TWO_FACTOR_ALGORITHM=SHA1
TWO_FACTOR_DIGITS=6
TWO_FACTOR_PERIOD=30
TWO_FACTOR_BACKUP_CODES_COUNT=10
TWO_FACTOR_BACKUP_CODES_LENGTH=10

# Auth - Passkeys (WebAuthn)
PASSKEYS_RP_ID=localhost
PASSKEYS_RP_NAME=MyApp
PASSKEYS_RP_ORIGIN=http://localhost:3000

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

## 5. Commands Reference

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

## 6. Code Style Guidelines

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
    DatabaseModule, // @common/database
    InngestModule, // @common/inngest
    PlaywrightModule, // @common/playwright
    UsuariosModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class AppModule {}
```

---

### Module Patterns

The project uses two module directory structures:

**Pattern A: Flat (single-service CRUD)**
Use for modules with one primary entity (e.g., `usuarios`):

\`\`\`
mi-modulo/
├── mi-modulo.module.ts
├── mi-modulo.controller.ts
├── mi-modulo.service.ts
├── mi-modulo.repository.ts
├── dto/
│ ├── create-mi-entidad.dto.ts
│ └── update-mi-entidad.dto.ts
├── interfaces/
│ └── mi-entidad.interface.ts
└── schemas/
└── mi-entidad.schema.ts
\`\`\`

**Pattern B: Services/ (multi-service pipeline)**
Use for modules with multiple orchestrated services (e.g., `dynamic-schema`):

\`\`\`
mi-modulo/
├── mi-modulo.module.ts
├── mi-modulo.controller.ts
├── mi-modulo.repository.ts
├── dto/
├── schemas/
└── services/
├── primary.service.ts
└── helper.service.ts
\`\`\`

> **Related:** [§7 Error Handling Patterns](#7-error-handling-patterns), [§9 Creating New Modules](#9-creating-new-modules)

---

## 7. Error Handling Patterns

Each package uses a different error strategy. Know which to catch.

| Package           | Strategy                     | Check Pattern                                     | Throw Pattern                                                      |
| ----------------- | ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| @common/ai        | `AIResponse.success` boolean | `if (!result.success) { result.error }`           | Returns `{ success: false, error: string }`, never throws          |
| @common/documents | JSON-stringified error codes | `JSON.parse(error.message).code`                  | `throw new Error(JSON.stringify({ code, message }))`               |
| @common/http      | OOP class hierarchy          | `error instanceof HttpError` / `error.statusCode` | `throw new NotFoundError(msg, url)` or `createHttpError(404, ...)` |
| @common/database  | Native exceptions + retry    | `try/catch` — transient errors auto-retried       | `throw new NotFoundException(...)` from NestJS                     |
| @common/auth      | NestJS HTTP exceptions       | `try/catch` with `UnauthorizedException`          | `throw new UnauthorizedException(...)`                             |
| dynamic-schema    | Error code strings           | `if (!result.success) { result.error }`           | Returns `{ success: false, error: 'SCHEMA_GENERATION_ERROR' }`     |

> **Rule of thumb:** If the package returns `{ success: boolean }`, check it. If it throws, `try/catch` it.

> **Related:** [§2 Architecture](#2-architecture--data-flow), [§8 External Services](#8-external-services)

---

## 8. External Services

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
  retry: true, // Auto-retry on transient errors (default: true)
  maxRetries: 3, // Maximum retry attempts (default: 3)
});
```

**Declarative Transactions (@Transaction decorator):**
The database package also provides decorator-based transactions for declarative style:

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

**@Transaction() Decorator Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retry` | `boolean` | `true` | Auto-retry on transient errors |
| `maxRetries` | `number` | `3` | Maximum retry attempts |

**@TransactionParam() Decorator:**
Injects the current `ClientSession` into controller method parameters:

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

**TransactionManager (Request-Scoped):**
For manual transaction lifecycle control in services:

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

- `start(options?)` - Begin a new transaction
- `commit()` - Commit the current transaction
- `abort()` - Rollback the current transaction
- `end()` - End the session (call in finally)
- `getSession()` - Returns the current `ClientSession`
- `isActive()` - Check if transaction is active
- `getSessionId()` - Get session ID string or null

**TransactionalWrapper:**
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

**When to Use Each:**
| Scenario | Use |
|----------|-----|
| Simple multi-collection write | `TransactionService.withTransaction()` |
| Entire method always needs transaction | `@Transaction()` decorator |
| Complex multi-step logic with conditional rollback | `TransactionManager` |
| Programmatic isolation level control | `TransactionalWrapper` |
| Need session in controller parameter | `@TransactionParam()` |

### @common/http

HTTP client module with error handling and file downloads.

**Basic Usage:**

```typescript
import { HttpModule, HttpService } from '@common/http';

@Module({
  imports: [HttpModule],
})
export class AppModule {}

// In any service
@Injectable()
export class MyService {
  constructor(private readonly http: HttpService) {}

  async fetchData() {
    const response = await this.http.get<MyType>(
      'https://api.example.com/data',
    );
    console.log(response.data, response.status);
  }
}
```

**HTTP Methods:**

- `get<T>(url, headers?)` → `HttpResponse<T>`
- `post<T>(url, data?, headers?)` → `HttpResponse<T>`
- `put<T>(url, data?, headers?)` → `HttpResponse<T>`
- `patch<T>(url, data?, headers?)` → `HttpResponse<T>`
- `delete<T>(url, headers?)` → `HttpResponse<T>`

**HttpResponse Interface:**

```typescript
interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
```

**HttpError Hierarchy:**
All HTTP errors extend `HttpError` and include `statusCode`, `statusText`, `url`, `data`, and a `toJSON()` method.

| Class                     | Status | Description           |
| ------------------------- | ------ | --------------------- |
| `BadRequestError`         | 400    | Bad Request           |
| `UnauthorizedError`       | 401    | Unauthorized          |
| `ForbiddenError`          | 403    | Forbidden             |
| `NotFoundError`           | 404    | Not Found             |
| `TimeoutError`            | 408    | Request Timeout       |
| `InternalServerError`     | 500    | Internal Server Error |
| `ServiceUnavailableError` | 503    | Service Unavailable   |

**Factory Function:**

```typescript
createHttpError(status: number, message: string, url: string, data?: unknown): HttpError
```

> **Note:** The `HttpError` hierarchy is also exported from `@common/common`. Import HttpError classes from whichever package you're already using.

**DownloadService:**
Download files, images, and videos with Sharp image optimization.

```typescript
@Injectable()
export class AssetService {
  constructor(private readonly http: HttpService) {}

  async downloadAssets() {
    const downloader = this.http.download('/tmp/downloads');

    // Download any file
    const { filepath, size } = await downloader.file(
      'https://example.com/report.pdf',
      {
        filename: 'report.pdf',
      },
    );

    // Download and optimize image
    const result = await downloader.image('https://example.com/photo.jpg', {
      optimize: {
        quality: 80,
        width: 800,
        height: 600,
        format: 'webp', // 'webp' | 'jpeg' | 'png'
      },
    });

    // Download video (same as file)
    const video = await downloader.video('https://example.com/video.mp4');
  }
}
```

**DownloadOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `folder` | `string` | `''` | Subfolder for downloaded files |
| `filename` | `string` | auto | Custom filename |
| `headers` | `Record<string, string>` | `{}` | Custom HTTP headers |

**ImageOptimizationOptions:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quality` | `number` | `80` | Image quality (1-100) |
| `width` | `number` | auto | Resize width |
| `height` | `number` | auto | Resize height |
| `format` | `'webp' \| 'jpeg' \| 'png'` | `'webp'` | Output format |

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

### @common/auth

Authentication module with JWT, Magic Links, and OAuth support.

**Basic Usage:**

```typescript
import { AuthModule, JwtAuthGuard, Public, Roles, RolesGuard } from '@common/auth';

@Module({
  imports: [AuthModule],
})
export class AppModule {}

// In controllers
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}

// Public route
@Public()
@Post('login')
async login(@Body() dto: LoginDto) {}

// Role-based access
@Roles('admin')
@UseGuards(RolesGuard)
@Post('admin-only')
adminAction() {}
```

**Services:**

```typescript
// AuthService
const user = await authService.validateUser(email, password);
const tokens = await authService.login(user);
await authService.refreshTokens(refreshToken);
await authService.hashPassword(password); // Argon2
await authService.comparePassword(password, hash); // Argon2

// MagicLinkService
const token = await magicLinkService.generateMagicLink(email);
const email = await magicLinkService.verifyMagicLink(token);
```

**Argon2 Password Hashing:**

```typescript
// Hash password with argon2id (more secure than bcrypt)
const hash = await authService.hashPassword(password);
const isValid = await authService.comparePassword(plainPassword, hash);
```

**Decorators:**

- `@Public()` - Skip JWT validation
- `@Roles(...roles)` - Require specific roles

### @common/auth - Two Factor (2FA)

Two-factor authentication with TOTP and backup codes.

```typescript
import { TwoFactorModule, TwoFactorService } from '@common/auth';

@Module({
  imports: [AuthModule, TwoFactorModule],
})
export class AppModule {}

// Inject service
constructor(private readonly twoFactorService: TwoFactorService) {}

// Generate secret and QR code
const result = await twoFactorService.generateSecret(userId);
return { qrCode: result.qrCode, backupCodes: result.backupCodes };

// Enable 2FA
await twoFactorService.enableTwoFactor(userId, code);

// Verify code
const result = await twoFactorService.verifyCode(userId, code);

// Verify backup code
await twoFactorService.verifyBackupCodeWithUser(userId, backupCode);
```

**2FA Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/2fa/generate` | Generate secret and QR |
| POST | `/auth/2fa/enable` | Enable 2FA |
| POST | `/auth/2fa/verify` | Verify TOTP code |
| POST | `/auth/2fa/verify-backup` | Verify backup code |
| POST | `/auth/2fa/regenerate-backup-codes` | Regenerate codes |
| POST | `/auth/2fa/disable` | Disable 2FA |

**2FA Environment Variables:**

```env
TWO_FACTOR_ISSUER=MyApp
TWO_FACTOR_ALGORITHM=SHA1
TWO_FACTOR_DIGITS=6
TWO_FACTOR_PERIOD=30
TWO_FACTOR_BACKUP_CODES_COUNT=10
TWO_FACTOR_BACKUP_CODES_LENGTH=10
```

### @common/auth - Passkeys (WebAuthn)

Passwordless authentication using hardware biometrics.

```typescript
import { PasskeysModule, PasskeysService } from '@common/auth';

@Module({
  imports: [AuthModule, PasskeysModule],
})
export class AppModule {}

// Inject service
constructor(private readonly passkeysService: PasskeysService) {}

// Generate registration options
const options = await passkeysService.generateRegistrationOptions(userId, email);

// Verify registration
const result = await passkeysService.verifyRegistration(userId, email, response);

// Generate authentication options
const authOptions = await passkeysService.generateAuthenticationOptions(userId);

// Verify authentication
const verifyResult = await passkeysService.verifyAuthentication(userId, credentialId, response);
```

**Passkeys Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/passkeys/register-options` | Get registration options |
| POST | `/auth/passkeys/register-verify` | Verify passkey registration |
| POST | `/auth/passkeys/login-options` | Get login options |
| POST | `/auth/passkeys/login-verify` | Verify passkey login |
| GET | `/auth/passkeys/list` | List user's passkeys |
| DELETE | `/auth/passkeys/delete/:id` | Delete a passkey |

**Passkeys Environment Variables:**

```env
PASSKEYS_RP_ID=localhost
PASSKEYS_RP_NAME=MyApp
PASSKEYS_RP_ORIGIN=http://localhost:3000
```

### @common/serve-static

Static file serving with EJS template engine and TailwindCSS CDN support.

**Basic Usage:**

```typescript
import { ServeStaticModule, ServeStaticService } from '@common/serve-static';

@Module({
  imports: [ServeStaticModule],
})
export class AppModule {}

// In controller
@Controller()
export class AppController {
  constructor(private readonly serveStatic: ServeStaticService) {}

  @Get()
  async home(@Res() res: Response) {
    const html = await this.serveStatic.render('home', {
      title: 'Bienvenido',
      description: 'Página principal',
      layout: 'main',
    });
    res.send(html);
  }
}
```

**Template Structure:**

```
packages/serve-static/templates/
├── layouts/          # Layout templates (main.ejs)
├── pages/            # Page templates (home.ejs, about.ejs)
├── partials/         # Reusable partials (header.ejs, footer.ejs)
└── assets/           # Static assets (css/, js/)
```

**Methods:**

- `render(view, options)` - Render page with layout
- `renderString(template, data)` - Render template string
- `getPages()` - List available pages
- `getPartials()` - List available partials

**TailwindCSS:** Loaded via CDN by default (`https://cdn.tailwindcss.com`)

### @common/ai

AI Providers wrapper supporting OpenAI, Anthropic, Google Gemini, Moonshot (Kimi), MiniMax and any OpenAI-compatible API.

**Basic Usage:**

```typescript
import { AiModule, AiService, ChatMessage } from '@common/ai';

@Module({
  imports: [AiModule],
})
export class AppModule {}

// In any service
@Injectable()
export class MyService {
  constructor(private readonly ai: AiService) {}

  async generateContent() {
    const response = await this.ai.generateText(
      'openai',
      'Explain quantum computing',
      'You are a helpful assistant',
    );

    if (response.success) {
      console.log(response.data);
    }
  }
}
```

**Pre-configured Providers:**
| Provider | Model | Description |
|----------|-------|-------------|
| `openai` | gpt-4o | OpenAI GPT models |
| `anthropic` | claude-3-5-sonnet | Anthropic Claude models |
| `google` | gemini-2.0-flash | Google Gemini models |
| `moonshot` | moonshot-v1-8k | Moonshot Kimi models |
| `minimax` | MiniMax-Text-01 | MiniMax models |

**Key Methods:**

- `chat(provider, messages, options?)` - Chat completions
- `generateText(provider, prompt, systemPrompt?, options?)` - Text generation
- `generateSchema(provider, description, options?)` - Generate Mongoose schemas
- `generateTemplate(provider, type, description, options?)` - Generate HTML, email, JSON, code
- `embeddings(provider, input, options?)` - Generate embeddings
- `createEmbedding(provider, text)` - Single embedding vector
- `chatStream(provider, messages, onChunk, options?)` - Streaming responses
- `generateSchemaFromImage(provider, imageData, options?)` - Generate schemas from images
- `generateSchemaFromText(provider, text, options?)` - Generate schemas from text
- `registerProvider(config)` - Add custom provider

**Custom Provider:**

```typescript
aiService.registerProvider({
  provider: 'custom',
  model: 'llama-3',
  apiKey: 'not-needed',
  baseUrl: 'http://localhost:11434/v1',
});
```

**Schema Generation from Images and Text:**
The AI service can also generate Mongoose schemas from images (e.g., scanned forms, invoices) and text content (e.g., extracted document text):

```typescript
// Generate schema from image (base64 or URL)
const imageResult = await aiService.generateSchemaFromImage(
  'openai',
  'data:image/png;base64,iVBORw0KGgo...',
  { temperature: 0.3 },
);

if (imageResult.success) {
  const schema: GeneratedSchema = imageResult.data;
  console.log(schema.fields, schema.collectionName);
}

// Generate schema from text content
const textResult = await aiService.generateSchemaFromText(
  'anthropic',
  'User registration form with fields: name (string), email (string), age (number)',
  { temperature: 0.3, model: 'claude-3-5-sonnet' },
);

if (textResult.success) {
  const schema: GeneratedSchema = textResult.data;
  // Use schema with SchemaCompilerService
}
```

**GeneratedSchema Interface:**

```typescript
interface GeneratedSchema {
  fields: SchemaFieldDefinition[];
  collectionName: string;
  metadata?: Record<string, unknown>;
}
```

**SchemaFieldDefinition:**

```typescript
interface SchemaFieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  validate?: Record<string, unknown>;
  default?: unknown;
}
```

**SchemaGenerationOptions:**

```typescript
interface SchemaGenerationOptions {
  temperature?: number;
  model?: string;
}
```

### @common/dynamic-schema (App Module)

AI-powered Mongoose schema generation from documents. Located in `apps/nominas/src/modules/dynamic-schema/`.

**Overview:**
Converts documents (PDF, DOCX) into MongoDB schemas using AI. The pipeline extracts text from documents, sends it to an AI provider (via `@common/ai`), and automatically compiles the result into a Mongoose schema.

**Pipeline:**

```
Document → DocumentProcessorService → AI (generateSchemaFromText) → SchemaCompilerService → Mongoose Schema
```

**Module Registration:**

```typescript
import { DynamicSchemaModule } from './modules/dynamic-schema/dynamic-schema.module';

@Module({
  imports: [DynamicSchemaModule],
})
export class AppModule {}
```

**Dependencies:**

- `@common/ai` — AI schema generation
- `@common/documents` — PDF/DOCX text extraction

**Endpoints:**
| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| POST | `/dynamic-schema/extract` | `{ document, format }` | `{ success, documentContent }` | Extract text from PDF/DOCX |
| POST | `/dynamic-schema/generate-from-text` | `{ text, provider?, temperature? }` | `{ schema, collectionName }` | Generate schema from text |
| POST | `/dynamic-schema/generate-from-image` | `{ imageData, provider?, temperature? }` | `{ schema, collectionName }` | Generate schema from image |
| POST | `/dynamic-schema/compile` | `{ schema, collectionName }` | `{ collectionName, success }` | Compile schema for MongoDB |
| POST | `/dynamic-schema/pipeline` | `{ document, format, provider?, temperature? }` | `{ documentContent, schema, collectionName }` | Full extract → generate → compile pipeline |

**Services:**

- `DynamicSchemaService` — Orchestrates the document→schema→compile workflow
- `SchemaCompilerService` — Compiles GeneratedSchema into Mongoose Schema objects

**Error Codes:**
| Code | Meaning |
|------|---------|
| `SCHEMA_GENERATION_ERROR` | AI failed to generate a valid schema |
| `SCHEMA_COMPILATION_ERROR` | Failed to compile schema into Mongoose Schema |
| `DOCUMENT_PARSE_ERROR` | Failed to extract text from document |

**Usage Example:**

```typescript
@Injectable()
export class MyService {
  constructor(
    private readonly dynamicSchema: DynamicSchemaService,
  ) {}

  async processDocument(pdfBuffer: Buffer) {
    // Run full pipeline: extract → generate → compile
    const result = await this.dynamicSchema.fullPipeline(
      pdfBuffer,
      'pdf',
      'openai',
      0.3,
    );

    if (result.success) {
      console.log('Collection:', result.collectionName);
      console.log('Schema fields:', result.generatedSchema.fields);
    }
  }
}
\`\`\`

> **Related:** [Package Capability Matrix](#package-capability-matrix), [§7 Error Handling](#7-error-handling-patterns)

---

## 9. Creating New Modules

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

````

### Step 2: Define Schema

```typescript
@Schema({ timestamps: true })
export class MiEntidad {
  @Prop({ required: true })
  nombre: string;
}

export const MiEntidadSchema = SchemaFactory.createForClass(MiEntidad);
````

### Step 3: Create Repository, Service, Controller

### Step 4: Register in Module

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MiEntidad.name, schema: MiEntidadSchema },
    ]),
  ],
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

## 10. Extracting Packages

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

## 11. Troubleshooting

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

## 12. Deployment Checklist

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

## 13. Key Files

| File             | Purpose                  |
| ---------------- | ------------------------ |
| `BOILERPLATE.md` | Complete extension guide |
| `AGENTS.md`      | This file                |
| `nest-cli.json`  | Monorepo configuration   |
| `packages/*/`    | Reusable packages        |

---

## 14. Docker

```bash
# Build image
docker build -t boilerplate-service .

# Run with docker-compose
docker-compose up -d

# Test script
./docker-test.sh
```

**See:** `README.Docker.md` for complete Docker documentation
