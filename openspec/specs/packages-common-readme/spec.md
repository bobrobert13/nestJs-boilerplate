# packages-common-readme Specification

## Purpose

Fix `packages/common/README.md` to include a cross-reference note clarifying that the `HttpError` class hierarchy (7 subclasses + `createHttpError` factory) originates in `@common/http` and is re-exported by `@common/common`. The primary definition lives in `@common/http`.

## Requirements

### Requirement: HttpError Cross-Reference Note

The `packages/common/README.md` `## HttpError Hierarchy` section MUST include a note stating that the canonical `HttpError` class hierarchy is defined in `@common/http` and re-exported from `@common/common`. The note SHALL link to `packages/http/README.md`.

#### Scenario: Agent discovers primary HttpError source from common README

- GIVEN an agent reads `packages/common/README.md` seeking HttpError classes
- WHEN the agent reaches the HttpError Hierarchy section
- THEN a blockquote or admonition SHALL state "The canonical HttpError class hierarchy originates in `@common/http`"
- AND a relative link to `../http/README.md` SHALL be present

### Requirement: Complete Subclass List

The HttpError section of `packages/common/README.md` MUST list the same 7 subclasses documented in the `http-error-download` spec: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `TimeoutError` (408), `InternalServerError` (500), `ServiceUnavailableError` (503).

#### Scenario: Agent sees the full 7-class hierarchy in common README

- GIVEN an agent reads the HttpError section in `packages/common/README.md`
- WHEN the agent needs to find the correct error class for a 408 or 503 status
- THEN all 7 subclass names SHALL appear with their status codes
- AND `TimeoutError` (408) and `ServiceUnavailableError` (503) SHALL NOT be missing

### Requirement: Factory Function Reference

The README MUST document `createHttpError(status, message, url, data?)` and SHALL note that it is re-exported from `@common/http`.

#### Scenario: Agent uses createHttpError from @common/common

- GIVEN an agent imports `createHttpError` from `@common/common`
- WHEN the agent reads the documentation
- THEN the doc SHALL state it delegates to the `@common/http` implementation
- AND a fallback behavior description SHALL be present (unknown codes → `InternalServerError`)
