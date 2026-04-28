export type AIProvider = 'openai' | 'anthropic' | 'google' | 'moonshot' | 'minimax' | 'custom' | string;

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
  content: string;
  name?: string;
}

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
}

export interface EmbeddingOptions {
  model?: string;
  input: string | string[];
  encodingFormat?: 'float' | 'base64';
  dimensions?: number;
}

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

export interface ProviderCapability {
  chat: boolean;
  embeddings: boolean;
  vision: boolean;
  streaming: boolean;
  functionCalling: boolean;
}