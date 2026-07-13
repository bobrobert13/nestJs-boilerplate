# Common Specification (NEW)

## Purpose

Utilidades transversales: `BaseAdapter<T>` para mapeo de datos externos,
`HttpError` jerárquico para manejo de errores HTTP, y
`DatabaseExceptionFilter` para respuestas consistentes ante errores de MongoDB.

Documentación asociada: `packages/common/README.md`

## Requirements

### BaseAdapter Interface

The system MUST provide a generic adapter interface for transforming raw data
into typed domain models.

#### Scenario: Adapt single object

- GIVEN a `BaseAdapter<UserOutput>` implementation
- WHEN `adapter.adapt({ id: 1, name: ''Alice'' })` is called
- THEN the system returns a typed `UserOutput` object

#### Scenario: Adapt array of objects

- GIVEN an array of raw records
- WHEN `adapter.adapt([{...}, {...}])` is called
- THEN the system returns an array of typed objects

#### Scenario: Field mapping with custom rules

- GIVEN a `DataMapping[]` with source/target field definitions
- WHEN `adapter.mapFields(rawData, mappings)` is called
- THEN the system returns a `Partial<TOutput>` with mapped fields

### DatabaseExceptionFilter

The system MUST catch MongoDB/Mongoose errors and return standardized HTTP
responses with appropriate status codes.

#### Scenario: Duplicate key error (11000)

- GIVEN a MongoDB unique constraint violation (error code 11000)
- WHEN the exception is caught by `DatabaseExceptionFilter`
- THEN the system returns HTTP 409 Conflict with structured error body

#### Scenario: Host unreachable (error 14)

- GIVEN a MongoDB network error (code 14)
- WHEN the exception is caught
- THEN the system returns HTTP 503 Service Unavailable

#### Scenario: Unknown database error

- GIVEN a MongoDB error with unmapped code
- WHEN the exception is caught
- THEN the system returns HTTP 500 Internal Server Error with `cause` field

### HttpError Hierarchy

The system MUST provide hierarchical HTTP error classes for precise error
handling across all layers.

#### Scenario: Throw HttpError with status and message

- GIVEN a `throw new HttpError(404, ''Not Found'')` statement
- WHEN the error is caught
- THEN `error.statusCode === 404` and `error.message === ''Not Found''`

#### Scenario: Use specialized error classes

- GIVEN `throw new NotFoundError(''User not found'')`
- WHEN the error propagates
- THEN `error instanceof HttpError` is true and `statusCode === 404`

#### Scenario: Factory function creates errors

- GIVEN `createHttpError(400, ''Bad Request'', ''Invalid email'')`
- WHEN called
- THEN it returns a `BadRequestError` instance with the provided details

## Affected Documentation

- `packages/common/README.md`
- `AGENTS.md` — section 4 (Packages Index)