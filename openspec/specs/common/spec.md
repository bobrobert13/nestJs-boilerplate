# Common Specification

## Purpose

Utilidades transversales para todos los modulos del monorepo. Provee:

- **`BaseAdapter<TOutput>`**: interface para mapear datos externos (API responses, payloads, etc.) hacia modelos de dominio tipados.
- **`DatabaseExceptionFilter`**: filtro global de NestJS que captura excepciones de MongoDB/Mongoose y devuelve respuestas HTTP estandarizadas.
- **`HttpError` jerarquico**: clases de error tipadas con statusCode, statusText, message, url y data opcional.

Documentacion asociada: `packages/common/README.md`, `AGENTS.md` (seccion 4).

## Requirements

### BaseAdapter Interface

The system MUST provide a generic adapter interface for transforming raw data into typed domain models. The interface MUST allow both single-object and array inputs.

#### Scenario: Adapt a single object

- GIVEN a class implementing `BaseAdapter<UserOutput>`
  - AND a raw object `{ id: 1, name: "Alice" }`
- WHEN `adapter.adapt(rawObject)` is called
- THEN the system returns a typed `UserOutput` object

#### Scenario: Adapt an array of objects

- GIVEN a class implementing `BaseAdapter<UserOutput>`
  - AND an array `[{ id: 1 }, { id: 2 }]`
- WHEN `adapter.adapt(array)` is called
- THEN the system returns an array of typed `UserOutput[]`

#### Scenario: Field mapping with DataMapping[]

- GIVEN a `DataMapping[]` array with `source` and `target` field definitions
  - AND raw data `{ legacy_name: "Alice" }`
- WHEN `adapter.mapFields(rawData, mappings)` is called
- THEN the system returns a `Partial<TOutput>` with `target` field populated from `source`

### DatabaseExceptionFilter

The system MUST catch MongoDB/Mongoose connection errors and return HTTP 503, while letting other errors propagate as NestJS HttpException or generic 500 responses.

#### Scenario: MongooseServerSelectionError becomes 503

- GIVEN a MongoDB connection error of type `MongooseServerSelectionError`
- WHEN the filter catches the exception
- THEN the system returns HTTP 503 with `message: "Database service is temporarily unavailable"`

#### Scenario: MongoNetworkError becomes 503

- GIVEN a MongoDB connection error of type `MongoNetworkError`
- WHEN the filter catches the exception
- THEN the system returns HTTP 503 with structured error body

#### Scenario: HttpException propagates unchanged

- GIVEN an exception that is an instance of `HttpException`
- WHEN the filter catches it
- THEN the system calls `exception.getStatus()` and returns its body without modification

#### Scenario: Unknown Error becomes 500

- GIVEN a generic JavaScript `Error` (non-Mongo, non-HttpException)
- WHEN the filter catches it
- THEN the system logs the error and returns HTTP 500

### HttpError Hierarchy

The system MUST provide hierarchical HTTP error classes with predefined status codes. All classes MUST extend `HttpError` and have a `toJSON()` method returning `HttpErrorResponse`.

#### Scenario: Throw specialized NotFoundError

- GIVEN `throw new NotFoundError("User not found", "/users/123")`
- WHEN the error propagates
- THEN `error instanceof HttpError` is true
  - AND `error.statusCode === 404`
  - AND `error.message === "User not found"`

#### Scenario: toJSON serializes to HttpErrorResponse

- GIVEN a `NotFoundError` instance
- WHEN `error.toJSON()` is called
- THEN the result has keys `status`, `statusText`, `url`, `message`, `data`

#### Scenario: createHttpError factory returns typed instance

- GIVEN `createHttpError(400, "Invalid email", "/auth/register")`
- WHEN the function executes
- THEN it returns a `BadRequestError` instance with `statusCode === 400`

#### Scenario: createHttpError falls back to InternalServerError

- GIVEN `createHttpError(999, "Unknown", "/x")` (status code without registered class)
- WHEN the function executes
- THEN it returns an `InternalServerError` instance with `statusCode === 500`

## Affected Documentation

- `packages/common/README.md`
- `AGENTS.md` — section 4 (Packages Index)
- `openspec/specs/documentation/spec.md` (cross-cutting quality bar)
