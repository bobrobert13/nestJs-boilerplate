# Phase 3: Document Generation

> **Purpose:** Generate or enhance documentation using templates, prompts, and rules.
> This is where the convention established in CONVENTION.md is APPLIED.

---

## The 8 Generation Rules

These are hard rules. If you violate one, you'll produce docs that fight the
convention and must be reworked. Apply them to EVERY document you generate.

### Rule 1: Never Generate from Scratch

**The audit (Phase 1) and blueprint (Phase 2) MUST be run first.**

You cannot generate useful docs without knowing what already exists, what's
missing, what conventions the project uses, and what priority each doc has.
Generating without audit leads to:

- Duplicated work (generating a README that already has good content)
- Inconsistent style (not following the existing convention)
- Wrong assumptions (generating a monorepo README for a single-app project)

### Rule 2: Hydrate First, Write Second

Every `{{PLACEHOLDER}}` from Phase 0 hydration MUST be resolved before a single
line of documentation is written. This includes:

```
{{ROOT}}              → Absolute or relative root path
{{SRC_DIR}}           → Where source code lives
{{APP_DIR}}           → Where application entry points live
{{PKG_DIR}}           → Where packages/modules live
{{DOC_DIR}}           → Where dedicated docs live
{{INGEST_MANAGER_FILE}} → package.json, Cargo.toml, go.mod, pyproject.toml
{{LINT_CMD}}          → How to lint
{{TEST_CMD}}          → How to test
{{BUILD_CMD}}         → How to build
{{START_CMD}}         → How to start
{{CI_SYSTEM}}         → github-actions, gitlab-ci, circleci, none
{{PROJECT_NAME}}      → From package.json name field
{{VERSION}}           → From version field
{{DESCRIPTION}}       → From description field
{{AUTHOR}}            → From author field
{{LANGUAGE}}          → typescript, python, go, rust, etc.
{{FRAMEWORK}}         → nestjs, fastapi, gin, actix, express, etc.
{{DB_TYPE}}           → mongodb, postgresql, mysql, sqlite, none
```

**If a placeholder cannot be resolved from Phase 0, use `{{UNKNOWN_*}}` and flag it.**

### Rule 3: Preserve Existing Content

If a document already exists, MERGE improvements — do NOT replace wholesale.

**Merge algorithm:**

1. Read existing document
2. Identify which sections are present and which are missing
3. Enhance existing sections that have gaps (incomplete API tables, missing examples)
4. Add missing sections AFTER existing content
5. Fix broken links, outdated references, stale status tags
6. NEVER delete or rewrite content that is already good

**When to replace (rare):**

- Document is entirely placeholder text (<10 meaningful lines)
- Document describes a removed/deleted component
- Document uses a different format than the convention (e.g., no status tag)

### Rule 4: Apply the Right Index Modes

Documents are easier to read AND harder to make stale when they use structured
index tables instead of wall-of-text prose. Choose the right index mode for
each document (see § Index Mode Selection below).

### Rule 5: Every Document Gets a Status Tag

The FIRST line (or first HTML comment) of every generated README must be:

```markdown
<!-- {{IMPORT_PATH}} — status: {{STATUS}} -->
```

Where `{{STATUS}}` is one of: `complete`, `partial`, or `critical`.

This tag is machine-checkable by CI (Phase 5) and tells readers at a glance
whether to trust the document.

### Rule 6: Code Examples Must Be Complete

Every code example must include:

- Import statements
- Type annotations (where applicable)
- Error handling (at least a comment if omitted for brevity)
- Context (what file/module this belongs in)

**Bad (snippet-only):**

```
await service.sendEmail(options);
```

**Good (complete):**

```typescript
import { ResendService } from '{{IMPORT_PATH}}';

@Injectable()
export class WelcomeService {
  constructor(private readonly resend: ResendService) {}

  async sendWelcome(email: string): Promise<void> {
    await this.resend.sendEmail({
      to: email,
      subject: 'Welcome!',
      html: '<h1>Welcome to our app</h1>',
    });
  }
}
```

### Rule 7: Tables Over Paragraphs for Reference Content

For reference content (APIs, env vars, commands, errors, cross-cutting concerns),
use tables. For narrative content (architecture decisions, setup guides, tutorials),
use prose.

**Table-worthy:** API methods, environment variables, error codes, dependency
versions, command reference, configuration options, cross-cutting concerns.

**Prose-worthy:** Architecture overview, design rationale, getting started guide,
troubleshooting narrative, contribution workflow.

### Rule 8: Cross-References Must Be Verified

Every internal link (`[text](../path/to/file)`) must resolve to an actual file.
Every external link (`[text](https://...)`) must be verified at generation time.

If a referenced file doesn't exist yet (e.g., you're linking to a doc that will
be generated later in the sequence), replace the link with `{{LINK:planned_filename}}`
and add a `<!-- TODO: update after generation -->` comment.

---

## Document Generation Sequence

Generate documents in this order. Each step lists:

- Inputs (what must exist before starting)
- Outputs (what this step produces)
- Template used
- Rules that apply most heavily

### Step 1: CONVENTION.md

|                |                                                                    |
| -------------- | ------------------------------------------------------------------ |
| **Depends on** | Nothing (goes first)                                               |
| **Output**     | `{{ROOT}}/CONVENTION.md` or `{{ROOT}}/DOCUMENTATION-CONVENTION.md` |
| **Template**   | `templates/CONVENTION.template.md`                                 |
| **Key rules**  | R2 (hydrate), R5 (status tag), R7 (tables)                         |

**Content:**

- Naming convention for files and directories
- Required sections for each document type
- Cross-referencing standard
- JSDoc/docstring format (language-specific)
- Diagram convention
- Status tag format

### Step 2: AGENTS.md (Master AI Index)

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| **Depends on** | CONVENTION.md, Phase 0 hydration map                            |
| **Output**     | `{{ROOT}}/AGENTS.md` (or `CLAUDE.md`, `COPILOT.md`)             |
| **Template**   | `templates/AGENTS.template.md`                                  |
| **Key rules**  | R4 (index modes), R5 (status tag), R7 (tables), R8 (cross-refs) |

**Content:**

- Quick Reference table (commands)
- Feature-to-File index
- Capability Matrix (if monorepo)
- Cross-Cutting Concern warnings
- Error Handling strategy table
- Architecture / Data Flow diagram
- Creating New Modules guide (if applies)
- Code Style / Conventions

### Step 3: Package/Module READMEs

|                |                                                                     |
| -------------- | ------------------------------------------------------------------- |
| **Depends on** | CONVENTION.md, AGENTS.md (for cross-references)                     |
| **Output**     | `{{PKG_DIR}}/*/README.md` or `{{SRC_DIR}}/modules/*/README.md`      |
| **Template**   | `templates/PACKAGE_README.template.md`                              |
| **Key rules**  | R3 (preserve), R5 (status tag), R6 (complete examples), R7 (tables) |

**Content:** See § Section Requirements in 02-blueprint.md.

### Step 4: Root README.md

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Depends on** | All package READMEs exist (so root can summarize them) |
| **Output**     | `{{ROOT}}/README.md`                                   |
| **Template**   | `templates/README.template.md`                         |
| **Key rules**  | R3 (preserve), R7 (tables), R8 (cross-refs)            |

### Step 5: CHANGELOG.md

|                |                                               |
| -------------- | --------------------------------------------- |
| **Depends on** | Git history                                   |
| **Output**     | `{{ROOT}}/CHANGELOG.md`                       |
| **Template**   | `templates/CHANGELOG.template.md`             |
| **Key rules**  | R1 (audit first — check what git log reveals) |

### Step 6–9: Governance Documents

| Step | Document           | Template                                | Notes                                                        |
| ---- | ------------------ | --------------------------------------- | ------------------------------------------------------------ |
| 6    | CONTRIBUTING.md    | `templates/CONTRIBUTING.template.md`    | Use detected commands (lint, test, build) from Phase 0       |
| 7    | SECURITY.md        | `templates/SECURITY.template.md`        | Requires: security contact email, supported versions         |
| 8    | CODE_OF_CONDUCT.md | `templates/CODE_OF_CONDUCT.template.md` | Can be copy-pasted from Contributor Covenant                 |
| 9    | LICENSE            | N/A (use SPDX)                          | Detect from `package.json` license field; if UNLICENSED, ask |

---

## Index Mode Selection

Different project structures need different navigation strategies. The decision
tree below selects the right index mode(s) for each doc.

### Decision Tree

```
Is the project a monorepo with 3+ packages?
├── YES → Apply Capability Matrix (§ B) to AGENTS.md
│        Apply Feature-to-File (§ A) to AGENTS.md
│        Apply Package/Module index (§ B) to root README
│
│   Are there hidden dependencies (package A uses B but doesn't document it)?
│   └── YES → Apply Cross-Cutting (§ C) to AGENTS.md
│
│   Do different packages handle errors differently?
│   └── YES → Apply Error Handling (§ D) to AGENTS.md
│
└── NO (single app / library)
    Apply Feature-to-File (§ A) to AGENTS.md
    Apply Error Handling (§ D) if multiple error strategies exist
```

### Index Mode A: Feature-to-File

**Apply when:** Monorepo with 3+ packages, legacy codebase, multi-module app.

**Format:**

```markdown
### Feature-to-File Index

| If the user asks about... | Read these files                 | May also need   |
| ------------------------- | -------------------------------- | --------------- |
| {{FEATURE_NAME}}          | `{{FILE_PATH}}`, `{{FILE_PATH}}` | `{{FILE_PATH}}` |
```

**Rules:**

- One row per feature/user-ask
- Primary files first, secondary in "May also need"
- Linked paths must resolve (Rule 8)
- Add a `context budget rule` at the top: "For focused changes, read ONLY the files listed"

### Index Mode B: Capability Matrix

**Apply when:** Monorepo with extractable packages, library ecosystem.

**Format:**

```markdown
### Package Capability Matrix

| Package          | Import Path       | Key Exports                | Documented            |
| ---------------- | ----------------- | -------------------------- | --------------------- |
| {{PACKAGE_NAME}} | `{{IMPORT_PATH}}` | {{EXPORT_1}}, {{EXPORT_2}} | Full / Partial / None |
```

**Rules:**

- Every package gets a row
- "Documented" column reflects actual state (honest, not aspirational)
- Use `Tip: Use Ctrl+F with the import path to jump to the API reference`

### Index Mode C: Cross-Cutting Concerns

**Apply when:** Hidden dependencies exist (services consuming services outside their module).

**Format:**

```markdown
### Cross-Cutting Concerns

| If the request touches... | Also check... | Why        |
| ------------------------- | ------------- | ---------- |
| {{AREA_A}}                | `{{AREA_B}}`  | {{REASON}} |
```

**Rules:**

- Must be WARNINGS, not suggestions — use `STOP and ask:` language
- Every row must have a business-logic reason in the "Why" column
- Order by most-likely-to-be-missed first

### Index Mode D: Error Handling Strategy

**Apply when:** Different components use different error patterns.

**Format:**

```markdown
### Error Handling Patterns

| Component     | Strategy     | Check Pattern    | Throw/Return Pattern  |
| ------------- | ------------ | ---------------- | --------------------- |
| {{COMPONENT}} | {{STRATEGY}} | `{{CHECK_CODE}}` | `{{THROW_OR_RETURN}}` |
```

**Rules:**

- One row per error strategy, not per package
- Groups packages that share a strategy
- Includes concrete code checks ("instanceof", "success boolean")

---

## Status Tag Convention

Every generated or enhanced README starts with a status tag. This is the
single most important convention — it enables all automated checks in Phase 5.

### Format

```markdown
<!-- {{IMPORT_PATH}} — status: {{STATUS}} -->
```

Where:

- `{{IMPORT_PATH}}` is the package import path (e.g., `@common/database`) or
  document identifier (e.g., `root/README`, `app/nominas`)
- `{{STATUS}}` is one of: `complete`, `partial`, `critical`

### Status Definitions

| Status     | Meaning                                                                                                      | When to Use                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `complete` | All required sections exist with accurate, up-to-date content. No known gaps.                                | After full generation + validation passing                  |
| `partial`  | Most sections exist but some are incomplete (missing API entries, outdated env vars). Known gaps documented. | During iterative improvement, after initial generation      |
| `critical` | Document is a stub/placeholder or completely outdated. Do NOT trust this document.                           | Pre-generation, or when doc describes removed functionality |

### Status Transitions

```
MISSING → critical (stub created)
critical → partial (content added, gaps remain)
partial → complete (all gaps filled, validation passes)
complete → partial (code changed, doc needs update)
```

### Machine Check

CI validates that:

1. Every package README has a status tag on line 1 (or within first 5 lines)
2. `critical` status in any non-stub README fails CI with a "fix or delete" message
3. `partial` status triggers a warning comment on PR

---

## JSDoc/Docstring Standards

Every public export MUST have a docstring. The format is language-dependent,
but the content requirements are universal.

### Language-Agnostic Requirements

Every docstring must answer these 5 questions:

1. **What** does this do? (one-line description)
2. **How** is it used? (code context, not just the signature)
3. **What** are the inputs? (param types, constraints, defaults)
4. **What** is the output? (return type, null conditions, thrown errors)
5. **When** does it fail? (exception types, error conditions)

### TypeScript/JSDoc Format

````typescript
/**
 * Brief one-line description of what this function/class does.
 *
 * Optional multi-line description explaining the WHY and WHEN,
 * not just the WHAT. Include gotchas, edge cases, and usage context.
 *
 * @param options - Description of the parameter object
 * @param options.field - Description of a nested field
 * @returns Description of the return value, including when null/undefined
 * @throws {ErrorType} When and why this throws
 *
 * @example
 * ```typescript
 * const result = await myFunction({ key: 'value' });
 * ```
 */
````

### Python (Google-style) Format

```python
def my_function(param1: str, param2: int = 0) -> Dict[str, Any]:
    """Brief one-line description.

    More detailed description explaining WHY and WHEN.

    Args:
        param1: Description of param1.
        param2: Description of param2. Defaults to 0.

    Returns:
        Description of return value. Include structure for dicts.

    Raises:
        ValueError: When param1 is empty.
        ConnectionError: When the external service is unreachable.

    Example:
        >>> result = my_function("hello", 42)
        >>> print(result["key"])
    """
```

### Go (Godoc) Format

```go
// FunctionName does X with Y and returns Z.
//
// More detailed description of behavior, edge cases, and usage.
//
// The returned value is nil when no result is found.
// Callers must check for nil before using the result.
func FunctionName(param string) (*Result, error) {
```

### What Gets a Docstring

| Export Type                   | Docstring Required?               | Example                                         |
| ----------------------------- | --------------------------------- | ----------------------------------------------- |
| Public class / struct         | YES                               | Service, Controller, Model                      |
| Public method / function      | YES                               | All exported functions                          |
| Public interface / type       | YES                               | DTOs, config types, options interfaces          |
| Public constant / enum        | YES                               | Error codes, status enums, config defaults      |
| Public decorator / annotation | YES                               | @Public(), @Roles(), @Transaction()             |
| Private method / function     | NO (name must be self-describing) | Internal helpers                                |
| Constructor param (DI)        | NO (unless non-obvious)           | NestJS `constructor(private readonly svc: Svc)` |

### Deprecation Tag

When deprecating an export:

```typescript
/**
 * @deprecated Since v2.0. Use {@link newFunction} instead.
 * Will be removed in v3.0.
 */
```

---

## Cross-Reference Standards

### Internal Links (within project)

```markdown
[Descriptive text](../relative/path/to/file.md#optional-anchor)
```

- Always use relative paths from the document's location
- Anchor links use GitHub-compatible heading anchors (lowercase, hyphens, no punctuation)
- If the target file doesn't exist yet, use `{{LINK:planned_path}}`

### Package-to-Package References

When Package A's README references Package B:

```markdown
See [`@common/http`](../../packages/http/README.md) for the HTTP client.
```

### AGENTS.md → Package README References

```markdown
| Email / newsletter | `packages/resend/src/services/resend.service.ts` | `packages/resend/README.md` |
```

The AGENTS.md always links to source files (for reading code) AND to READMEs
(for understanding purpose).

### External Links

```markdown
[Framework docs](https://example.com/docs) — Official setup guide
```

- Always include a brief description after the link
- Prefer official documentation over blog posts
- Verify all external links at generation time

---

## Diagram Convention

Use Mermaid for all architecture, data flow, and dependency diagrams. Mermaid
renders natively on GitHub and in most markdown viewers without external tools.

### When to Use a Diagram

| Scenario                          | Diagram Type      | Mermaid Syntax               |
| --------------------------------- | ----------------- | ---------------------------- |
| How packages depend on each other | Dependency graph  | `graph TD` or `flowchart LR` |
| Request lifecycle                 | Sequence diagram  | `sequenceDiagram`            |
| Data model relationships          | ER diagram        | `erDiagram`                  |
| API endpoints by resource         | N/A — use a table | Markdown table               |
| CI/CD pipeline                    | Flowchart         | `flowchart LR`               |
| Module architecture               | Block diagram     | `graph TB`                   |

### Dependency Graph Example

```mermaid
graph TD
    APP[{{APP_NAME}}] --> DB[{{DB_PACKAGE}}]
    APP --> AUTH[{{AUTH_PACKAGE}}]
    APP --> HTTP[{{HTTP_PACKAGE}}]
    AUTH --> DB
    AUTH --> RESEND[{{EMAIL_PACKAGE}}]
```

### Rules for Diagrams

1. Every diagram must have a caption explaining what it shows
2. Node labels must match actual package/module names
3. Use `graph TD` (top-down) for hierarchy, `graph LR` (left-right) for pipelines
4. Keep diagrams under 15 nodes — split complex graphs into sub-diagrams
5. If Mermaid isn't supported (some platforms), provide an ASCII fallback

---

## Example from nestJs-boilerplate

> **Context:** NestJS 11 monorepo, 10 packages, `packages/` + `apps/nominas/`.

> ### Rule 1: Never from Scratch — Applied
>
> Before generating any README, the Phase 1 audit discovered that 7 of 10 packages
> already had excellent READMEs (status: complete). Only 3 needed enhancement.
> The `database` README (368 lines) became the benchmark that all other READMEs
> were measured against.

> ### Rule 2: Hydrate First — Applied
>
> Phase 0 detected: `{{SRC_DIR}} = packages/`, `{{APP_DIR}} = apps/`,
> `{{PKG_MANAGER}} = npm`, `{{LINT_CMD}} = npm run lint`, etc.
> These replaced all `{{PLACEHOLDER}}` values in every template.

> ### Rule 3: Preserve Existing — Applied
>
> The `AGENTS.md` was enhanced (feature-to-file index added, capability matrix
> expanded, cross-cutting concerns added) without deleting any existing content.
> The original Quick Reference and architecture sections were preserved.

> ### Rule 4: Index Modes — Applied
>
> All 4 index modes applied to `AGENTS.md`:
>
> - **Feature-to-File**: 19 rows mapping user asks to source files ("Login / JWT" → `auth.service.ts`)
> - **Capability Matrix**: 11 rows of `@common/*` packages with import paths and key exports
> - **Cross-Cutting**: 7 rows of "If request touches X, also check Y" warnings
> - **Error Handling**: 6 rows mapping packages to error strategies

> ### Rule 5: Status Tags — Applied
>
> Every package README starts with `<!-- @common/name — status: partial -->`.
> The root README does NOT have a status tag (root READMEs don't need them —
> they reference sub-docs that have status tags).

> ### Rule 6: Complete Examples — Applied
>
> The `@common/database` README includes 5 complete code examples with imports,
> types, and error handling context. The `@common/auth` README shows full
> controller usage with `@UseGuards(JwtAuthGuard)` and `@Public()` decorators.

> ### Rule 7: Tables Over Paragraphs — Applied
>
> The AGENTS.md uses 12+ tables (Quick Reference, Feature-to-File, Capability
> Matrix, Cross-Cutting, Error Handling, Command Reference, External Services,
> Environment Variables). The only prose sections are Architecture (§2) and
> Creating New Modules (§9), which require narrative explanation.

> ### Rule 8: Cross-References Verified — Applied
>
> Every `[text](../path/to/file)` in AGENTS.md resolves to an actual file.
> During generation, 3 broken links were found and fixed in existing READMEs.
