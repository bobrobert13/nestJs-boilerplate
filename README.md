# NestJS Boilerplate

Monorepo NestJS 11 con MongoDB, Playwright y patrones extensibles para servicios backend.

## Quick Start

```bash
npm install
npm run build
npm run start:dev
```

API → http://localhost:3000/api · Swagger → http://localhost:3000/api

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `AGENTS.md` | Índice maestro para agentes IA + reglas de trabajo |
| `DOCUMENTATION-CONVENTION.md` | Convención de documentación IA-friendly |
| `README.Docker.md` | Despliegue con Docker |

| `apps/nominas/PATTERNS.md` | Patrones de diseño para módulos de negocio |
| `apps/nominas/CONTRIBUTING.md` | Cómo crear un nuevo módulo |
| `packages/*/README.md` | Documentación individual por paquete |

> `BOILERPLATE.md` fue consolidado en `AGENTS.md` + docs de `apps/nominas/` durante el change `documentation-llm-readiness-audit`.

## Paquetes (`packages/`)

| Package | Propósito |
|---------|-----------|
| `@common/database` | MongoDB + transacciones |
| `@common/auth` | JWT, 2FA, Passkeys, Magic Link |
| `@common/ai` | Wrapper multi-provider (OpenAI, Anthropic, Gemini, etc.) |
| `@common/playwright` | Automatización de navegador |
| `@common/resend` | Emails + Newsletter |
| `@common/documents` | Extracción PDF/DOCX |
| `@common/http` | Cliente HTTP + descarga de imágenes |
| `@common/common` | Utilidades compartidas |
| `@common/serve-static` | Templates EJS + TailwindCSS |

## Stack

- **Framework:** NestJS 11 + TypeScript 5.7
- **Base de datos:** MongoDB 7.0 + Mongoose 9 (ReplicaSet para transacciones)
- **Auth:** JWT, Argon2, 2FA/TOTP, Passkeys/WebAuthn, Magic Links
- **AI:** OpenAI, Anthropic, Google Gemini, Moonshot, MiniMax
- **Browser automation:** Playwright 1.59
- **Deployment:** Docker multi-stage (Node 22 slim)
