# nominas-app-readme Specification

## Purpose

Specifies what the `apps/nominas/README.md` documentation MUST teach an AI agent about the main application: its module composition, setup instructions, environment variables, available endpoints, and navigation for new developers.

## Requirements

### Requirement: Application Overview

The README MUST state that `apps/nominas/` is the main NestJS application, consuming shared packages from `@common/*`. It MUST list the app's imported modules from `app.module.ts`: `ConfigModule`, `DatabaseModule`, `InngestModule`, `PlaywrightModule`, `UsuariosModule`, `DynamicSchemaModule`.

#### Scenario: Agent discovers the application's module composition

- GIVEN an agent reads apps/nominas/README.md
- WHEN the agent needs to understand which capabilities the app exposes
- THEN the doc SHALL list all 6 imported modules with their `@common/*` or local paths
- AND SHALL describe each module in one sentence

### Requirement: Module Index with Descriptions

The README MUST include a table describing each local module under `apps/nominas/src/modules/`: `usuarios` (CRUD for user management) and `dynamic-schema` (AI-powered document-to-schema pipeline). Each entry MUST include the module's purpose and key endpoints or services.

#### Scenario: Agent navigates to module documentation

- GIVEN an agent reads the module index
- WHEN the agent needs detailed information about a specific module
- THEN the table SHALL list: module name, directory path, purpose, and key features
- AND SHALL cross-reference to the `@common/*` package documentation for shared modules

### Requirement: Setup Instructions

The README MUST document how to start the application: prerequisites (Node.js 20+, MongoDB), environment variables (`.env` file with `MONGODB_URI`, `PORT`, and required keys for `Inngest`, `Playwright`, `Resend`), install command (`npm install`), and start command (`npm run start:dev`).

#### Scenario: Agent sets up the application from scratch

- GIVEN an agent needs to run the nominas app in a new environment
- WHEN the agent follows the setup instructions
- THEN the doc SHALL list all prerequisite versions
- AND SHALL show the required `.env` variables or reference the root `.env.example`
- AND SHALL provide the exact `npm run start:dev` command

### Requirement: Swagger and Health Check

The README MUST document that Swagger docs are available at `/api` and the health check at `GET /api/usuarios`. It MUST mention the Swagger UI is auto-generated from NestJS decorators.

#### Scenario: Agent verifies the application is running

- GIVEN an agent starts the application
- WHEN the agent needs to verify the app is healthy
- THEN the doc SHALL reference `http://localhost:{PORT}/api/usuarios` as the health endpoint
- AND SHALL reference `http://localhost:{PORT}/api` for interactive API docs

### Requirement: Navigation Hooks

The README MUST include links to: root `AGENTS.md` (full development guide), root `BOILERPLATE.md` (extension guide), and relevant `@common/*` package READMEs for modules consumed by the app.

#### Scenario: Agent follows links to deeper documentation

- GIVEN an agent reads apps/nominas/README.md
- WHEN the agent needs broader project context
- THEN the doc SHALL provide clickable relative links to AGENTS.md, BOILERPLATE.md
- AND SHALL link to package READMEs for Database, AI, Inngest, and Playwright
