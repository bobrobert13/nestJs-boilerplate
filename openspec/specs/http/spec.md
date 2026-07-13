# HTTP Specification

## Purpose

Cliente HTTP basado en axios con soporte para descarga y optimizacion de imagenes via sharp. Provee una interfaz tipada con `HttpResponse<T>` y conversion automatica de errores axios a `HttpError` jerarquico.

Documentacion asociada: `packages/http/README.md`, `AGENTS.md` (seccion 4).

## Requirements

### HTTP Requests

The system MUST provide an HTTP client for making external API requests using axios internally, and present a unified `HttpResponse<T>` shape.

#### Scenario: GET request with headers

- GIVEN a configured `HttpService`
  - AND a valid URL `/protected`
  - AND headers `{ Authorization: "Bearer ..." }`
- WHEN `http.get("/protected", headers)` is called
- THEN the system sends a GET request with the provided headers
  - AND returns `HttpResponse<T>` with `data`, `status`, `statusText`, `headers`

#### Scenario: POST request with JSON body

- GIVEN a valid endpoint accepting JSON
- WHEN `http.post("/users", { name: "John", email: "john@x.com" })` is called
- THEN the system sends a POST with serialized body
  - AND returns `HttpResponse<User>` with the created resource

#### Scenario: PUT request replaces entire resource

- GIVEN an existing resource at `/users/1`
- WHEN `http.put("/users/1", { name: "New", email: "new@x.com" })` is called
- THEN the system sends a PUT with the full payload
  - AND returns the updated resource

#### Scenario: PATCH applies partial update

- GIVEN an existing resource at `/users/1`
- WHEN `http.patch("/users/1", { name: "New" })` is called
- THEN the system sends only the partial fields

#### Scenario: DELETE removes resource

- GIVEN an existing resource at `/users/1`
- WHEN `http.delete("/users/1")` is called
- THEN the system sends a DELETE request and returns the confirmation

### Response Normalization

The system MUST normalize axios responses into a consistent shape via `normalizeHeaders`, dropping non-string header values.

#### Scenario: Headers are string-only

- GIVEN an axios response with mixed headers (strings and arrays)
- WHEN `request<T>()` returns
- THEN `response.headers` contains only string values

### Error Mapping from Axios

The system MUST convert raw axios errors into structured `HttpError` instances via `createHttpError`.

#### Scenario: Axios 4xx becomes typed HttpError

- GIVEN a target endpoint returning HTTP 404
- WHEN `http.get("/missing")` is called
- THEN the system throws `HttpError` with `statusCode === 404`

#### Scenario: Non-axios error becomes generic 500

- GIVEN an unexpected non-axios error (e.g., programmer error)
- WHEN `http.request()` catches it
- THEN the system throws `HttpError(500)` with the original message

#### Scenario: Axios error without response uses 500 fallback

- GIVEN an axios error with no `response` property (network failure)
- WHEN `http.request()` catches it
- THEN the system throws `HttpError` with `statusCode === 500` and the axios `message`

### Download Service

The system MUST expose a `DownloadService` via `http.download()` for file and image operations.

#### Scenario: Get DownloadService instance

- GIVEN an `HttpService` instance
- WHEN `http.download()` is called
- THEN a new `DownloadService` sharing the same axios client is returned

### Base URL Configuration

The system MUST allow optional `baseUrl` in the constructor.

#### Scenario: Constructor with baseUrl

- GIVEN `new HttpService("https://api.example.com")`
- WHEN a request like `http.get("/users")` is made
- THEN the axios client prepends the base URL to relative paths

### Default Timeout

The system MUST default to 30000ms timeout if not specified per-request.

#### Scenario: Default timeout applied

- GIVEN an `HttpService` with no per-request timeout
- WHEN a request is sent
- THEN the axios config `timeout` is 30000

#### Scenario: Per-request timeout overrides

- GIVEN `options.timeout = 5000`
- WHEN a request is sent
- THEN the axios config `timeout` is 5000

### Response Type Configuration

The system MUST support `responseType` option (`json`, `arraybuffer`, etc.).

#### Scenario: Default responseType is json

- GIVEN no `responseType` specified
- WHEN a request is sent
- THEN the axios `responseType` is `"json"`

## Affected Documentation

- `packages/http/README.md`
- `AGENTS.md` — section 4 (Packages Index)
