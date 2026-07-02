# Package Capability Matrix Specification

> **Index Mode:** `capability-matrix`
> **Apply When:** Monorepo with extractable packages, multi-module projects, frameworks with independent components.
> **Output:** A table in AGENTS.md listing every package/module with its import path, public API, and documentation status.

---

## What It Is

A four-column table that gives an LLM a bird's-eye view of the entire package ecosystem. Each row identifies a package by its import path, lists its key public exports, and declares whether it is documented. This lets an agent quickly find which package has the `AiService` or `HttpError` without scanning every barrel file.

## Table Format

```
| Package | Import Path | Key Exports | Documented |
|---------|------------|-------------|------------|
| {{PACKAGE_NAME_1}} | `{{IMPORT_PATH_1}}` | {{EXPORT_LIST_1}} | {{DOC_STATUS_1}} |
| {{PACKAGE_NAME_2}} | `{{IMPORT_PATH_2}}` | {{EXPORT_LIST_2}} | {{DOC_STATUS_2}} |
...
{{PACKAGE_ROWS}}
```

### Column Definitions

| Column          | Contents                                                                | Source                                              |
| --------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| **Package**     | Human-readable name, often the directory name or scoped package name    | `packages/<name>/package.json` → `name`             |
| **Import Path** | The path you'd write in an `import` statement                           | `tsconfig.json` paths, `package.json` exports field |
| **Key Exports** | Most-used classes, functions, decorators (5-8 per row, comma-separated) | Barrel file (`src/index.ts`) public API             |
| **Documented**  | Documentation coverage status                                           | `{{DOC_STATUS}}` enum                               |

### Documentation Status Values

| Status    | Meaning                                                  |
| --------- | -------------------------------------------------------- |
| `Full`    | README complete + JSDoc on all exports + tested examples |
| `Partial` | README exists but missing sections or JSDoc gaps         |
| `Minimal` | README exists but is a stub                              |
| `Missing` | No README exists                                         |

## When to Use

| Condition                        | Decision                                               |
| -------------------------------- | ------------------------------------------------------ |
| Monorepo with 3+ packages        | Include capability matrix                              |
| Multi-module app with 5+ modules | Include capability matrix (Module name → import path)  |
| Library with 20+ public exports  | Include capability matrix (instead of feature-to-file) |
| Single app, flat structure       | Skip — feature-to-file index is better                 |
| 2 packages total                 | Skip — list them inline in AGENTS.md                   |

## How the LLM Generates It

### Step 1: Discover Packages

```typescript
// Pseudocode — actual detection varies by language/framework
const packages = [];
for (const dir of ls('{{SRC_DIR}}')) {
  const pkgJson = read(`${dir}/package.json`);
  if (pkgJson?.name) packages.push({ name: pkgJson.name, path: dir });
}
```

### Step 2: Extract Import Paths

For each package, find the canonical import path:

- **TypeScript/JavaScript**: `tsconfig.json` `compilerOptions.paths` → the alias that maps to the package
- **Python**: directory name used in `from {{PKG}} import ...`
- **Go**: module path from `go.mod`
- **Rust**: crate name from `Cargo.toml`

### Step 3: Extract Public API

From each package's barrel file (`src/index.ts`, `__init__.py`, `lib.rs`):

1. Parse all `export` / `__all__` / `pub` declarations
2. Filter to top-level exports only (classes, functions, constants, decorators)
3. Truncate to the 5-8 most important exports (the ones users actually import)
4. For large APIs, use `...` suffix (e.g., `BadRequestError, NotFoundError...`)

### Step 4: Assess Documentation Status

For each package:

1. Check if `README.md` exists and has required sections (per CONVENTION.md)
2. Check JSDoc/docstring coverage on public exports
3. Assign status: `Full`, `Partial`, `Minimal`, or `Missing`

### Step 5: Sort and Present

- Sort packages alphabetically or by architectural layer (core first, then auth, then integrations)
- Add a tip below the table: "Use Ctrl+F with the import path to jump to the package's API reference"
- Link status values to the relevant section anchors

## Template

```markdown
## Package Capability Matrix

| Package | Import Path | Key Exports | Documented |
| ------- | ----------- | ----------- | ---------- |

{{PACKAGE_ROWS}}

> **Tip:** Use Ctrl+F with the import path to jump directly to the package's API reference in {{ANCHOR_SECTION}}.
```

## Real Example from nestJs-boilerplate

From `AGENTS.md` of a NestJS 11 monorepo with 10 packages.

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

**Key observations from this example:**

1. **Scoped packages + app modules**: The matrix mixes `@common/*` packages with app-local modules (`dynamic-schema`, `usuarios`). App modules use relative paths; packages use scoped paths.
2. **Truncation marker**: `HttpError, createHttpError, BadRequestError, NotFoundError...` — the `...` signals there are more exports without cluttering the table.
3. **All documented**: All 12 rows show `Full` because the project completed a documentation standardization pass. A real-world first audit would show a mix of `Full`, `Partial`, and `Missing`.
4. **Decorators in exports**: `@Transaction`, `@TransactionParam` — decorators are listed alongside classes because they're part of the public API.
5. **Context qualifier**: `(App Module)` suffix on app-local rows distinguishes them from extractable packages.
6. **Truncated import paths for readability**: `./modules/dynamic-schema/` instead of `apps/nominas/src/modules/dynamic-schema/` — the context (which app) is implied by the AGENTS.md location.
