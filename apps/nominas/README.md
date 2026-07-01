# Nominas App

Main NestJS application of the monorepo. Provides CRUD APIs and AI-powered document schema generation.

## Architecture

The AppModule imports both local modules and shared packages from `packages/`:

### Local Modules

| Module           | Purpose                                                     | Pattern                                             |
| ---------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `usuarios`       | Example CRUD — full REST endpoints for user management      | Pattern A: Flat (controller → service → repository) |
| `dynamic-schema` | AI pipeline: document → extract → generate schema → compile | Pattern B: Services/ (multi-service orchestration)  |

### Imported Packages

| Package              | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `@common/database`   | MongoDB connection with automatic retry and transaction support |
| `@common/inngest`    | Event-driven task queue for background jobs and scheduled tasks |
| `@common/playwright` | Headless browser automation for web scraping                    |
| `@common/ai`         | AI providers wrapper (OpenAI, Anthropic, Gemini, etc.)          |
| `@common/documents`  | PDF and DOCX text extraction                                    |
| `@common/auth`       | JWT authentication, Magic Links, 2FA, Passkeys                  |

> See [AGENTS.md §2](../../AGENTS.md#2-architecture--data-flow) for the full dependency graph.

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **MongoDB** 6.0+ running locally or a connection string to a remote instance
- **Inngest server** (optional — self-hosted or cloud) for background jobs
- **Playwright browsers** (optional) — run `npx playwright install chromium` if using scraping

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd nestJs-boilerplate
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, API keys

# 3. Start development server
npm run start:dev
```

> For interactive package selection, use the setup wizard: `./setup/setup.sh` (Linux/Mac) or `setup\setup.bat` (Windows).

## Environment Variables

All configuration is read from `.env` in the project root. See [AGENTS.md §4](../../AGENTS.md#4-development-setup) for the complete reference. Key variables:

| Variable              | Required | Description                   |
| --------------------- | -------- | ----------------------------- |
| `MONGODB_URI`         | Yes      | MongoDB connection string     |
| `JWT_SECRET`          | Yes      | Minimum 32-char random string |
| `RESEND_API_KEY`      | No       | Email sending (Resend API)    |
| `INNGEST_EVENT_KEY`   | No       | Background job queue          |
| `PLAYWRIGHT_HEADLESS` | No       | Default `true`                |

## API

- **Base URL:** `http://localhost:3000/api`
- **Swagger Docs:** `http://localhost:3000/api`
- **Health Check:** `GET /api/usuarios`

## Module Documentation

### Usuarios (`/api/usuarios`)

| Method   | Endpoint            | Description           | Status Codes |
| -------- | ------------------- | --------------------- | ------------ |
| `POST`   | `/api/usuarios`     | Create a new usuario  | `201`, `409` |
| `GET`    | `/api/usuarios`     | List all usuarios     | `200`        |
| `GET`    | `/api/usuarios/:id` | Get usuario by ID     | `200`, `404` |
| `PATCH`  | `/api/usuarios/:id` | Update usuario fields | `200`, `404` |
| `DELETE` | `/api/usuarios/:id` | Delete usuario        | `204`, `404` |

> Full CRUD with repository pattern. See `BOILERPLATE.md` §5 for the module creation template.

### Dynamic Schema (`/api/dynamic-schema`)

| Method | Endpoint                                  | Description                                 | Request Body                                    |
| ------ | ----------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| `POST` | `/api/dynamic-schema/extract`             | Extract text from PDF/DOCX                  | `{ document, format }`                          |
| `POST` | `/api/dynamic-schema/generate-from-text`  | Generate Mongoose schema from text          | `{ text, provider?, temperature? }`             |
| `POST` | `/api/dynamic-schema/generate-from-image` | Generate schema from image (base64)         | `{ imageData, provider?, temperature? }`        |
| `POST` | `/api/dynamic-schema/compile`             | Compile schema for MongoDB                  | `{ schema, collectionName }`                    |
| `POST` | `/api/dynamic-schema/pipeline`            | Full pipeline: extract → generate → compile | `{ document, format, provider?, temperature? }` |

### Auth

| Method         | Endpoint         | Description               |
| -------------- | ---------------- | ------------------------- |
| `POST`         | `/auth/register` | Register new user         |
| `POST`         | `/auth/login`    | Login with email/password |
| `POST`         | `/auth/refresh`  | Refresh access token      |
| `GET` / `POST` | `/api/inngest`   | Inngest function sync     |

> See [packages/auth/README.md](../../packages/auth/README.md) for 2FA, Passkeys, and Magic Link endpoints.

## Navigation

- [AGENTS.md](../../AGENTS.md) — Complete development guide: stack, conventions, package API reference, troubleshooting
- [BOILERPLATE.md](../../BOILERPLATE.md) — Extension guide and design patterns
- [packages/ai/README.md](../../packages/ai/README.md) — AI providers wrapper (OpenAI, Anthropic, Gemini)
- [packages/auth/README.md](../../packages/auth/README.md) — JWT, Magic Links, 2FA, Passkeys
- [packages/database/README.md](../../packages/database/README.md) — MongoDB connection and transactions
- [packages/documents/README.md](../../packages/documents/README.md) — PDF/DOCX text extraction
- [packages/http/README.md](../../packages/http/README.md) — HTTP client with image downloads
- [packages/playwright/README.md](../../packages/playwright/README.md) — Browser automation
- [packages/inngest/README.md](../../packages/inngest/README.md) — Event-driven task queue
- [packages/resend/README.md](../../packages/resend/README.md) — Email sending and newsletters
- [packages/serve-static/README.md](../../packages/serve-static/README.md) — EJS templates with TailwindCSS
