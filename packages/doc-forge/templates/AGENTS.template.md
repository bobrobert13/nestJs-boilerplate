<!-- Template: doc-forge/templates/AGENTS.template.md -->
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

# AGENTS.md — {{PROJECT_NAME}}

> **Purpose:** Technical reference for AI agents and developers working on this project.
> {{DESCRIPTION_LINE}}

> **Note for LLM generating this:** This is the MOST important doc-forge output. It must be machine-navigable
> and self-contained for AI agents with limited context. Every placeholder must be replaced with detected values
> from Phase 0 hydration. Do NOT generate sections that don't apply — the notes below each section tell you
> when to include or omit them.

---

## Quick Reference

| Task | Command |
| ---- | ------- |

{{QUICK_REFERENCE_ROWS}}

---

## Feature-to-File Index

> **Note for LLM:** Include this section for projects with 5+ source files. Use `indices/feature-to-file.spec.md`
> for formatting rules. Omit for single-file or trivially small projects.

> **Context budget rule:** For focused changes, read ONLY the files listed below + their DTOs/interfaces.
> Do NOT load the full AGENTS.md unless the task spans 3+ feature areas.

| If the user asks about... | Read these files | May also need |
| ------------------------- | ---------------- | ------------- |

{{FEATURE_ROWS}}

{{CROSS_CUTTING_TABLE}}

### Cross-Cutting Concerns

> **Note for LLM:** Include this subsection only for monorepos or projects with interdependent services.
> Use `indices/cross-cutting.spec.md` for the detection logic. Omit if the project has clean module boundaries.

When the user's request touches multiple features, ask before expanding scope:

| If the request touches... | Also check... | Why |
| ------------------------- | ------------- | --- |

{{CROSS_CUTTING_ROWS}}

> **Rule:** If the user asks for a change in any of the "If the request touches..." columns, STOP and ask:
> "This change could affect [related area]. Should I include that in scope?"

---

## Package Capability Matrix

> **Note for LLM:** Include this section for monorepos or when packages are extractable and reused across apps.
> Use `indices/capability-matrix.spec.md` for formatting. Omit for single-app, single-package projects.

| Package | Import Path | Key Exports | Documented |
| ------- | ----------- | ----------- | ---------- |

{{PACKAGE_ROWS}}

> **Tip:** Use Ctrl+F with the import path to jump directly to the package's API reference in the relevant section.

---

## 1. Project Overview

**Architecture:** {{ARCHITECTURE_DESCRIPTION}}
**Language:** {{LANGUAGE}}
**Framework:** {{FRAMEWORK}}
**Database:** {{DATABASE_DETAILS}}
**API Docs:** {{API_DOCS_DETAILS}}
{{EXTRA_OVERVIEW_LINES}}

### Structure

```
{{PROJECT_TREE}}
```

---

## 2. Architecture & Data Flow

### Dependency Graph

```
{{DEPENDENCY_GRAPH}}
```

### Standalone Packages

> **Note for LLM:** Include this subsection only for monorepos where some packages have zero internal
> dependencies. List only packages that can be extracted independently.

{{STANDALONE_PACKAGES_LIST}}

> **Related:** [Package Capability Matrix](#package-capability-matrix), [§8 External Services](#8-external-services)

---

## 3. Using Shared Packages

> **Note for LLM:** Rename this section to "Module Imports" or "Library Imports" for non-monorepo projects.
> Omit entirely for single-module projects.

Imports use `{{IMPORT_PREFIX}}` paths:

```{{LANGUAGE}}
{{IMPORT_EXAMPLES}}
```

---

## 4. Development Setup

### Environment Variables (.env)

```env
{{ENV_VAR_EXAMPLE}}
```

### Prerequisites

{{PREREQUISITES_LIST}}

---

## 5. Commands Reference

### Build & Run

```bash
{{BUILD_AND_RUN_COMMANDS}}
```

### Testing

```bash
{{TESTING_COMMANDS}}
```

### Code Quality

```bash
{{CODE_QUALITY_COMMANDS}}
```

---

## 6. Code Style Guidelines

### Imports Order

```{{LANGUAGE}}
{{IMPORTS_ORDER_EXAMPLE}}
```

### Naming Conventions

| Element | Convention | Example |
| ------- | ---------- | ------- |

{{NAMING_ROWS}}

### Dependency Injection

```{{LANGUAGE}}
{{DI_EXAMPLE}}
```

### Module Organization

```{{LANGUAGE}}
{{MODULE_ORGANIZATION_EXAMPLE}}
```

---

### Module Patterns

> **Note for LLM:** Include this section for projects with 3+ modules that follow distinct directory
> patterns. Omit for trivially small codebases.

The project uses {{PATTERN_COUNT}} module directory structures:

**Pattern A: {{PATTERN_A_NAME}}** — Use for {{PATTERN_A_USE_CASE}}:

```
{{PATTERN_A_TREE}}
```

**Pattern B: {{PATTERN_B_NAME}}** — Use for {{PATTERN_B_USE_CASE}}:

```
{{PATTERN_B_TREE}}
```

> **Related:** [§7 Error Handling Patterns](#7-error-handling-patterns), [§9 Creating New Modules](#9-creating-new-modules)

---

## 7. Error Handling Patterns

> **Note for LLM:** Include this section when the project uses multiple error-handling strategies
> (e.g., some components throw, others return result objects). Use `indices/error-handling.spec.md`
> for detection logic. Omit for projects with a single unified error approach.

Each package/component uses a different error strategy. Know which to catch.

| Component | Strategy | Check Pattern | Throw Pattern |
| --------- | -------- | ------------- | ------------- |

{{ERROR_ROWS}}

> **Rule of thumb:** If the component returns `{ success: boolean }`, check it. If it throws, `try/catch` it.

> **Related:** [§2 Architecture](#2-architecture--data-flow), [§8 External Services](#8-external-services)

---

## 8. External Services

> **Note for LLM:** One subsection per external service or package. Include only services that actually
> exist in the project. Each subsection should document: basic usage code example, key method signatures,
> configuration/env vars table, and any gotchas.

{{SERVICE_SECTIONS}}

---

## 9. Creating New Modules

> **Note for LLM:** Include this for any project organized into modules or components. Replace "Module"
> with the framework-appropriate term (Component, Plugin, Extension, Blueprint, etc.).

### Step 1: Create structure

```
{{NEW_MODULE_TREE}}
```

### Step 2: Define {{SCHEMA_OR_ENTITY_TERM}}

```{{LANGUAGE}}
{{ENTITY_DEFINITION_EXAMPLE}}
```

### Step 3: Create Repository, Service, Controller

### Step 4: Register in Module

```{{LANGUAGE}}
{{MODULE_REGISTRATION_EXAMPLE}}
```

### Step 5: Import in AppModule

```{{LANGUAGE}}
{{APP_MODULE_IMPORT_EXAMPLE}}
```

---

## 10. Extracting Packages

> **Note for LLM:** Include this section only for monorepos where packages are designed to be
> independently extractable. Omit for single-app projects.

Packages in `{{PACKAGES_DIR}}` are **self-contained and reusable**.

### To extract to another project:

1. Copy package folder (e.g., `{{EXAMPLE_PACKAGE_PATH}}`)
2. Configure `{{CONFIG_FILE}}`:

```json
{{CONFIG_PATH_MAPPING_EXAMPLE}}
```

3. Install dependencies:

```bash
{{PACKAGE_INSTALL_COMMAND}}
```

4. Import in your AppModule:

```{{LANGUAGE}}
{{PACKAGE_IMPORT_EXAMPLE}}
```

---

## 11. Troubleshooting

{{TROUBLESHOOTING_ENTRIES}}

---

## 12. Deployment Checklist

{{DEPLOYMENT_CHECKLIST_ITEMS}}

---

## 13. Key Files

| File | Purpose |
| ---- | ------- |

{{KEY_FILES_ROWS}}

---

## Example

> Rendered for the `nestJs-boilerplate` project — NestJS 11 monorepo with 10 packages, TypeScript, MongoDB.

- **Status:** `<!-- api-nominas — status: Validated 8.5/10 -->`
- **Quick Reference:** Dev server (`npm run start:dev`), Build (`npm run build`), Lint (`npm run lint`), Test (`npm run test`), Test E2E (`npm run test:e2e`), Format (`npm run format`)
- **Feature-to-File Index:** 16 feature rows covering auth (login/JWT, magic links, 2FA, passkeys), database (MongoDB, transactions), email (Resend, newsletter), AI (ChatGPT, embeddings, schema generation), documents (PDF/DOCX extraction), HTTP (requests, downloads), web scraping (Playwright), background tasks (Inngest), CRUD (usuarios), templates (EJS), error handling, and new module creation
- **Cross-Cutting Concerns:** 8 rows — Auth touches resend/2FA/passkeys, Database transactions touches usuarios, AI touches documents/dynamic-schema, HTTP touches playwright, Emails touches resend, Templates touches serve-static
- **Package Capability Matrix:** 12 rows — @common/ai, @common/auth, @common/common, @common/database, @common/documents, @common/http, @common/inngest, @common/playwright, @common/resend, @common/serve-static, dynamic-schema, usuarios
- **Project Overview:** NestJS 11 monorepo with TypeScript, MongoDB via Mongoose, Inngest (self-hosted), Playwright, Swagger at `/api`
- **Architecture & Data Flow:** Dependency graph showing apps/nominas depending on @common/database, @common/inngest, @common/playwright, usuarios, dynamic-schema, with dynamic-schema depending on @common/ai and @common/documents. @common/auth contains two-factor/ and passkeys/ sub-modules. @common/resend contains newsletter/. Standalone packages: @common/ai, @common/common, @common/http, @common/serve-static
- **Module Patterns:** Two patterns — Pattern A: Flat (single-service CRUD like usuarios/), Pattern B: Services/ (multi-service pipeline like dynamic-schema/services/)
- **Error Handling Patterns:** 6 rows — @common/ai returns `{ success: boolean }`, @common/documents throws JSON-encoded error codes, @common/http throws OOP HttpError hierarchy, @common/database throws native exceptions with retry, @common/auth throws NestJS HTTP exceptions, dynamic-schema returns error code strings
- **External Services:** Full documentation for @common/database (with TransactionService, @Transaction decorator, TransactionManager, TransactionalWrapper), @common/http (HttpService, DownloadService, HttpError hierarchy), @common/inngest, @common/playwright, @common/resend (with newsletter), @common/auth (with JWT, Magic Links, Argon2, 2FA, Passkeys), @common/serve-static (EJS + TailwindCSS), @common/ai (OpenAI, Anthropic, Google, Moonshot, MiniMax providers), @common/dynamic-schema (AI-powered Mongoose schema pipeline)
- **Creating New Modules:** 5-step guide with Mongoose schema definition, repository, service, controller, and module registration
- **Deployment Checklist:** 8 checkbox items covering env vars, MongoDB, Inngest keys, build, lint, tests, Swagger, health check, Docker
- **Troubleshooting:** Port conflicts (`netstat -ano | findstr :3000`), MongoDB connection (`mongosh --eval`), Playwright browsers (`npx playwright install`), Setup wizard permissions (`chmod +x setup/setup.sh`)
