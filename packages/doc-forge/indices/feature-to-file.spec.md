# Feature-to-File Index Specification

> **Index Mode:** `feature-to-file`
> **Apply When:** Large monorepo, legacy codebase, multi-module projects with 5+ feature areas.
> **Output:** A lookup table in AGENTS.md that maps user questions to exact file paths.

---

## What It Is

A three-column table that answers the question: "The user asked about X — which files should I read?" Every row maps a feature keyword to the minimum set of files needed to understand it, plus optional secondary files for deeper context.

This is optimized for **LLM context budgets** — an agent can read only 2-4 files instead of loading an entire 1000+ line AGENTS.md or project tree.

## Table Format

```
| If the user asks about... | Read these files | May also need |
|---|---|---|
| {{FEATURE_KEYWORD_1}} | {{PRIMARY_FILES}} | {{SECONDARY_FILES}} |
| {{FEATURE_KEYWORD_2}} | {{PRIMARY_FILES}} | {{SECONDARY_FILES}} |
...
{{FEATURE_ROWS}}
```

## Context Budget Rule

> **Rule:** For focused changes, read ONLY the files listed under "Read these files" + their DTOs/interfaces. Do NOT load the full AGENTS.md unless the task spans 3+ feature areas. Use this index as a surgical lookup table.

This rule MUST appear directly above the table so the LLM sees it before scrolling into rows.

## When to Use

| Condition                          | Decision                                    |
| ---------------------------------- | ------------------------------------------- |
| Monorepo with 5+ packages/apps     | Include feature-to-file index               |
| Single app with 10+ modules        | Include feature-to-file index               |
| Library with 20+ public exports    | Use capability matrix instead               |
| CLI tool with 5 commands           | Not needed — linear README suffices         |
| Codebase under 200 files total     | Not needed — full AGENTS.md fits in context |
| Frequently asks AI agents for help | Include regardless of size                  |

## How the LLM Generates It

### Step 1: Scan Module Directories

Walk `{{SRC_DIR}}` (detected in Phase 0 hydration). For each directory that contains a service/controller/module file, extract:

- **Directory name** → base keyword
- **Service file** → primary entry point
- **Associated files** (controller, repository, DTOs, interfaces, config) → secondary files

### Step 2: Map Keywords to Files

For each feature area, identify what a user would say to trigger it:

| User says...                                      | Maps to directory | Primary files                             |
| ------------------------------------------------- | ----------------- | ----------------------------------------- |
| Keywords in `{{LANGUAGE}}` and `{{LANGUAGE_ALT}}` | `{{DIRECTORY}}`   | `{{SERVICE_FILE}}`, `{{CONTROLLER_FILE}}` |

### Step 3: Detect Cross-Package Features

Some features span multiple directories. Connect them:

- Parent module → sub-module files
- Pipeline features → files at each pipeline stage
- Shared utilities → referenced packages

### Step 4: Build the Table

Sort rows by likelihood of being asked (auth/top-level features first, utilities last). Fill:

1. **"If the user asks about..."**: Keywords in the project's natural language(s). Include synonyms and the user's native language terms.
2. **"Read these files"**: Paths relative to workspace root. Primary entry points only — the service, the controller, the strategy.
3. **"May also need"**: Secondary support files — DTOs, interfaces, config, schemas.

### Step 5: Add Context Budget Rule

Prepend the context budget rule from the template above, then the table.

## Adding New Rows

When a new module or feature is added to the project, append a row to the table. Follow the existing keyword conventions (language, synonyms). If the new module creates a cross-cutting concern with an existing module, add a row to the cross-cutting table instead.

## Template

```markdown
## Feature-to-File Index

> **Context budget rule:** For focused changes, read ONLY the files listed below + their DTOs/interfaces.
> Do NOT load the full AGENTS.md unless the task spans 3+ feature areas.
> Use this index as a surgical lookup table.

| If the user asks about... | Read these files | May also need |
| ------------------------- | ---------------- | ------------- |

{{FEATURE_ROWS}}
```

## Real Example from nestJs-boilerplate

From `AGENTS.md` of a NestJS 11 monorepo with 10 packages, MongoDB, Inngest, Playwright. TypeScript, npm, GitHub Actions.

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

**Key observations from this example:**

1. **Language mixing**: Keywords use both English and Spanish (`Login / registro / JWT`, `Envío de emails`) because the team is Spanish-speaking. The index uses the team's natural vocabulary.
2. **Granular sub-features**: Auth is split into 4 rows (login, magic links, 2FA, passkeys) — a single "Auth" row would force the LLM to read too many files.
3. **Pipeline awareness**: `Generar schema desde doc/imagen` maps to the dynamic-schema service which orchestrates AI + documents — the LLM knows it's a multi-step feature.
4. **Documentation references**: The last row references AGENTS.md sections directly, not code files — the index can point to docs for meta-questions.
5. **Paths are relative to workspace root**: All paths start from `packages/`, `apps/`, or the doc name — consistent so the LLM can resolve them from any working directory.
