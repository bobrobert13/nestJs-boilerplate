/** Supported AI provider identifiers. Extensible via custom string. */
export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'moonshot'
  | 'minimax'
  | 'custom'
  | string;

export type ModelType = 'chat' | 'embedding' | 'vision' | 'code';

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ChatMessage {
  role: MessageRole;
  content: string | MessageContentPart[];
  name?: string;
}

/**
 * Multimodal content part. Supports text, OpenAI-style image_url, Anthropic-style
 * image source, and Google-style inline_data. The provider implementation
 * decides which shape to send on the wire.
 */
export type MessageContentPart =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: { url: string; detail?: 'low' | 'high' | 'auto' };
    }
  | {
      type: 'image';
      source: { type: 'base64' | 'url'; media_type: string; data: string };
    }
  | { type: 'inline_data'; inline_data: { mime_type: string; data: string } };

/**
 * Options for chat completion requests.
 * All fields except messages are optional and provider-dependent.
 */
export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  stream?: boolean;
  /**
   * If 'json_object' and the provider supports it (e.g. OpenAI), the response
   * is constrained to valid JSON. Ignored silently on providers that do not
   * understand this field.
   */
  responseFormat?: 'json_object';
}

/**
 * Options for embedding generation requests.
 * @param input - Single text or array of texts to embed
 */
export interface EmbeddingOptions {
  model?: string;
  input: string | string[];
  encodingFormat?: 'float' | 'base64';
  dimensions?: number;
}

/**
 * Standardized response wrapper for all AI operations.
 * Generic type T represents the shape of the data payload.
 */
export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Feature flags indicating what capabilities a provider supports.
 * Used for early rejection of unsupported operations (e.g., vision).
 */
export interface ProviderCapability {
  chat: boolean;
  embeddings: boolean;
  vision: boolean;
  streaming: boolean;
  functionCalling: boolean;
}

/** Supported Mongoose schema field types for dynamic schema generation. */
export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'mixed'
  | 'objectId';

/**
 * Identifies the origin of a generated schema. Used by the dynamic-schema module
 * for observability metrics and provenance tracking.
 */
export type SchemaSource =
  | 'text'
  | 'image'
  | 'document'
  | 'manual'
  | 'json-schema'
  | 'dsl'
  | 'inference';

/**
 * Definition of a single field in a generated Mongoose schema.
 * Supports nested types via items (arrays) and properties (objects).
 */
export interface SchemaFieldDefinition {
  name: string;
  type: SchemaFieldType;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  ref?: string;
  default?: unknown;
  enum?: unknown[];
  validate?: Record<string, unknown>;
  /** Required when type is 'array'. Describes the element type. */
  items?: SchemaFieldDefinition;
  /** Required when type is 'object'. Describes nested fields. */
  properties?: Record<string, SchemaFieldDefinition>;
}

/**
 * Complete generated Mongoose schema definition.
 * Produced by AI schema generation from text, images, or documents.
 */
export interface GeneratedSchema {
  fields: SchemaFieldDefinition[];
  collectionName: string;
  metadata?: Record<string, unknown>;
  /** Origin of the schema. Set by adapters when producing the schema. */
  source?: SchemaSource;
  /** Whether to add timestamps (default true). */
  timestamps?: boolean;
  /** Mongoose schema-level options. */
  options?: {
    strict?: boolean;
    versionKey?: boolean;
    minimize?: boolean;
  };
}

/** Optional parameters for schema generation requests. */
export interface SchemaGenerationOptions {
  temperature?: number;
  model?: string;
}
