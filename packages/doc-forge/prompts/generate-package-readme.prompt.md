# Prompt: Generate Package/Module README

## Input Required

- `{{PACKAGE_NAME}}` — Package or module name (e.g., `@common/auth`, `usuarios`)
- `{{PACKAGE_PATH}}` — Path to the package directory (e.g., `packages/auth/`)
- `{{SOURCE_FILES}}` — List of all source files in the package with line counts
- `{{PUBLIC_API}}` — Extracted public exports: classes, functions, decorators, interfaces
- `{{ENV_VARS}}` — Environment variables used by this package only
- `{{DEPENDENCIES}}` — External and internal dependencies (from package.json or imports)
- `{{ERROR_STRATEGY}}` — How this package handles errors (detected from source patterns)
- `{{USAGE_EXAMPLES}}` — In-project usage: who imports this package and how
- `{{CONVENTION}}` — Sections required per DOCUMENTATION-CONVENTION.md
- `{{STATUS}}` — Current documentation status: `complete`, `partial`, `critical`, or new

## Output Format

A complete per-package README.md:

````markdown
<!-- {{PACKAGE_NAME}} — status: {{STATUS}} -->

# {{PACKAGE_NAME}}

> **Purpose:** {{ONE_LINE_DESCRIPTION}}
> **Location:** `{{PACKAGE_PATH}}`
> **Dependencies:** {{DEPENDENCY_LIST}}

## Quick Start

```{{LANGUAGE}}
import { {{MAIN_EXPORT}} } from '{{IMPORT_PATH}}';

// Minimal working example
{{MINIMAL_EXAMPLE}}
```
````

## API Reference

| Export          | Type     | Description     | Example     |
| --------------- | -------- | --------------- | ----------- |
| {{EXPORT_NAME}} | {{TYPE}} | {{DESCRIPTION}} | `{{USAGE}}` |

## Environment Variables

| Variable | Default | Required | Description |
| -------- | ------- | -------- | ----------- |

## Configuration

(non-env configuration: module options, constructor params, factory functions)

## Dependencies

### External

| Package | Version | Purpose |
| ------- | ------- | ------- |

### Internal

| Package | Purpose |
| ------- | ------- |

## Error Handling

(How errors are produced and how to handle them — per the error handling spec)

## Common Pitfalls

(Non-obvious behaviors, platform-specific issues, "gotchas")

## Deployment

(Production considerations, Docker, platform-specific notes)

```

## Prompt

```

You are generating the README.md for a single package/module: {{PACKAGE_NAME}}.

PACKAGE CONTEXT:

- Name: {{PACKAGE_NAME}}
- Path: {{PACKAGE_PATH}}
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Current doc status: {{STATUS}}

SOURCE ANALYSIS:

- Files: {{SOURCE_FILES_LIST}}
- Public exports: {{PUBLIC_API_LIST}}
- Error strategy: {{ERROR_STRATEGY}}
- Env vars used: {{ENV_VARS_LIST}}

PROJECT CONTEXT:

- Other packages that import this: {{CONSUMERS}}
- Internal dependencies: {{INTERNAL_DEPS}}
- External dependencies: {{EXTERNAL_DEPS}}

CONVENTION CONTEXT:
Required sections from DOCUMENTATION-CONVENTION.md: {{REQUIRED_SECTIONS}}

YOUR TASK:
Generate a complete, self-contained README.md for this package. Rules:

1. STATUS TAG: First line must be `<!-- {{PACKAGE_NAME}} — status: {{STATUS}} -->`

2. QUICK START: Write the absolute minimum code to use this package. The reader
   should be able to copy-paste and have it work (assuming they have the project
   set up). Include:
   - Import statement using the ACTUAL import path (from capability matrix)
   - Constructor injection or instantiation ({{LANGUAGE}}-appropriate)
   - One method call showing the most common use case

3. API REFERENCE: Build a table from {{PUBLIC_API_LIST}}. For EACH public export:
   - Export: the class/function/decorator name
   - Type: Service, Guard, Decorator, Interface, DTO, Utility, etc.
   - Description: one sentence — what it does, not how it's implemented
   - Example: minimal real-world usage in backtick code formatting
     Sort by importance (most-used first). Group related exports together.

4. ENVIRONMENT VARIABLES: Build a complete table. Variables THIS package reads:
   - Variable: exact name (UPPER_SNAKE_CASE)
   - Default: the fallback value or `(required)`
   - Required: Yes/No
   - Description: what happens if not set

5. DEPENDENCIES: Two sub-tables:
   a) External: npm/pip/cargo packages this module depends on
   b) Internal: other packages in THIS monorepo that this module uses

6. ERROR HANDLING: Document based on {{ERROR_STRATEGY}}:
   - If the package THROWS exceptions: list each exception type, when it's thrown,
     and show a try/catch example
   - If the package RETURNS success/error: show the return type, how to check,
     and list error codes or error strings
   - If the package HAS AUTO-RETRY: document the retry behavior, max attempts,
     and what errors are retryable
   - Use ACTUAL code examples from the source — never pseudocode
   - This section must match what the error-handling.spec.md index expects

7. COMMON PITFALLS: 3-5 non-obvious things that will trip up developers:
   - "If you see X error, it means Y — check your Z config"
   - Platform-specific issues (works on Linux but not Windows?)
   - Ordering requirements (must register X before Y)
   - Version compatibility notes
   - Memory/performance gotchas

8. CONFIGURATION: If the package accepts non-env configuration (module options,
   constructor parameters, factory patterns), document them with examples.

9. CROSS-REFERENCES: At the bottom, add:

   ```
   ## See Also
   - [{{RELATED_PACKAGE_1}}](../{{PATH_1}}/README.md) — {{WHY}}
   - [{{RELATED_PACKAGE_2}}](../{{PATH_2}}/README.md) — {{WHY}}
   - [AGENTS.md §{{SECTION}}](../../AGENTS.md#{{ANCHOR}}) — {{WHY}}
   ```

10. PRESERVE EXISTING: If {{STATUS}} is "partial" or "complete", read the existing
    README. Identify content rated "Good" or "Excellent" in the audit. Keep it.
    Merge new content around it. Do NOT replace working content.

11. SELF-VALIDATE: After writing, check:
    - All {{REQUIRED_SECTIONS}} headings exist
    - API Reference has all public exports from barrel file
    - Error Handling section has real code examples (not pseudocode)
    - Quick Start example uses the actual import path
    - No broken relative links to other packages

OUTPUT the complete README.md for {{PACKAGE_NAME}}. Do not wrap in code fences.

```

## Usage Context

- **Phase**: Phase 3 (Generate) — step 3 of document generation order
- **Trigger**: After AGENTS.md is generated, one invocation per package/module
- **Depends on**: Phase 1 audit, Phase 2 blueprint, CONVENTION.md, AGENTS.md (for capability matrix)
- **Feeds into**: Phase 3 root README generation (root README links to package READMEs)
- **Re-run frequency**: When a package's public API changes, when error strategy changes, when new env vars added

## Real Example from nestJs-boilerplate

This prompt was applied to all 10 packages in the NestJS monorepo.

**Example: `@common/database`** — the most complex package README:

**What existed before**: A ~150 line README with Quick Start and Configuration. No Error Handling section, no Common Pitfalls, no API Reference table.

**What the prompt produced**: A 400+ line README with:

1. **Status tag**: `<!-- @common/database — status: complete -->`
2. **Quick Start**: Showed `DatabaseModule` import and `TransactionService.withTransaction()` usage — the most common pattern developers use.
3. **API Reference (18 rows)**: Listed every public export:
   - `TransactionService` with `withTransaction()`, `executeTransaction()`, `getActiveSession()`
   - `TransactionManager` with `start()`, `commit()`, `abort()`, `end()`, `getSession()`
   - `TransactionalWrapper` with `execute()`
   - `@Transaction()` and `@TransactionParam()` decorators
   - Each row had a real usage example from the source code
4. **Error Handling**: Dedicated section with two tables:
   - Connection errors: `MongooseServerSelectionError`, retry behavior, connection timeout
   - Transaction errors: `TransientTransactionError`, auto-retry with `retry: true`, max 3 attempts
   - Each error had a try/catch example with the exact exception class
5. **Configuration**: Documented `forRoot()` and `forRootAsync()` patterns with `.env` examples
6. **Dependencies**: External (mongoose, @nestjs/mongoose) and internal (@common/common)
7. **Common Pitfalls (5 items)**: Including "session must be passed to EVERY mongoose operation in a transaction or it silently uses a different connection"
8. **When to Use Each Transaction API**: Decision table — simple writes → `TransactionService`, entire method → `@Transaction()`, complex manual → `TransactionManager`

**Key pattern observed**: The prompt's "preserve existing" rule was critical for `@common/ai` which had an extensive 500+ line README with provider configuration. The generator kept the provider setup guides and added the missing Error Handling section with the `AIResponse.success` check pattern.
```
