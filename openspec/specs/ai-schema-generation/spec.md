# ai-schema-generation Specification

## Purpose

Specifies what the AGENTS.md and packages/ai/README.md documentation MUST teach an AI agent about `AiService.generateSchemaFromImage()` and `AiService.generateSchemaFromText()` — two AI-driven methods that produce `GeneratedSchema` objects from image data or text content.

## Requirements

### Requirement: Method Signatures

The documentation MUST include complete TypeScript signatures for both methods: `generateSchemaFromImage(providerName: string, imageData: string, options?: SchemaGenerationOptions): Promise<AIResponse<GeneratedSchema>>` and `generateSchemaFromText(providerName: string, text: string, options?: SchemaGenerationOptions): Promise<AIResponse<GeneratedSchema>>`.

#### Scenario: Agent locates method signatures

- GIVEN an agent reads the ai-schema section in AGENTS.md or packages/ai/README.md
- WHEN the agent searches for schema generation capabilities
- THEN the doc SHALL display both method signatures with parameter types
- AND SHALL reference the `SchemaGenerationOptions` interface (`temperature?`, `model?`)
- AND SHALL reference the `GeneratedSchema` type (`{ fields: FieldDef[], collectionName: string, metadata: object }`)

### Requirement: Usage Examples

The documentation MUST provide a code example for each method, showing: importing `AiService`, calling the method, handling the `AIResponse<GeneratedSchema>` result (checking `success`), and accessing `data.fields` and `data.collectionName`.

#### Scenario: Agent copies a schema-from-image example

- GIVEN an agent needs to generate a Mongoose schema from an image (invoice, form, ID card)
- WHEN the agent reads the generateSchemaFromImage example
- THEN the example SHALL show passing a base64-encoded image string as `imageData`
- AND SHALL show checking `result.success` before accessing `result.data`
- AND SHALL show accessing `result.data.fields` (array of `{ name, type, required }`)

#### Scenario: Agent copies a schema-from-text example

- GIVEN an agent needs to generate a Mongoose schema from extracted text
- WHEN the agent reads the generateSchemaFromText example
- THEN the example SHALL show passing a text string as the `text` parameter
- AND SHALL show the `collectionName` output used for Mongoose model registration

### Requirement: Error Handling Guidance

The documentation MUST describe the return contract: `AIResponse.success` is `false` when the provider is not found or the AI returns malformed JSON, and the `error` string follows the pattern `SCHEMA_GENERATION_ERROR: {reason}`.

#### Scenario: Agent handles a generation failure

- GIVEN an AI agent calls generateSchemaFromText with an invalid provider name
- WHEN the agent reads the error handling documentation
- THEN the doc SHALL state that `response.success === false` and `response.error` contains a descriptive string
- AND SHALL note that JSON parse failures trigger an automatic retry before returning an error

### Requirement: Cross-Reference to Dynamic Schema

The documentation SHALL cross-reference the `dynamic-schema-module` section, explaining that these AI methods are used internally by `DynamicSchemaService` for the `/dynamic-schema/generate-from-text` and `/dynamic-schema/generate-from-image` endpoints.

#### Scenario: Agent traces the full pipeline

- GIVEN an agent reads both the ai-schema and dynamic-schema sections
- WHEN the agent wants to understand how AI schema generation connects to the REST API
- THEN the cross-reference SHALL link `AiService.generateSchemaFromText()` → `/dynamic-schema/generate-from-text`
- AND link `AiService.generateSchemaFromImage()` → `/dynamic-schema/generate-from-image`
