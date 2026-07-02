# Error Handling Matrix Specification

> **Index Mode:** `error-handling`
> **Apply When:** Projects with 3+ different error handling approaches across components.
> **Output:** A table in AGENTS.md documenting each component's error strategy so LLMs know how to handle failures correctly.

---

## What It Is

A table that answers the question: "I'm calling code from package X — how do I handle errors?" Each row documents a component's error strategy (throws vs returns), the check pattern the LLM must use, and the throw/return pattern the component produces.

This is critical because different packages in the same project often use incompatible error strategies:

- Package A returns `{ success: boolean, error: string }`
- Package B throws an OOP exception hierarchy
- Package C throws strings with JSON-encoded error codes

An LLM that doesn't know these differences will write incorrect error handling code.

## Table Format

```
| Component | Strategy | Check Pattern | Throw Pattern |
|-----------|----------|---------------|---------------|
| {{COMPONENT_1}} | {{STRATEGY_1}} | `{{CHECK_PATTERN_1}}` | `{{THROW_PATTERN_1}}` |
| {{COMPONENT_2}} | {{STRATEGY_2}} | `{{CHECK_PATTERN_2}}` | `{{THROW_PATTERN_2}}` |
...
{{ERROR_ROWS}}
```

### Column Definitions

| Column            | Contents                                             | Example                                                   |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| **Component**     | Package/module name                                  | `@common/ai`                                              |
| **Strategy**      | Single-sentence description of the error philosophy  | `AIResponse.success boolean`                              |
| **Check Pattern** | The exact code the LLM must write to detect an error | `if (!result.success) { result.error }`                   |
| **Throw Pattern** | The exact code the component uses to produce errors  | `Returns { success: false, error: string }, never throws` |

## The "Rule of Thumb"

Below the table, a summary rule MUST appear:

> **Rule of thumb:** If the package returns `{ success: boolean }`, check it. If it throws, `try/catch` it.

This is a decision shortcut. Instead of memorizing 6 rows, the LLM learns the binary heuristic: check booleans, catch throws.

## When to Use

| Condition                                                                    | Decision                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| 3+ packages with different error handling                                    | Include error handling matrix             |
| Mix of throwing and non-throwing APIs                                        | Include error handling matrix             |
| Error codes used differently across modules                                  | Include error handling matrix             |
| All packages use the same error strategy (e.g., all throw NestJS exceptions) | Skip — note the uniform strategy          |
| Single package/module                                                        | Skip                                      |
| Library with documented error types                                          | Consider including, especially if untyped |

## How the LLM Generates It

### Step 1: Scan Error Patterns Per Component

For each package/module, analyze its source code for error handling patterns:

| Pattern to Detect              | How to Detect                                                           | Strategy Label                 |
| ------------------------------ | ----------------------------------------------------------------------- | ------------------------------ |
| Returns `{ success, error }`   | grep for `success: false`, `success: true`                              | `Return-value boolean`         |
| Returns error objects          | grep for `return.*error`, error response types                          | `Return-value object`          |
| Throws custom classes          | grep for `throw new {{ClassName}}`, class hierarchies extending `Error` | `OOP exception hierarchy`      |
| Throws NestJS/HTTP exceptions  | grep for `throw new (NotFoundException\|BadRequestException\|...)`      | `Framework exceptions`         |
| Throws with JSON codes         | grep for `throw new Error(JSON.stringify(`                              | `JSON-stringified error codes` |
| Throws raw strings             | grep for `throw '...'` or `throw "(.*)"`                                | `Raw string errors`            |
| Auto-retry on transient errors | grep for `retry`, `withTransaction`                                     | `Native exceptions + retry`    |

### Step 2: Write Check Patterns

For each strategy, write the EXACT code the LLM should use:

```typescript
// Return-value boolean → check success
if (!result.success) { /* handle result.error */ }

// OOP hierarchy → instanceof check
if (error instanceof HttpError) { /* handle error.statusCode */ }

// JSON codes → parse the message
try { ... } catch (e) { const code = JSON.parse(e.message).code; }

// Framework exceptions → type-specific catch
try { ... } catch (e) { if (e instanceof NotFoundException) { ... } }
```

### Step 3: Write Throw Patterns

Document exactly what the component produces:

- `Returns { success: false, error: string }, never throws`
- `throw new NotFoundError(msg, url) or createHttpError(404, ...)`
- `throw new Error(JSON.stringify({ code, message }))`
- `throw new UnauthorizedException(...)`

### Step 4: Group by Strategy Family

Sort rows to group similar strategies together. The "Rule of thumb" heuristic should emerge naturally from the grouping.

### Step 5: Add Cross-References

Below the table, link to relevant architecture and external services sections.

## Template

```markdown
## Error Handling Patterns

Each {{COMPONENT_TYPE}} uses a different error strategy. Know which to catch.

| Component | Strategy | Check Pattern | Throw Pattern |
| --------- | -------- | ------------- | ------------- |

{{ERROR_ROWS}}

> **Rule of thumb:** If the {{COMPONENT_TYPE}} returns `{ success: boolean }`, check it. If it throws, `try/catch` it.

> **Related:** [§{{ARCH_SECTION}} Architecture](#{{ARCH_ANCHOR}}), [§{{SERVICES_SECTION}} External Services](#{{SERVICES_ANCHOR}})
```

## Real Example from nestJs-boilerplate

From `AGENTS.md` of a NestJS 11 monorepo with 6 different error strategies.

## 7. Error Handling Patterns

Each package uses a different error strategy. Know which to catch.

| Package           | Strategy                     | Check Pattern                                     | Throw Pattern                                                      |
| ----------------- | ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| @common/ai        | `AIResponse.success` boolean | `if (!result.success) { result.error }`           | Returns `{ success: false, error: string }`, never throws          |
| @common/documents | JSON-stringified error codes | `JSON.parse(error.message).code`                  | `throw new Error(JSON.stringify({ code, message }))`               |
| @common/http      | OOP class hierarchy          | `error instanceof HttpError` / `error.statusCode` | `throw new NotFoundError(msg, url)` or `createHttpError(404, ...)` |
| @common/database  | Native exceptions + retry    | `try/catch` — transient errors auto-retried       | `throw new NotFoundException(...)` from NestJS                     |
| @common/auth      | NestJS HTTP exceptions       | `try/catch` with `UnauthorizedException`          | `throw new UnauthorizedException(...)`                             |
| dynamic-schema    | Error code strings           | `if (!result.success) { result.error }`           | Returns `{ success: false, error: 'SCHEMA_GENERATION_ERROR' }`     |

> **Rule of thumb:** If the package returns `{ success: boolean }`, check it. If it throws, `try/catch` it.

> **Related:** [§2 Architecture](#2-architecture--data-flow), [§8 External Services](#8-external-services)

**Key observations from this example:**

1. **6 strategies in one project**: Two packages return `{ success }`, two throw framework exceptions, one uses JSON error codes, one uses OOP hierarchy — without this table, an LLM would guess wrong half the time.
2. **Check patterns are actual code**: `JSON.parse(error.message).code` and `error instanceof HttpError` are copy-pasteable. Not pseudocode.
3. **"Never throws" is explicit**: For `@common/ai`, the table says `never throws` because the LLM might otherwise assume async functions throw. This prevents unnecessary try/catch wrapping.
4. **Throw and check are linked**: The check pattern matches the throw pattern. If a package throws `JSON.stringify(...)`, the check uses `JSON.parse(...)`. If a package returns `{ success }`, the check tests `result.success`.
5. **App modules included**: `dynamic-schema` is an app module (not a reusable package) but has its own error strategy — it's included because the LLM might call it.
6. **"Rule of thumb" as decision shortcut**: The LLM doesn't need to memorize 6 rows. It learns the binary heuristic: check booleans, catch throws.
