import {
  AIConfig,
  ChatCompletionOptions,
  EmbeddingOptions,
  AIResponse,
  ProviderCapability,
} from '../types/ai.types';

/**
 * Core interface for AI provider implementations.
 * Each provider wraps a specific LLM API (OpenAI, Anthropic, Google, etc.)
 * and exposes a unified chat/embeddings interface.
 */
export interface IAIProvider {
  /** Provider identifier (e.g., 'openai', 'anthropic', 'google') */
  name: string;
  /** Provider configuration including model and API settings */
  config: AIConfig;
  /** Feature flags indicating what this provider supports */
  capabilities: ProviderCapability;

  /**
   * Send a chat completion request.
   * @param options - Chat messages and generation parameters
   * @returns AIResponse with choices and usage data
   */
  chat(options: ChatCompletionOptions): Promise<AIResponse>;

  /**
   * Stream a chat completion, invoking onChunk for each response piece.
   * @param options - Chat messages and generation parameters
   * @param onChunk - Callback invoked with each streaming chunk
   */
  chatStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: AIResponse) => void,
  ): Promise<void>;

  /**
   * Generate embedding vectors for text input(s).
   * @param options - Text input(s) and embedding parameters
   * @returns AIResponse with embedding vectors and usage data
   */
  embeddings(options: EmbeddingOptions): Promise<AIResponse>;

  /**
   * Validate that the provider configuration is usable.
   * @returns true if configuration is valid, false otherwise
   */
  validateConfig(): boolean;
}

/**
 * Factory interface for creating and managing AI provider instances.
 */
export interface IProviderFactory {
  /**
   * Create a new provider instance from configuration.
   * @param config - Provider configuration
   * @returns Configured IAIProvider instance
   */
  createProvider(config: AIConfig): IAIProvider;

  /**
   * Get a provider by name.
   * @param name - Provider identifier
   * @returns Provider instance or null if not found
   */
  getProvider(name: string): IAIProvider | null;

  /**
   * List all registered provider names.
   * @returns Array of provider name strings
   */
  listProviders(): string[];
}