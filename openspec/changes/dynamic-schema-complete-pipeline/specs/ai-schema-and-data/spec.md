# Capability: ai-schema-and-data

## Purpose

Specifies `AiService.generateSchemaAndData`, a token-efficient AI method that produces both a `GeneratedSchema` and the matching data values in a single LLM call. The method replaces the previous two-call pattern (`generateSchemaFromText` followed by a separate data-extraction call) used by `DynamicSchemaService.fullPipeline`. The return type wraps the result in `AIResponse<...>` and follows the package's standard `success: boolean` contract.

## Requirements

### Requirement: Method Signature

`packages/ai/src/ai.service.ts` MUST export a method `generateSchemaAndData(providerName: string, text: string, options?: SchemaGenerationOptions): Promise<AIResponse<{ schema: GeneratedSchema; data: Record<string, unknown> }>>`. The method MUST be available on the `AiService` injected by `DynamicSchemaService` and any other consumer. The existing `generateSchemaFromImage` and `generateSchemaFromText` methods MUST be left unchanged.

#### Scenario: Agent locates the new method on AiService

- GIVEN an agent reads the `@common/ai` documentation
- WHEN the agent searches for "schema and data"
- THEN the documentation SHALL show the `generateSchemaAndData` signature
- AND SHALL reference `SchemaGenerationOptions` (`temperature?`, `model?`)
- AND SHALL state the return type wraps `{ schema: GeneratedSchema; data: Record<string, unknown> }` in `AIResponse<...>`

#### Scenario: Existing methods are not regressed

- GIVEN the new method is added
- WHEN the agent reads the public surface of `AiService`
- THEN `generateSchemaFromText` and `generateSchemaFromImage` SHALL still be exported with their original signatures
- AND no existing caller SHALL fail type-check

### Requirement: Single LLM Call

`generateSchemaAndData` MUST issue exactly one LLM call per invocation. The call MUST request JSON output (`response_format: { type: 'json_object' }` for OpenAI-compatible providers) and MUST prompt the model for an object with two top-level keys: `schema` (matching the `GeneratedSchema` shape) and `data` (an object whose keys correspond to the schema's field names). The method MUST NOT issue a follow-up call to "fill in" the data after parsing the schema.

#### Scenario: Agent verifies one LLM call in a unit test

- GIVEN a mocked provider that records the number of `chat` calls
- WHEN the agent calls `generateSchemaAndData('openai', 'invoice text')`
- THEN the provider SHALL be called exactly once

#### Scenario: Agent inspects the prompt

- GIVEN a recorded LLM call
- WHEN the agent reads the prompt
- THEN the prompt SHALL explicitly request `{ schema, data }` as a JSON object
- AND SHALL instruct the model that `data` keys MUST match `schema.fields[].name`

### Requirement: Failure Modes

`generateSchemaAndData` MUST return `AIResponse.success === false` and MUST NOT throw when:
- The provider name is unknown (`error` code: `SCHEMA_GENERATION_ERROR: Unknown provider`).
- The LLM returns malformed JSON that cannot be parsed as `{ schema, data }` (`error` code: `SCHEMA_GENERATION_ERROR: Malformed JSON`).
- The parsed `schema` is missing the `fields` array or `collectionName` (`error` code: `SCHEMA_GENERATION_ERROR: Invalid schema format`).
- The parsed `data` is not an object (`error` code: `SCHEMA_GENERATION_ERROR: Invalid data format`).

A successful parse with a valid `schema` and a valid (object) `data` MUST return `{ success: true, data: { schema, data } }`.

#### Scenario: Unknown provider returns a failed response

- GIVEN the agent calls `generateSchemaAndData('does-not-exist', 'text')`
- WHEN the service resolves the provider
- THEN the response SHALL be `{ success: false, error: 'SCHEMA_GENERATION_ERROR: Unknown provider' }`
- AND no LLM call SHALL be issued

#### Scenario: Malformed JSON returns a failed response

- GIVEN the mocked LLM returns `'not valid json'`
- WHEN the service parses the response
- THEN the response SHALL be `{ success: false, error: 'SCHEMA_GENERATION_ERROR: Malformed JSON' }`

#### Scenario: Invalid schema format returns a failed response

- GIVEN the LLM returns `{ schema: 'not an object', data: {} }`
- WHEN the service validates the parsed response
- THEN the response SHALL be `{ success: false, error: 'SCHEMA_GENERATION_ERROR: Invalid schema format' }`

#### Scenario: Invalid data format returns a failed response

- GIVEN the LLM returns `{ schema: { fields: [...], collectionName: 'x' }, data: 'not an object' }`
- WHEN the service validates the parsed response
- THEN the response SHALL be `{ success: false, error: 'SCHEMA_GENERATION_ERROR: Invalid data format' }`

#### Scenario: Successful parse returns a successful response

- GIVEN the LLM returns a valid `{ schema: { fields: [...], collectionName: 'x' }, data: { ... } }`
- WHEN the service parses the response
- THEN the response SHALL be `{ success: true, data: { schema, data } }`

### Requirement: Data Type Validation Against Schema (Warning, Not Failure)

After a successful parse, the service MUST validate each top-level key in `data` against the corresponding `schema.fields[].type`. If a value's runtime type does not match the declared type (e.g., `data.amount = '100'` when `schema.fields.amount.type = 'number'`), the service MUST log a warning identifying the field, the expected type, and the actual type. The response MUST still be `{ success: true, data: { schema, data } }` — type mismatches are a LLM-hallucination problem the caller decides how to handle (drop the field, coerce, or 422). The validation MUST NOT throw.

#### Scenario: Agent observes a warning for a type mismatch

- GIVEN the LLM returns `data: { amount: '100' }` and `schema.fields: [{ name: 'amount', type: 'number' }]`
- WHEN the service validates types
- THEN a warning SHALL be logged: `'Field "amount" expected number, got string'`
- AND the response SHALL be `{ success: true, data: { schema, data: { amount: '100' } } }`

#### Scenario: Agent observes no warning on a perfect match

- GIVEN `data: { amount: 100 }` matches `schema.fields: [{ name: 'amount', type: 'number' }]`
- WHEN the service validates types
- THEN no warning SHALL be logged
- AND the response SHALL be `{ success: true, data: { schema, data: { amount: 100 } } }`

#### Scenario: Agent observes a warning for an unknown field

- GIVEN `data: { invoiceNumber: 'INV-001', unknown: 'x' }` and a schema with only `invoiceNumber`
- WHEN the service validates types
- THEN a warning SHALL be logged for `unknown`: `'Field "unknown" not in schema'`
- AND the response SHALL be `{ success: true, data: { schema, data: { invoiceNumber: 'INV-001', unknown: 'x' } } }`
- (The downstream `SanitizationService` and the PATCH endpoint will reject unknown fields at the controller boundary; the AI service is a thin wrapper.)

### Requirement: Cross-Reference to Dynamic Schema

The documentation MUST cross-reference the `dynamic-schema-module` and `dynamic-schema-ingestion` capabilities: `generateSchemaAndData` is the method called by `DynamicSchemaService.fullPipeline`. The output is the input to `SchemaCompilerService.compileSchemaAndData` and to the seed-document assembler.

#### Scenario: Agent traces data flow

- GIVEN the agent reads the ai-schema-and-data section
- WHEN the agent wants to understand what consumes the result
- THEN the cross-reference SHALL link `AiService.generateSchemaAndData` → `DynamicSchemaService.fullPipeline` → seed insert → `POST /dynamic-schema/pipeline`
