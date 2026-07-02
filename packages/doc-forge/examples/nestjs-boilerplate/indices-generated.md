# Indices Generated — All 4 Index Modes Applied to nestJs-boilerplate

> **Project:** nestJs-boilerplate | **Source:** `AGENTS.md` (1392 lines)
> **What this shows:** The 4 index strategies from `packages/doc-forge/indices/` as they were actually generated and embedded in the project's AGENTS.md.

---

## 1. Feature-to-File Index

> **Spec:** `indices/feature-to-file.spec.md`
> **Purpose:** "If the user asks about X, read files Y" — maps natural language queries to exact file paths.
> **Applied in:** `AGENTS.md` §"Feature-to-File Index" — 20-row lookup table.

### Full Table (excerpt: 16 representative rows of 20)

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
| Extraer texto de PDF/DOCX          | `packages/documents/src/services/document-processor.service.ts`, `pdf.service.ts`, `docx.service.ts`        | `interfaces/parser.interface.ts`, `types/document.types.ts`                       |
| HTTP requests / descargar archivos | `packages/http/src/services/http.service.ts`, `download.service.ts`                                         | `http-error.ts`, `interfaces/http-options.interface.ts`                           |
| Web scraping / Playwright          | `packages/playwright/src/playwright.service.ts`                                                             | `interfaces/playwright-options.interface.ts`, `constants/playwright.constants.ts` |
| Tareas en background / Inngest     | `packages/inngest/src/inngest.service.ts`, `functions/index.ts`                                             | `serve/inngest.serve.module.ts`, `serve/inngest-events.controller.ts`             |
| CRUD / usuarios / API REST         | `apps/nominas/src/modules/usuarios/usuarios.service.ts`, `usuarios.controller.ts`, `usuarios.repository.ts` | `schemas/usuario.schema.ts`, `dto/`                                               |
| Templates HTML / EJS               | `packages/serve-static/src/serve-static.service.ts`                                                         | `templates/layouts/`, `templates/pages/`                                          |
| Crear un NUEVO módulo              | AGENTS.md §9 (Creating New Modules)                                                                         | AGENTS.md §6 Module Patterns                                                      |

### Design Decisions

- **Spanish queries:** The project's primary language is Spanish, so queries like "Login / registro" and "Tareas en background" match how developers actually search.
- **Granularity:** Each row points to 1-3 primary files + 1-2 secondary files. Never more than 5 files total — keeps the context budget small.
- **Escalation column:** "May also need" separates mandatory reads from optional deep dives.
- **Module creation:** Special row points to AGENTS.md sections, not files — recognizes that creating a module is a workflow question, not a code location question.

---

## 2. Capability Matrix

> **Spec:** `indices/capability-matrix.spec.md`
> **Purpose:** Package → import path → key exports → documentation status. Answers "what does this package export and where do I import it from?"
> **Applied in:** `AGENTS.md` §"Package Capability Matrix" — 10-row table.

| Package              | Import Path                 | Key Exports                                                                                                                                                                                                   | Documented |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| @common/ai           | `@common/ai`                | `AiService`, `ChatMessage`, `AIResponse`, `GeneratedSchema`                                                                                                                                                   | Full       |
| @common/auth         | `@common/auth`              | `AuthService`, `JwtAuthGuard`, `RolesGuard`, `Public`, `Roles`, `MagicLinkService`, `TwoFactorService`, `PasskeysService`                                                                                     | Full       |
| @common/common       | `@common/common`            | `BaseAdapter<T>`, `DatabaseExceptionFilter`, `HttpError`                                                                                                                                                      | Full       |
| @common/database     | `@common/database`          | `TransactionService`, `TransactionManager`, `TransactionalWrapper`, `@Transaction`, `@TransactionParam`                                                                                                       | Full       |
| @common/documents    | `@common/documents`         | `DocumentProcessorService`, `PdfService`, `DocxService`, `DocumentContent`                                                                                                                                    | Full       |
| @common/http         | `@common/http`              | `HttpService`, `DownloadService`, `HttpError`, `createHttpError`, `BadRequestError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `TimeoutError`, `InternalServerError`, `ServiceUnavailableError` | Full       |
| @common/inngest      | `@common/inngest`           | `InngestService`, `InngestServeModule`                                                                                                                                                                        | Full       |
| @common/playwright   | `@common/playwright`        | `PlaywrightService`, `PlaywrightOptions`                                                                                                                                                                      | Full       |
| @common/resend       | `@common/resend`            | `ResendService`, `NewsletterModule`, `NewsletterService`                                                                                                                                                      | Full       |
| @common/serve-static | `@common/serve-static`      | `ServeStaticModule`, `ServeStaticService`                                                                                                                                                                     | Full       |
| dynamic-schema       | `./modules/dynamic-schema/` | `DynamicSchemaService`, `SchemaCompilerService` (App Module)                                                                                                                                                  | Full       |
| usuarios             | `./modules/usuarios/`       | `UsuariosService`, `UsuariosRepository` (App Module)                                                                                                                                                          | Full       |

### Design Decisions

- **Documented column:** Every package is marked "Full" because the audit found all 10 package READMEs to be comprehensive. This column serves as a quality gate — if a package drops to "Partial", it triggers a doc update.
- **Key Exports column:** Lists class names, not file paths. This is the "what can I import" view — complementing the feature-to-file index's "where is the code" view.
- **Import paths:** Use `@common/*` aliases matching `tsconfig.json` path mappings — copy-paste ready for any developer.
- **App modules:** `dynamic-schema` and `usuarios` are included despite being app-level because they are the primary domain modules consumers interact with.

---

## 3. Cross-Cutting Concerns Matrix

> **Spec:** `indices/cross-cutting.spec.md`
> **Purpose:** "If you touch A, check B" — surfaces hidden dependencies so developers don't break things in unrelated packages.
> **Applied in:** `AGENTS.md` §"Cross-Cutting Concerns" — 8-row dependency awareness matrix.

### Full Matrix

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

### Design Decisions

- **Why column:** Every row explains the dependency relationship — not just "go read this" but "here's WHY reading this matters". This is critical because developers are more likely to follow advice they understand.
- **Rule integration:** The AGENTS.md embeds a rule directly below this table: "If the user asks for a change in any of the 'If the request touches...' columns, STOP and ask: 'This change could affect [related area]. Should I include that in scope?'" — this turns a passive reference table into an active decision gate for LLMs.
- **Bidirectional coverage:** The same relationship appears from both sides. For example, Auth→Resend (email verification) and Emails→Resend (newsletter uses Resend) both reference the same package from different entry points.

---

## 4. Error Handling Matrix

> **Spec:** `indices/error-handling.spec.md`
> **Purpose:** Document which error strategy each package uses so consumers know whether to `try/catch`, check a boolean, or parse error codes.
> **Applied in:** `AGENTS.md` §"Error Handling Patterns" — 6-row strategy comparison.

### Full Matrix

| Package           | Strategy                     | Check Pattern                                     | Throw Pattern                                                      |
| ----------------- | ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| @common/ai        | `AIResponse.success` boolean | `if (!result.success) { result.error }`           | Returns `{ success: false, error: string }`, never throws          |
| @common/documents | JSON-stringified error codes | `JSON.parse(error.message).code`                  | `throw new Error(JSON.stringify({ code, message }))`               |
| @common/http      | OOP class hierarchy          | `error instanceof HttpError` / `error.statusCode` | `throw new NotFoundError(msg, url)` or `createHttpError(404, ...)` |
| @common/database  | Native exceptions + retry    | `try/catch` — transient errors auto-retried       | `throw new NotFoundException(...)` from NestJS                     |
| @common/auth      | NestJS HTTP exceptions       | `try/catch` with `UnauthorizedException`          | `throw new UnauthorizedException(...)`                             |
| dynamic-schema    | Error code strings           | `if (!result.success) { result.error }`           | Returns `{ success: false, error: 'SCHEMA_GENERATION_ERROR' }`     |

### Design Decisions

- **Strategy diversity documented, not judged:** The matrix documents 4 different error strategies across 6 packages. It does NOT prescribe one strategy — it just tells you what to expect so you handle errors correctly per package. This is honest documentation of technical debt.
- **Check Pattern column:** Shows the exact code pattern to use. No ambiguity — copy the pattern, adapt the variable names.
- **Rule of thumb:** The AGENTS.md includes a heuristic below the matrix: "If the package returns `{ success: boolean }`, check it. If it throws, `try/catch` it." This compresses the 6-row table into a single mental model.
- **Why the inconsistency exists:** The project evolved over time. AI and documents packages were written first (functional style), HTTP was written second (OOP style), database and auth came from NestJS conventions. The matrix documents the reality rather than hiding it.
