/** Supported AI provider identifiers. Use a known key or any string for custom providers. */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'moonshot' | 'minimax' | 'custom' | string;

/** Model capability categories. */
export type ModelType = 'chat' | 'embedding' | 'vision' | 'code';

/** Chat message role following OpenAI-compatible convention. */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** Configuration for registering an AI provider. */
export interface AIConfig {
  /** Provider identifier (e.g. 'openai', 'anthropic', or custom name) */
  provider: AIProvider;
  /** Model name used for requests */
  model: string;
  /** API key for the provider. Omit for local/proxy endpoints. */
  apiKey?: string;
  /** Base URL for the provider API (used for proxies or non-standard endpoints) */
  baseUrl?: string;
}

/** A single chat message with role and content. */
export interface ChatMessage {
  /** Message role: system, user, assistant, or tool */
  role: MessageRole;
  /** Message content string */
  content: string;
  /** Optional name field (for tool/function messages) */
  name?: string;
}

/** Options for chat completion requests. */
export interface ChatCompletionOptions {
  /** Override the default model for this request */
  model?: string;
  /** Array of chat messages forming the conversation */
  messages: ChatMessage[];
  /** Sampling temperature (0.0-2.0). Lower = more deterministic. */
  temperature?: number;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Nucleus sampling parameter */
  topP?: number;
  /** Frequency penalty (-2.0 to 2.0) */
  frequencyPenalty?: number;
  /** Presence penalty (-2.0 to 2.0) */
  presencePenalty?: number;
  /** Stop sequences */
  stop?: string | string[];
  /** Enable streaming response */
  stream?: boolean;
}

/** Options for embedding requests. */
export interface EmbeddingOptions {
  /** Override the default embedding model */
  model?: string;
  /** Text input(s) to embed */
  input: string | string[];
  /** Encoding format for the embedding vectors */
  encodingFormat?: 'float' | 'base64';
  /** Number of dimensions for the output vectors */
  dimensions?: number;
}

/**
 * Standard response envelope for all AI operations.
 * Always check `success` before accessing `data`.
 * @template T - Type of the response data payload
 */
export interface AIResponse<T = unknown> {
  /** Whether the operation completed successfully */
  success: boolean;
  /** Response data payload (undefined on failure) */
  data?: T;
  /** Error message when success is false */
  error?: string;
  /** Provider that handled the request */
  provider: string;
  /** Model used for the request */
  model: string;
  /** Token usage statistics */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>;
}

/** Capabilities supported by a provider. */
export interface ProviderCapability {
  chat: boolean;
  embeddings: boolean;
  vision: boolean;
  streaming: boolean;
  functionCalling: boolean;
}

/** Supported field types for generated MongoDB schemas. */
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

/** Definition of a single field in a generated schema. */
export interface SchemaFieldDefinition {
  /** Field name in camelCase or snake_case */
  name: string;
  /** MongoDB/Mongoose field type */
  type: SchemaFieldType;
  /** Whether the field is required */
  required?: boolean;
  /** Validation rules */
  validate?: Record<string, unknown>;
  /** Default value */
  default?: unknown;
}

/** AI-generated Mongoose schema structure. */
export interface GeneratedSchema {
  /** Array of field definitions */
  fields: SchemaFieldDefinition[];
  /** Suggested MongoDB collection name */
  collectionName: string;
  /** Additional metadata about the generated schema */
  metadata?: Record<string, unknown>;
}

/** Options for schema generation requests. */
export interface SchemaGenerationOptions {
  /** Sampling temperature (0.0-2.0). Lower = more deterministic schemas. */
  temperature?: number;
  /** Override the default model for schema generation */
  model?: string;
}
