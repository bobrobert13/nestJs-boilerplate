import {
  AIConfig,
  ChatCompletionOptions,
  EmbeddingOptions,
  AIResponse,
  ProviderCapability,
} from '../types/ai.types';

/**
 * Contract that every AI provider must implement.
 * Provides chat, streaming, and embedding operations.
 */
export interface IAIProvider {
  /** Unique provider name identifier */
  name: string;
  /** Provider configuration (model, API key, base URL) */
  config: AIConfig;
  /** Supported capabilities for this provider */
  capabilities: ProviderCapability;

  /**
   * Send a chat completion request.
   * @param options - Chat completion options including messages and model
   * @returns Promise resolving to a standardized AIResponse
   */
  chat(options: ChatCompletionOptions): Promise<AIResponse>;

  /**
   * Stream chat completions chunk by chunk.
   * @param options - Chat completion options with stream implicitly enabled
   * @param onChunk - Callback invoked for each streaming chunk
   */
  chatStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: AIResponse) => void,
  ): Promise<void>;

  /**
   * Generate embeddings for input text(s).
   * @param options - Embedding options including input text and model
   * @returns Promise resolving to AIResponse with embedding vectors
   */
  embeddings(options: EmbeddingOptions): Promise<AIResponse>;

  /**
   * Validate that the provider is correctly configured.
   * @returns true if the configuration is valid
   */
  validateConfig(): boolean;
}

/**
 * Factory interface for creating and managing AI providers.
 */
export interface IProviderFactory {
  /**
   * Create and register a new provider.
   * @param config - Provider configuration
   * @returns The created IAIProvider instance
   */
  createProvider(config: AIConfig): IAIProvider;

  /**
   * Get a provider by name.
   * @param name - Provider name identifier
   * @returns The provider instance or null if not found
   */
  getProvider(name: string): IAIProvider | null;

  /**
   * List all registered provider names.
   * @returns Array of provider name strings
   */
  listProviders(): string[];
}