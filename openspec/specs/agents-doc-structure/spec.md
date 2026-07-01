# agents-doc-structure Specification

## Purpose

AGENTS.md document organization for AI agent discoverability: capability matrix, architecture context, module patterns, error strategies, cross-reference navigation.

## Requirements

### Requirement: Capability Matrix

AGENTS.md MUST contain a package capability table within its first 100 lines. Each of the 10 shared packages SHALL have a row with: package name, one-line purpose, and 2–4 key exports.

#### Scenario: Agent discovers package purpose immediately

- GIVEN an AI agent opens AGENTS.md
- WHEN the agent reads the first 100 lines
- THEN it finds a table row "`@common/ai` | AI provider wrapper | `AiModule`, `AiService`"
- AND every shared package appears in its own row

#### Scenario: Agent locates a specific export

- GIVEN the agent needs `JwtAuthGuard`
- WHEN it scans the Capability Matrix
- THEN the `auth` row lists `AuthModule, JwtAuthGuard, RolesGuard, Public, Roles`
- AND the agent navigates to section §2 (Using Shared Packages) for import syntax

### Requirement: Architecture & Data Flow

AGENTS.md SHALL document inter-package dependency flows after Project Overview. The section MUST show which packages depend on others, SHALL flag app modules consuming multiple packages (e.g., `dynamic-schema` → `ai` + `documents`), and SHOULD use directional indicators.

#### Scenario: Agent understands dependency chain

- GIVEN the agent reads the Architecture section
- WHEN it examines `dynamic-schema`
- THEN it sees `dynamic-schema` depends on `@common/ai` and `@common/documents`
- AND dependency direction (consumer → provider) is unambiguous

#### Scenario: Agent identifies stand-alone packages

- GIVEN the agent needs an extractable package with zero project-internal dependencies
- WHEN it reads the Architecture section
- THEN packages like `@common/common` show no incoming edges from other project packages

### Requirement: Module Patterns

AGENTS.md SHALL document two module directory structures: **flat** (`usuarios/` — controller, service, repository at root) and **services/ subdirectory** (`dynamic-schema/` — `services/` for multi-service logic). The section MUST state when to use each: flat for single-service CRUD, services/ for multi-service orchestrators.

#### Scenario: Agent creates a single-service CRUD module

- GIVEN the agent builds a new `productos/` module
- WHEN it reads Module Patterns
- THEN it adopts flat: `productos.controller.ts`, `productos.service.ts`, `productos.repository.ts` at root
- AND services/ subdirectory is documented as unnecessary here

#### Scenario: Agent creates a multi-service module

- GIVEN the agent builds a complex module with multiple internal services
- WHEN it reads Module Patterns
- THEN it chooses services/ subdirectory for orchestrators
- AND keeps module + controller + public service at root

### Requirement: Error Handling Patterns

AGENTS.md SHALL document per-package error strategies: `{success: boolean}` (`@common/ai`), string error codes via `DOCUMENT_ERROR_CODES` (`@common/documents`), `HttpError` class hierarchy + `createHttpError` factory (`@common/http`), MongoDB retry-on-transient via `DatabaseExceptionFilter` (`@common/database`). Each entry SHOULD include a one-line example.

#### Scenario: Agent handles AI failure

- GIVEN `aiService.generateText()` returns `{success: false, error: "..."}`
- WHEN the agent reads Error Handling
- THEN the `@common/ai` entry documents `{success: boolean}`
- AND the agent checks `response.success` before accessing `response.data`

#### Scenario: Agent handles HTTP failure

- GIVEN an HTTP request fails with 404
- WHEN the agent consults Error Handling
- THEN it sees `NotFoundError extends HttpError`
- AND catches `HttpError` rather than generic `Error`

### Requirement: Cross-reference Index

Every major section boundary in AGENTS.md SHALL include "Related Sections:" links to at least one other section. References MUST use exact header text for text-search jump. Capability Matrix entries SHALL link to their detailed documentation sections.

#### Scenario: Agent navigates from matrix to service docs

- GIVEN the agent reads Capability Matrix for `@common/database`
- WHEN it needs transaction API details
- THEN cross-reference reads "Related: §6 External Services → @common/database"
- AND the agent text-searches the header to jump directly

#### Scenario: Agent cross-navigates from error patterns

- GIVEN the agent reads Error Handling for `@common/http`
- WHEN it needs the full HTTP API
- THEN cross-reference points to "Related: §2 Using Shared Packages, §6 External Services → @common/http"
- AND the agent jumps without re-scanning the document

