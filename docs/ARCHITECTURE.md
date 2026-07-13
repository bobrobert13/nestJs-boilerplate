# Architecture & Stack

> Stack, architecture view, deployment view, and package dependency layers for the NestJS boilerplate service.

---

## Application Architecture

```mermaid
graph TB
    subgraph "Application"
        NOMINAS["apps/nominas<br/>Main Application"]
        USUARIOS["usuarios Module<br/>Example CRUD"]
        DYNAMIC["dynamic-schema Module<br/>AI Schema Generator"]
    end

    subgraph "Core Packages"
        DB["@common/database<br/>MongoDB + Transactions"]
        COMMON["@common/common<br/>Utilities + Filters"]
        AUTH["@common/auth<br/>JWT · 2FA · Passkeys · Magic Link"]
    end

    subgraph "Integration Packages"
        AI["@common/ai<br/>Multi-Provider AI"]
        PW["@common/playwright<br/>Browser Automation"]
        INNGEST["@common/inngest<br/>Task Queue"]
        HTTP["@common/http<br/>HTTP Client"]
        DOCS["@common/documents<br/>PDF/DOCX Extraction"]
        RESEND["@common/resend<br/>Email + Newsletter"]
        SS["@common/serve-static<br/>EJS + TailwindCSS"]
    end

    NOMINAS --> AUTH
    NOMINAS --> DB
    NOMINAS --> INNGEST
    NOMINAS --> PW
    NOMINAS --> AI
    NOMINAS --> DOCS
    NOMINAS --> RESEND
    NOMINAS --> SS
    USUARIOS --> DB
    DYNAMIC --> AI
    DYNAMIC --> DOCS
    AUTH --> DB
    RESEND --> RESEND_SVC["Resend API<br/>(external)"]
    INNGEST --> INNGEST_SVC["Inngest Server<br/>(self-hosted)"]
    PW --> CHROMIUM["Chromium<br/>(Docker)"]
    AI --> LLM_API["OpenAI · Anthropic ·<br/>Gemini · Moonshot · MiniMax"]
```

---

## Docker Deployment

```mermaid
graph LR
    subgraph "Docker (internal)"
        DOCKER_COMPOSE["docker-compose.yml"]
        MONGODB["MongoDB 7.0<br/>ReplicaSet: rs0"]
        SERVICE["boilerplate-service<br/>Node 22 slim"]
    end

    subgraph "External Services"
        RESEND_API["Resend API"]
        AI_PROVIDERS["AI Providers<br/>OpenAI · Anthropic · Gemini"]
    end

    DOCKER_COMPOSE --> MONGODB
    DOCKER_COMPOSE --> SERVICE
    MONGODB --> VOLUME["mongodb_data<br/>(persistent volume)"]
    SERVICE --> MONGODB
    SERVICE --> RESEND_API
    SERVICE --> AI_PROVIDERS
    SERVICE --> |healthcheck| HEALTH["GET /api/usuarios"]
    SERVICE --> |swagger| SWAGGER["GET /api"]
```

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11.x | Framework |
| TypeScript | 5.7.x | Lenguaje |
| MongoDB | 7.0 | Base de datos (ReplicaSet) |
| Mongoose | 9.x | ODM |
| Inngest | 4.x | Task queue |
| Playwright | 1.59.x | Browser automation |
| Swagger | 11.3.x | API docs |
| Docker | — | Node 22.18.0-slim |
| Argon2 | 0.31.x | Password hashing |

---

## Package Dependency Layers

```mermaid
graph LR
    subgraph "Layer 0 — Infra"
        COMMON["@common/common"]
    end
    subgraph "Layer 1 — Data"
        DB["@common/database"] --> COMMON
    end
    subgraph "Layer 2 — Business"
        AUTH["@common/auth"] --> DB
        RESEND["@common/resend"]
        INNGEST["@common/inngest"]
    end
    subgraph "Layer 3 — Integration"
        AI["@common/ai"]
        PW["@common/playwright"]
        HTTP["@common/http"]
        DOCS["@common/documents"]
        SS["@common/serve-static"]
    end
```
