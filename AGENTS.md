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
| **Package Setup**    | `./setup/setup.sh` (Linux/Mac)        |
|                     | `setup\setup.bat` (Windows)            |

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

---

## 2. Using Shared Packages

Imports use `@common/*` paths:

```typescript
import { DatabaseModule } from '@common/database';
import { InngestModule } from '@common/inngest';
import { PlaywrightModule } from '@common/playwright';
import { ResendModule } from '@common/resend';
import { AuthModule, JwtAuthGuard, RolesGuard, Public, Roles } from '@common/auth';
import { ServeStaticModule, ServeStaticService } from '@common/serve-static';
import { AiModule, AiService } from '@common/ai';
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
await authService.hashPassword(password);  // Argon2
await authService.comparePassword(password, hash);  // Argon2

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
      'You are a helpful assistant'
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

## 9. Package Setup Wizard

The project includes an interactive setup wizard for selecting which packages to include.

### Quick Start

**Linux / macOS / Git Bash / WSL:**
```bash
chmod +x setup/setup.sh
./setup/setup.sh
```

**Windows (cmd.exe or PowerShell):**
```cmd
setup\setup.bat
```

### Setup Options

```bash
./setup/setup.sh --help   # Show help
./setup/setup.sh --list   # List available packages
./setup/setup.sh --reset  # Reset previous selection
```

### What It Does

1. **Package Selection**: Interactive CLI to choose packages
2. **Environment Variables**: Collects required env vars per package
3. **Configuration Updates**:
   - Updates `nest-cli.json` (includes only selected packages)
   - Updates `package.json` (adds required dependencies)
   - Creates `.env` file with all variables
4. **Preserves Selection**: Saves to `selection.json` for future runs

### Available Packages

| Package | Default | Description |
|---------|---------|-------------|
| `@common/ai` | Yes | AI providers wrapper |
| `@common/auth` | Yes | Authentication with JWT, 2FA, Passkeys |
| `@common/common` | Yes | Common utilities |
| `@common/database` | Yes | MongoDB with transactions |
| `@common/http` | Yes | HTTP client with sharp |
| `@common/inngest` | No | Event-driven task queue |
| `@common/playwright` | No | Browser automation |
| `@common/resend` | No | Email via Resend API |
| `@common/serve-static` | No | EJS templates with TailwindCSS |

### Configuration Files

| File | Purpose |
|------|---------|
| `setup/package-config.json` | Package definitions and metadata |
| `setup/selection.json` | Saved selection (auto-generated) |
| `setup/templates/.env.template` | Environment variables template |

### Next Steps After Setup

```bash
npm install        # Install selected dependencies
npm run build      # Build project
npm run start:dev  # Start development server
```

---

## 10. Troubleshooting

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

**Setup wizard permission denied (Linux):**

```bash
chmod +x setup/setup.sh
```

---

## 11. Deployment Checklist

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

## 12. Key Files

| File | Purpose |
|------|---------|
| `BOILERPLATE.md` | Complete extension guide |
| `AGENTS.md` | This file |
| `nest-cli.json` | Monorepo configuration |
| `packages/*/` | Reusable packages |
| `setup/` | Package setup wizard |

---

## 13. Docker

```bash
# Build image
docker build -t boilerplate-service .

# Run with docker-compose
docker-compose up -d

# Test script
./docker-test.sh
```

**See:** `README.Docker.md` for complete Docker documentation