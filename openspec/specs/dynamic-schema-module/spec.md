# dynamic-schema-module Specification

## Purpose

Specifies what the AGENTS.md documentation MUST teach an AI agent about the `DynamicSchemaModule` — an AI-powered document-to-Mongoose-schema pipeline with 5 endpoints, 3 services, and dependency on `@common/ai` + `@common/documents`.

## Requirements

### Requirement: Document Structure

The documentation MUST describe the module's file layout: `dynamic-schema.controller.ts` (5 endpoints), `services/dynamic-schema.service.ts` (orchestration), `services/schema-compiler.service.ts` (compilation), `dynamic-schema.repository.ts` (persistence), `schemas/dynamic-schema.schema.ts` (Mongoose schema for generated schemas), and `dto/generate-schema.dto.ts` (request DTOs).

#### Scenario: Agent discovers module files

- GIVEN an AI agent reads the AGENTS.md dynamic-schema section
- WHEN the agent searches for the module's file structure
- THEN the documentation SHALL list all 7 source files with their roles
- AND the import path `@common/dynamic-schema` SHALL be documented

### Requirement: Module Import Contract

The documentation MUST specify the module's NestJS imports (`AiModule`, `DocumentsModule`), providers (`DynamicSchemaService`, `DynamicSchemaRepository`, `SchemaCompilerService`), and the single export (`DynamicSchemaService`).

#### Scenario: Agent integrates the module into AppModule

- GIVEN an agent needs to add DynamicSchema to a NestJS application
- WHEN the agent reads the registration example
- THEN the documentation SHALL show the exact `@Module({ imports: [DynamicSchemaModule] })` pattern
- AND SHALL list required peer dependencies (`@common/ai`, `@common/documents`)

### Requirement: Endpoint Documentation

Each of the 5 endpoints (POST `extract`, `generate-from-text`, `generate-from-image`, `compile`, `pipeline`) MUST be documented with: HTTP method, path, request body shape, response shape, error responses (400), and Swagger `@ApiTags('dynamic-schema')`.

#### Scenario: Agent calls the extract endpoint

- GIVEN an agent reads the endpoint table
- WHEN the agent needs to extract text from a PDF or DOCX document
- THEN the table SHALL show `POST /dynamic-schema/extract` accepts `{ document: base64string, format: 'pdf'|'docx' }`
- AND returns `{ success: true, content: DocumentContent }` or 400 on failure

#### Scenario: Agent calls the pipeline endpoint

- GIVEN an agent reads the pipeline documentation
- WHEN the agent triggers the full document-to-schema pipeline
- THEN the doc SHALL describe the 3-stage flow: extract → generate-schema → compile
- AND SHALL show the combined response shape `{ documentContent, schema, collectionName }`

#### Scenario: Agent encounters an error

- GIVEN the documentation describes error handling
- WHEN any endpoint returns `success: false`
- THEN the doc SHALL explain that `BadRequestException` is thrown with `result.error`
- AND the agent SHALL know to check `response.success` before accessing `response.data`

### Requirement: Service Layer Description

The documentation MUST distinguish `DynamicSchemaService` (orchestrates extraction + AI generation) from `SchemaCompilerService` (compiles `GeneratedSchema` into live Mongoose models at runtime).

#### Scenario: Agent understands service responsibilities

- GIVEN an agent reads the services section
- WHEN the agent needs to know which service to inject
- THEN the doc SHALL state that `DynamicSchemaService` is the public API (exported)
- AND `SchemaCompilerService` is internal (not exported), used only for runtime model registration
