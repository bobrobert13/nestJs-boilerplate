# AI Specification

## Purpose

Wrapper multi-provider para servicios de AI (OpenAI, Anthropic, Gemini, Moonshot, MiniMax, y cualquier API compatible con OpenAI).

Documentación asociada: `packages/ai/README.md`

## Requirements

### Multi-Provider Chat

The system MUST support chat completions across multiple AI providers through a unified interface.

#### Scenario: Chat with OpenAI

- GIVEN a configured OpenAI API key
- WHEN `AiService.chat('openai', messages)` is called
- THEN the system returns a chat completion from OpenAI GPT-4o

#### Scenario: Chat with Anthropic

- GIVEN a configured Anthropic API key
- WHEN `AiService.chat('anthropic', messages)` is called
- THEN the system returns a chat completion from Claude 3.5 Sonnet

### Text Generation

The system MUST support single-prompt text generation with optional system prompt.

#### Scenario: Generate text with system prompt

- GIVEN a provider key and a prompt
- WHEN `AiService.generateText(provider, prompt, systemPrompt)` is called
- THEN the system returns generated text content

### Schema Generation

The system MUST generate Mongoose schemas from natural language descriptions.

#### Scenario: Generate schema from description

- GIVEN a description like "User with name and email"
- WHEN `AiService.generateSchema(provider, description)` is called
- THEN the system returns a valid Mongoose schema definition

### Template Generation

The system MUST generate HTML, email, JSON, and code templates from descriptions.

#### Scenario: Generate email template

- GIVEN a description of the email content
- WHEN `AiService.generateTemplate(provider, 'email', description)` is called
- THEN the system returns an HTML email template

### Custom Provider Registration

The system MUST allow registering custom OpenAI-compatible providers at runtime.

#### Scenario: Register local provider

- GIVEN a local Ollama instance at localhost:11434
- WHEN `AiService.registerProvider({ provider: 'ollama', baseUrl: 'http://localhost:11434/v1' })` is called
- THEN the system can use 'ollama' as a provider

### Embeddings

The system SHOULD support generating embeddings from any provider.

#### Scenario: Generate embedding

- GIVEN a text string
- WHEN `AiService.createEmbedding(provider, text)` is called
- THEN the system returns an embedding vector

## Affected Documentation

- `packages/ai/README.md`
- `AGENTS.md` — section 3 (Packages Index)


---

## Vision Source Path (delta)

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
