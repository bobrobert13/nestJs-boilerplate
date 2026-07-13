# Delta for ai-schema-generation

> **Scope**: This delta extends the existing `ai-schema-generation` capability (`openspec/specs/ai-schema-generation/spec.md`) with one new method (`AiService.generateSchemaAndData`) and one new optional field on `SchemaFieldDefinition` (`ui?: {...}`). The two existing methods (`generateSchemaFromImage`, `generateSchemaFromText`) are NOT modified — they continue to work and accept the new `ui` field via the parser. The `ai-schema-and-data` and `ai-field-ui-metadata` capabilities carry the new contracts; this delta only links them and explains the parser tolerance.

## MODIFIED Requirements

### Requirement: Method Signatures

The documentation MUST include the complete TypeScript signature for the new method `generateSchemaAndData(providerName: string, text: string, options?: SchemaGenerationOptions): Promise<AIResponse<{ schema: GeneratedSchema; data: Record<string, unknown> }>>` alongside the existing two. The new method MUST be advertised as the recommended path for `DynamicSchemaService.fullPipeline` (which previously called `generateSchemaFromText` and a separate data-extraction call — that pattern is now deprecated in favor of the single-call method).

(Previously: 2 methods (`generateSchemaFromImage`, `generateSchemaFromText`); no single-call alternative.)

#### Scenario: Agent locates the new method signature

- GIVEN an agent reads the ai-schema section
- WHEN the agent searches for the single-call schema-and-data method
- THEN the doc SHALL display the `generateSchemaAndData` signature
- AND SHALL reference the `SchemaGenerationOptions` interface (`temperature?`, `model?`)
- AND SHALL state the return type wraps `{ schema, data }` in `AIResponse<...>`

#### Scenario: Agent reads the deprecation note

- GIVEN an agent looks for the previous two-call pattern
- WHEN the agent reads the method-signatures section
- THEN the doc SHALL note that `generateSchemaFromText` followed by a separate data-extraction call is deprecated
- AND SHALL recommend `generateSchemaAndData` for any caller that needs both

### Requirement: Cross-Reference to Dynamic Schema

The documentation MUST cross-reference the `dynamic-schema-module` section, explaining that `AiService.generateSchemaAndData` is used by `DynamicSchemaService.fullPipeline` for the `POST /dynamic-schema/pipeline` endpoint. The two existing methods continue to be used by `POST /dynamic-schema/generate-from-image` and `POST /dynamic-schema/generate-from-text` (the public, low-cost triage endpoints).

(Previously: only `generateSchemaFromText` and `generateSchemaFromImage` were wired to the dynamic-schema module.)

#### Scenario: Agent traces the full pipeline to the new method

- GIVEN an agent reads both the ai-schema and dynamic-schema sections
- WHEN the agent wants to understand the new ingestion pipeline
- THEN the cross-reference SHALL link `AiService.generateSchemaAndData()` → `DynamicSchemaService.fullPipeline` → `POST /dynamic-schema/pipeline`
- AND SHALL link the unchanged `AiService.generateSchemaFromText()` → `POST /dynamic-schema/generate-from-text`
- AND SHALL link the unchanged `AiService.generateSchemaFromImage()` → `POST /dynamic-schema/generate-from-image`

## ADDED Requirements

### Requirement: Parser Tolerance for the New `ui` Field

The Zod schema and JSON parser used by `generateSchemaFromImage` and `generateSchemaFromText` MUST accept and ignore the optional `ui` field on each `SchemaFieldDefinition`. Parsing a response that includes a `ui` field MUST succeed; parsing a response that omits `ui` MUST also succeed. The LLM is free to include or omit `ui` per field without breaking the parser.

#### Scenario: Agent reads a schema with `ui` fields

- GIVEN the LLM returns a `GeneratedSchema` where one `SchemaFieldDefinition` includes `ui: { widget: 'datepicker' }`
- WHEN the parser deserializes the response
- THEN the parsed `SchemaFieldDefinition.ui` SHALL be present and SHALL equal `{ widget: 'datepicker' }`

#### Scenario: Agent reads a schema without `ui` fields

- GIVEN the LLM returns a `GeneratedSchema` with no `ui` field on any definition
- WHEN the parser deserializes the response
- THEN parsing SHALL succeed and every `SchemaFieldDefinition.ui` SHALL be `undefined`

#### Scenario: Existing callers are not broken

- GIVEN a pre-existing caller of `generateSchemaFromText` does not read `ui`
- WHEN the LLM starts returning `ui` on some fields
- THEN the caller SHALL continue to receive the same `fields[]` shape and SHALL NOT throw
