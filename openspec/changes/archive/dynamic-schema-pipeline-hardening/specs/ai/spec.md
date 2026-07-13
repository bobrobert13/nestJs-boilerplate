# AI Specification (delta)

## Purpose

Extiende la spec AI original con soporte para vision multi-provider,
structured-output retry y metadata de fuente para integracion con el modulo
`dynamic-schema`. Ver `openspec/specs/dynamic-schema/spec.md` para el
contrato del modulo consumidor.

## Requirements

### Multi-Provider Vision

The system MUST support image input across vision-capable providers (openai,
anthropic, google) using the provider's native multimodal content format.

#### Scenario: OpenAI vision via image_url content part

- GIVEN a registered OpenAI provider and a base64 image
- WHEN `chat()` is called with `messages: [{role: 'user', content: [{type: 'text', text: 'describe'}, {type: 'image_url', image_url: {url: 'data:image/png;base64,...'}}]}]`
- THEN the request body to OpenAI includes the multimodal content array unchanged.

#### Scenario: Provider without vision returns VISION_NOT_SUPPORTED

- GIVEN a registered provider with `capabilities.vision = false` (moonshot/minimax/custom-default)
- WHEN `chat()` is called with an image content part
- THEN the system returns `{success: false, error: 'VISION_NOT_SUPPORTED', provider, model}`.

### Structured-Output Retry

The system MUST retry JSON parse failures with a more deterministic configuration.

#### Scenario: First attempt uses response_format json_object (OpenAI)

- GIVEN OpenAI provider and a schema-generation prompt
- WHEN the first chat call is issued
- THEN the request body includes `response_format: {type: 'json_object'}`.

#### Scenario: Retry uses temperature 0 and reinforced prompt

- GIVEN the first response is malformed JSON
- WHEN the retry is issued
- THEN the system retries with `temperature: 0` and a system prompt that reasserts the JSON-only contract.

### Schema Source Metadata

The system SHOULD attach a source marker to generated schemas.

#### Scenario: GeneratedSchema includes source metadata

- GIVEN a successful schema generation
- THEN the returned `GeneratedSchema.metadata.source` is set to one of: `text`, `image`, `document`.

## Affected Documentation

- `packages/ai/README.md` (section Vision multi-provider)
- `openspec/specs/ai/spec.md` (this file, additive only)
