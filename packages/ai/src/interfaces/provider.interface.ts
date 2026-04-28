import {
  AIConfig,
  ChatCompletionOptions,
  EmbeddingOptions,
  AIResponse,
  ProviderCapability,
} from '../types/ai.types';

export interface IAIProvider {
  name: string;
  config: AIConfig;
  capabilities: ProviderCapability;

  chat(options: ChatCompletionOptions): Promise<AIResponse>;
  chatStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: AIResponse) => void,
  ): Promise<void>;

  embeddings(options: EmbeddingOptions): Promise<AIResponse>;

  validateConfig(): boolean;
}

export interface IProviderFactory {
  createProvider(config: AIConfig): IAIProvider;
  getProvider(name: string): IAIProvider | null;
  listProviders(): string[];
}