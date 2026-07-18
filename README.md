<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<h1 align="center">⚡ NestJS Super-Boilerplate</h1>
<p align="center">
  <em>The ultimate production-ready NestJS monorepo — batteries included.</em>
</p>

<p align="center">
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen?logo=node.js" alt="Node"></a>
  <a href="https://www.npmjs.com"><img src="https://img.shields.io/badge/npm-%3E%3D10-blue?logo=npm" alt="npm"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript" alt="TypeScript"></a>
  <a href="https://nestjs.com"><img src="https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs" alt="NestJS"></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/MongoDB-7.0-47a248?logo=mongodb" alt="MongoDB"></a>
  <a href="https://playwright.dev"><img src="https://img.shields.io/badge/Playwright-1.59-45ba4b?logo=playwright" alt="Playwright"></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-ready-2496ed?logo=docker" alt="Docker"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-whats-inside">What's Inside</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-packages">Packages</a> ·
  <a href="#-modules">Modules</a> ·
  <a href="#-documentation">Docs</a>
</p>

---

## ✨ Why This Boilerplate?

Most NestJS starters give you a skeleton. This one gives you a **fully-armed starship**.

| Capability | Status |
|------------|--------|
| 🔐 **Authentication** — JWT · Magic Links · 2FA/TOTP · Passkeys/WebAuthn · Argon2 | ✅ Production |
| 🧠 **AI-Ready** — OpenAI · Anthropic · Gemini · Moonshot · MiniMax · Dynamic Schema Generation | ✅ Production |
| 🌐 **Browser Automation** — Playwright with Chromium · Headless/Headful · Retries | ✅ Production |
| 📧 **Email & Newsletters** — Resend API · Templates · Subscriber Management | ✅ Production |
| 📄 **Document Extraction** — PDF · DOCX · Extensible Parser Interface | ✅ Production |
| 🗄️ **MongoDB** — Mongoose 9 · ReplicaSet · Transactions · Retry Logic | ✅ Production |
| 🐳 **Docker** — Multi-stage builds · Healthchecks · Non-root user | ✅ Production |
| 📝 **OpenAPI/Swagger** — Auto-generated docs on every controller | ✅ Built-in |
| 🧪 **Testing** — Jest · 27 spec files · TDD-ready patterns | ✅ Built-in |
| 🤖 **AI-Agent Friendly** — AGENTS.md · LLM Readiness Score · OpenSpec SDD · .llm-context | ✅ Unique |
| 📋 **Spec-Driven Development** — OpenSpec workflow for every change | ✅ Unique |
| 🎨 **Templating** — EJS layouts · TailwindCSS CDN · 60s cache | ✅ Production |
| 📦 **9 Reusable Packages** — Modular, tree-shakable, independently documented | ✅ Modular |

> **No more stitching libraries together.** Clone, configure `.env`, and start building.

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/bobrobert13/nestJs-boilerplate.git
cd nestJs-boilerplate
npm install

# 2. Configure your environment
cp .env.example .env   # edit with your keys

# 3. Run!
npm run start:dev
```

| What | Where |
|------|-------|
| 🚀 **API** | `http://localhost:3000/api` |
| 📝 **Swagger** | `http://localhost:3000/api` |
| ❤️ **Health Check** | `http://localhost:3000/api/health` |

```bash
# Docker — Zero-config deploy
docker-compose up -d

# Tests
npm run test              # unit tests (27 spec files)
npm run test:cov          # coverage report
npm run test:e2e          # end-to-end
```

---

## 🧱 What's Inside

```
nestJs-boilerplate/
│
├── apps/nominas/                  ← Main application
│   ├── src/modules/
│   │   ├── usuarios/              ← Example CRUD (MongoDB)
│   │   ├── dynamic-schema/        ← AI-powered schema generator
│   │   ├── scraper/               ← Web scraping engine
│   │   └── health/                ← Health check endpoint
│   ├── PATTERNS.md                ← Design patterns for business modules
│   └── CONTRIBUTING.md            ← How to create a new module
│
├── packages/                      ← 9 reusable packages
│   ├── auth/                      ← @common/auth — JWT · 2FA · Passkeys
│   ├── database/                  ← @common/database — MongoDB + Transactions
│   ├── ai/                        ← @common/ai — Multi-provider AI wrapper
│   ├── playwright/                ← @common/playwright — Browser automation
│   ├── resend/                    ← @common/resend — Email + Newsletter
│   ├── documents/                 ← @common/documents — PDF/DOCX extraction
│   ├── http/                      ← @common/http — HTTP client + image download
│   ├── common/                    ← @common/common — Utilities + Filters
│   └── serve-static/              ← @common/serve-static — EJS + TailwindCSS
│
├── openspec/                      ← Spec-Driven Development
│   ├── specs/                     ← Source of truth (per domain)
│   └── changes/                   ← Active changes + archive
│
├── AGENTS.md                      ← Master index for AI agents & developers
├── DOCUMENTATION-CONVENTION.md    ← AI-friendly documentation convention
├── README.Docker.md               ← Complete Docker guide
├── docker-compose.yml
└── Dockerfile
```

---

## 🏗 Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        APP["apps/nominas<br/>Main Application"]
        USUARIOS["usuarios<br/>Example CRUD"]
        DS["dynamic-schema<br/>AI Schema Generator"]
        SCRAPER["scraper<br/>Web Scraping"]
        HEALTH["health<br/>Health Checks"]
    end

    subgraph "Core Packages"
        DB["@common/database<br/>MongoDB + Transactions"]
        AUTH["@common/auth<br/>JWT · 2FA · Passkeys · Magic Link"]
        COMMON["@common/common<br/>Utilities + Filters"]
    end

    subgraph "Integration Packages"
        AI["@common/ai<br/>OpenAI · Anthropic · Gemini"]
        PW["@common/playwright<br/>Browser Automation"]
        HTTP["@common/http<br/>HTTP Client"]
        DOCS["@common/documents<br/>PDF/DOCX Extraction"]
        RESEND["@common/resend<br/>Email + Newsletter"]
        SS["@common/serve-static<br/>EJS + TailwindCSS"]
    end

    APP --> AUTH
    APP --> DB
    APP --> PW
    APP --> AI
    APP --> DOCS
    APP --> RESEND

---

## 📦 Packages

> Each package is independently documented with its own `README.md`, OpenSpec spec, and JSDoc annotations.

| Package | Status | Description |
|---------|--------|-------------|
| `@common/auth` | 🟢 Production | JWT · Magic Links · 2FA/TOTP · Passkeys/WebAuthn · Role-based guards · Refresh token persistence |
| `@common/database` | 🟢 Production | MongoDB with Mongoose 9 · Transactions with retry · `@Transactional` decorator · Connection pooling |
| `@common/ai` | 🟡 Adequate | Multi-provider AI: OpenAI · Anthropic · Gemini · Moonshot · MiniMax · Chat · Embeddings · Streaming |
| `@common/playwright` | 🟢 Production | Chromium automation · Headless/headful · Configurable timeouts · Retry logic |
| `@common/resend` | 🟢 Production | Email sending · Templates · Newsletter with subscriber management · Swagger docs |
| `@common/documents` | 🟡 Adequate | PDF extraction · DOCX parsing · Extensible parser interface |
| `@common/http` | 🟡 Adequate | Axios-based HTTP client · Image download with Sharp optimization |
| `@common/common` | 🟡 Adequate | BaseAdapter interface · DatabaseExceptionFilter · BootstrapLogger · HttpError · ThrottlerGuard |
| `@common/serve-static` | 🟡 Adequate | EJS templates · Layouts & Partials · TailwindCSS CDN · 60-second cache |

> 🟢 Production (≥75% LLM Readiness Score) · 🟡 Adequate (50–74%)

---

## 🧩 Application Modules

| Module | Routes | Description |
|--------|--------|-------------|
| **usuarios** | `POST/GET/PATCH/DELETE /api/usuarios` | Full CRUD with MongoDB · Repository pattern · DTO validation |
| **dynamic-schema** | `POST/GET /api/dynamic-schema` | AI-generated Mongoose schemas · Multi-provider LLM · Persistence |
| **scraper** | `POST/GET /api/scraper` | Web scraping engine · Configurable sites · Strategy pattern |
| **health** | `GET /api/health` | Health check · MongoDB connectivity · Feature status |

---

## 🔐 Authentication Deep Dive

```
┌─────────────────────────────────────────────────────────┐
│                  Authentication Methods                   │
├──────────────┬──────────────┬──────────────┬─────────────┤
│     JWT      │  Magic Link  │  2FA / TOTP  │  Passkeys   │
│  Access +    │  Password-   │  QR Code     │  WebAuthn   │
│  Refresh     │  less email  │  Setup +     │  FIDO2      │
│  Tokens      │  login       │  Verification│  Biometric  │
├──────────────┴──────────────┴──────────────┴─────────────┤
│                   Global Guards                           │
│  JwtAuthGuard → RolesGuard → ThrottlerGuard (20 req/60s) │
└─────────────────────────────────────────────────────────┘
```

- **Argon2** password hashing (NOT bcrypt)
- **Refresh tokens** persist in MongoDB — survive server restarts
- **`@Public()`** decorator to bypass auth on specific routes
- **`@Roles('admin')`** decorator for role-based access
- **Global rate limiting** — 20 requests per 60 seconds per IP

---

## 🤖 AI-Agent Friendly (Unique Feature)

This boilerplate is **purpose-built for AI-assisted development**:

| Artifact | Purpose |
|----------|---------|
| `AGENTS.md` | Master index for LLMs — architecture, commands, conventions, decision tree |
| `DOCUMENTATION-CONVENTION.md` | How to write docs that LLMs understand |
| **LLM Readiness Score** | Quantitative 0–100% score per package (Spec · README · JSDoc · Tests · Swagger · Cross-Refs) |
| **OpenSpec SDD** | Spec-Driven Development — every change has `proposal → specs → design → tasks → verify → archive` |
| `.llm-context.md` | Auto-generated per module via `npm run docs:context` |
| `npm run audit:docs` | JSDoc coverage audit |

### LLM Readiness Score Heatmap

```
                   Spec  README  JSDoc  Tests  Swagger  Cross-Ref

---

## ⚙️ Configuration

All configuration is environment-variable driven. See `.env.example`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/boilerplate_db?replicaSet=rs0

# Auth
JWT_SECRET=your-secret-here-min-32-chars
JWT_ACCESS_TOKEN_TTL=900
JWT_REFRESH_TOKEN_TTL=604800

# Email (optional)
RESEND_API_KEY=re_xxxxxxxx

# AI Providers (optional — pick one or more)
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GEMINI_API_KEY=xxxxx

# Playwright
PLAYWRIGHT_HEADLESS=true
```

> Full reference in [`AGENTS.md` §6](./AGENTS.md#6-configuración)

---

## 📚 Documentation

| Document | Audience |
|----------|----------|
| [`AGENTS.md`](./AGENTS.md) | AI Agents & Developers — master index |
| [`DOCUMENTATION-CONVENTION.md`](./DOCUMENTATION-CONVENTION.md) | Contributors — how to write docs |
| [`README.Docker.md`](./README.Docker.md) | DevOps — Docker deployment |
| [`apps/nominas/PATTERNS.md`](./apps/nominas/PATTERNS.md) | Developers — design patterns |
| [`apps/nominas/CONTRIBUTING.md`](./apps/nominas/CONTRIBUTING.md) | Contributors — how to add modules |
| [`openspec/specs/*/spec.md`](./openspec/specs/) | Developers — domain contracts |
| [`packages/*/README.md`](./packages/) | Developers — package-specific docs |

---

## 🧪 Testing

```
$ npm run test

Test Suites: 27 passed
Tests:       XXX passed
```

```bash
npm run test              # All unit tests
npm run test -- path/to/file.spec.ts  # Single file
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # End-to-end
```

---

## 🐳 Docker

```bash
# Production
docker compose up -d

# Development (hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# End-to-end test harness (build + up + health-check + cleanup)
./docker-test.sh             # cross-platform (any bash + docker compose)
./docker-test-ubuntu.sh      # Ubuntu: apt-installs docker + compose plugin if missing
```

| Service | Image | Port |
|---------|-------|------|
| **boilerplate-service** | Node 22-slim | `3000` |
| **mongodb** | MongoDB 7.0 (ReplicaSet `rs0`) | `27017` |

> See [`README.Docker.md`](./README.Docker.md) for complete guide.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js ≥22 |
| **Framework** | NestJS 11 |
| **Language** | TypeScript 5.7 |
| **Database** | MongoDB 7.0 · Mongoose 9 (ReplicaSet) |
| **Auth** | JWT · Argon2 · Passport · otplib · @simplewebauthn |
| **AI** | OpenAI · Anthropic · Gemini · Moonshot · MiniMax |
| **Browser** | Playwright 1.59 · Chromium |
| **Email** | Resend |
| **Docs** | Swagger/OpenAPI 11 · @nestjs/swagger |
| **Validation** | class-validator · class-transformer |
| **Templating** | EJS · TailwindCSS CDN |
| **Container** | Docker · docker-compose |
| **Testing** | Jest 30 · Supertest |
| **Linting** | ESLint 9 · Prettier |

---

## 🧭 OpenSpec — Spec-Driven Development

Every significant change follows a structured workflow:

```
/sdd-new change-name        → proposal → specs → design → tasks
/sdd-continue change-name    → implement next phase
/sdd-verify change-name      → validate against specs
/sdd-archive change-name     → merge deltas + archive
```

```
openspec/
├── specs/                   ← Source of truth
│   ├── auth/spec.md
│   ├── ai/spec.md
│   ├── database/spec.md
│   └── ...
├── changes/                 ← Active changes
│   └── {change-name}/
│       ├── proposal.md
│       ├── specs/
│       ├── design.md
│       ├── tasks.md
│       └── verify-report.md
└── changes/archive/         ← Completed changes
```

---

## 🤝 Contributing

1. Read [`CONTRIBUTING.md`](./apps/nominas/CONTRIBUTING.md)
2. Follow the patterns in [`PATTERNS.md`](./apps/nominas/PATTERNS.md)
3. Run `npm run build && npm run lint && npm run test` before committing
4. Use OpenSpec for significant changes (`/sdd-new`)
5. Commit: `feat(@common/name): description` or `fix(@common/name): description`

---

## 📄 License

MIT © [bobrobert13](https://github.com/bobrobert13)

---

<p align="center">
  <sub>Built with ❤️ for developers who want to ship fast — and for AI agents who want to help.</sub>
</p>
