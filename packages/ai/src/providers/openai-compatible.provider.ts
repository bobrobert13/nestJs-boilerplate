import axios, { AxiosInstance } from 'axios';
import {
  AIConfig,
  ChatCompletionOptions,
  EmbeddingOptions,
  AIResponse,
  ProviderCapability,
} from '../types/ai.types';
import { IAIProvider } from '../interfaces/provider.interface';

/**
 * OpenAI-compatible provider implementation.
 *
 * Handles any API that follows the OpenAI chat completions and embeddings
 * schema (OpenAI, Anthropic via proxy, Ollama, LM Studio, vLLM, etc.).
 *
 * @implements {IAIProvider}
 */
export class OpenAICompatibleProvider implements IAIProvider {
  readonly name: string;
  readonly config: AIConfig;
  readonly capabilities: ProviderCapability;

  protected client: AxiosInstance;

  /**
   * @param config - Provider configuration with model, API key, and optional base URL
   */
  constructor(config: AIConfig) {
    this.name = config.provider;
    this.config = config;

    const baseURL =
      config.baseUrl || this.getDefaultBaseUrl(config.provider, config.apiKey);

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      timeout: 60000,
    });

    this.capabilities = this.getCapabilities(config.provider);
  }

  /**
   * Resolve the default API base URL for well-known providers.
   * @param provider - Provider identifier
   * @param apiKey - Optional API key (used for Azure resource resolution)
   * @returns Base URL string for the provider's API
   */
  protected getDefaultBaseUrl(provider: string, apiKey?: string): string {
    const bases: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      google: 'https://generativelanguage.googleapis.com/v1beta',
      moonshot: 'https://api.moonshot.cn/v1',
      minimax: 'https://api.minimax.chat/v1',
    };

    if (bases[provider]) {
      return bases[provider];
    }

    if (provider === 'azure' && apiKey) {
      return 'https://{resource}.openai.azure.com/v1';
    }

    return 'https://api.openai.com/v1';
  }

  /**
   * Determine provider capabilities based on provider type.
   * @param provider - Provider identifier
   * @returns Capability flags for this provider
   */
  protected getCapabilities(provider: string): ProviderCapability {
    const defaults: ProviderCapability = {
      chat: true,
      embeddings: true,
      vision: false,
      streaming: true,
      functionCalling: false,
    };

    switch (provider) {
      case 'openai':
        return { ...defaults, vision: true, functionCalling: true };
      case 'anthropic':
        return { ...defaults, vision: true, functionCalling: false };
      case 'google':
        return { ...defaults, vision: true, functionCalling: true };
      case 'moonshot':
        return { chat: true, embeddings: true, vision: false, streaming: true, functionCalling: true };
      case 'minimax':
        return { chat: true, embeddings: true, vision: false, streaming: true, functionCalling: false };
      default:
        return defaults;
    }
  }

  /**
   * Validate the provider configuration.
   * @returns true if the model is set
   */
  validateConfig(): boolean {
    if (!this.config.model) {
      return false;
    }
    return true;
  }

  /**
   * Send a chat completion request.
   * @param options - Chat completion options
   * @returns AIResponse with response data or error
   */
  async chat(options: ChatCompletionOptions): Promise<AIResponse> {
    try {
      const model = options.model || this.config.model;
      const response = await this.client.post('/chat/completions', {
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        stream: false,
      });

      const data = response.data as Record<string, unknown>;
      const choices = (data.choices as Array<{ message: { role: string; content: string }; finish_reason: string }>) || [];
      const usage = data.usage as Record<string, number> | undefined;

      return {
        success: true,
        data: {
          id: data.id,
          model: data.model,
          choices: choices.map((c) => ({
            message: c.message,
            finishReason: c.finish_reason,
          })),
          usage,
        },
        provider: this.config.provider,
        model: String(data.model || model),
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
        provider: this.config.provider,
        model: this.config.model,
      };
    }
  }

  /**
   * Stream chat completions via SSE.
   * @param options - Chat completion options (stream is implicitly enabled)
   * @param onChunk - Callback invoked for each streaming data chunk
   */
  async chatStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: AIResponse) => void,
  ): Promise<void> {
    try {
      const model = options.model || this.config.model;
      const response = await this.client.post(
        '/chat/completions',
        {
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens,
          stream: true,
        },
        { responseType: 'stream' },
      );

      let buffer = '';
      const stream = response.data as NodeJS.ReadableStream;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                resolve();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                onChunk({
                  success: true,
                  data: parsed,
                  provider: this.config.provider,
                  model: parsed.model || model,
                });
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        });

        stream.on('error', reject);
        stream.on('end', resolve);
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onChunk({
        success: false,
        error: message,
        provider: this.config.provider,
        model: this.config.model,
      });
    }
  }

  /**
   * Generate embeddings for one or more text inputs.
   * @param options - Embedding options with input text(s) and model
   * @returns AIResponse with embedding vectors data
   */
  async embeddings(options: EmbeddingOptions): Promise<AIResponse> {
    try {
      const model = options.model || this.getDefaultEmbeddingModel();
      const input = Array.isArray(options.input) ? options.input : [options.input];

      const response = await this.client.post('/embeddings', {
        model,
        input,
        encoding_format: options.encodingFormat || 'float',
        ...(options.dimensions ? { dimensions: options.dimensions } : {}),
      });

      const data = response.data as Record<string, unknown>;
      const embeddingData = (data.data as Array<{ embedding: number[]; index: number }>) || [];
      const usage = data.usage as Record<string, number> | undefined;

      return {
        success: true,
        data: {
          model: data.model,
          embeddings: embeddingData.map((e) => ({
            embedding: e.embedding,
            index: e.index,
          })),
          usage,
        },
        provider: this.config.provider,
        model: String(data.model || model),
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
        provider: this.config.provider,
        model: this.config.model,
      };
    }
  }

  /**
   * Get the default embedding model for the current provider.
   * @returns Model identifier string
   */
  protected getDefaultEmbeddingModel(): string {
    const models: Record<string, string> = {
      openai: 'text-embedding-3-large',
      moonshot: 'embedding-v1',
      minimax: 'embo-01',
    };
    return models[this.config.provider] || 'text-embedding-3-large';
  }
}