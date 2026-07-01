# http-error-download Specification

## Purpose

Specifies what the AGENTS.md documentation MUST teach an AI agent about the `@common/http` package: the `HttpError` class hierarchy (7 error classes + `createHttpError` factory) and the `DownloadService` with `file()`, `image()`, and `video()` methods.

## Requirements

### Requirement: HttpError Hierarchy

The documentation MUST list all 7 `HttpError` subclasses and their status codes: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `TimeoutError` (408), `InternalServerError` (500), `ServiceUnavailableError` (503). It MUST describe the base `HttpError` constructor: `(statusCode, statusText, message, url, data?)`.

#### Scenario: Agent identifies the correct error class for a status code

- GIVEN an agent reads the HttpError section
- WHEN the agent needs to throw or catch an HTTP error by status code
- THEN the doc SHALL present a table of status → error class mappings
- AND SHALL show that each subclass pre-fills `statusCode` and `statusText` in its constructor

#### Scenario: Agent uses the HttpError.toJSON() method

- GIVEN an agent needs to serialize an HttpError for logging or API response
- WHEN the agent reads the HttpError API documentation
- THEN the doc SHALL show `error.toJSON()` returning `{ status, statusText, url, message, data }`

### Requirement: createHttpError Factory

The documentation MUST describe `createHttpError(status, message, url, data?)` as a factory function that returns the appropriate `HttpError` subclass based on the status code, falling back to `InternalServerError` for unknown codes.

#### Scenario: Agent creates errors dynamically from HTTP response codes

- GIVEN an agent processes upstream API responses with variable status codes
- WHEN the agent reads the createHttpError documentation
- THEN the doc SHALL show `createHttpError(404, 'Not found', url)` returning a `NotFoundError` instance
- AND SHALL show `createHttpError(418, 'Teapot', url)` returning an `InternalServerError` (fallback)

### Requirement: DownloadService API

The documentation MUST describe `DownloadService` with 3 methods and their download contract: each returns `Promise<{ filepath: string, size: number, filename: string }>` and throws typed `HttpError` on failure.

#### Scenario: Agent downloads a generic file

- GIVEN an agent needs to download a file from a URL
- WHEN the agent reads the DownloadService.file() documentation
- THEN the doc SHALL show `await downloadService.file(url, { folder, filename, headers })`
- AND SHALL document the `DownloadOptions` interface (`folder?`, `filename?`, `headers?`)

#### Scenario: Agent downloads and optimizes an image

- GIVEN an agent needs to download an image with Sharp optimization
- WHEN the agent reads the DownloadService.image() documentation
- THEN the doc SHALL show `await downloadService.image(url, { optimize: { quality: 80, width: 800, format: 'webp' } })`
- AND SHALL document `ImageOptimizationOptions` (`quality?`, `width?`, `height?`, `format?`)
- AND SHALL note that `format` defaults to `'webp'`

#### Scenario: Agent downloads a video

- GIVEN an agent needs to download a video file
- WHEN the agent reads the DownloadService.video() documentation
- THEN the doc SHALL state that `video()` delegates to `file()` with identical behavior
- AND SHALL explain it exists as a semantic alias

### Requirement: Module Registration

The documentation MUST show how to import `HttpModule` from `@common/http` in a NestJS `AppModule`, including the `HttpModule.register()` or `HttpModule.registerAsync()` pattern if applicable.

#### Scenario: Agent integrates HttpModule

- GIVEN an agent needs HTTP download capabilities in a NestJS app
- WHEN the agent reads the module registration section
- THEN the doc SHALL show the import path `@common/http` for `HttpModule`
- AND SHALL document any configuration options (base URL, timeouts, etc.)
