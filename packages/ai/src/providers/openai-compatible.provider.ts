import axios, { AxiosInstance } from 'axios';
import {
  AIConfig,
  ChatCompletionOptions,
  EmbeddingOptions,
  AIResponse,
  ProviderCapability,
} from '../types/ai.types';
import { IAIProvider } from '../interfaces/provider.interface';

export class OpenAICompatibleProvider implements IAIProvider {
  readonly name: string;
  readonly config: AIConfig;
  readonly capabilities: ProviderCapability;

  protected client: AxiosInstance;

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
        return {
          chat: true,
          embeddings: true,
          vision: false,
          streaming: true,
          functionCalling: true,
        };
      case 'minimax':
        return {
          chat: true,
          embeddings: true,
          vision: false,
          streaming: true,
          functionCalling: false,
        };
      default:
        return defaults;
    }
  }

  /**
   * Validate that the provider has a model configured.
   * @returns true if config.model is set, false otherwise
   */
  validateConfig(): boolean {
    if (!this.config.model) {
      return false;
    }
    return true;
  }

  /**
   * Send a chat completion request to the upstream API.
   * Handles multimodal content serialization per provider (OpenAI image_url,
   * Anthropic image source, Google inline_data). Rejects vision content early
   * if the provider does not support it.
   *
   * @param options - Chat messages, model override, and generation parameters
   * @returns AIResponse with choices, usage, and provider metadata
   */
  async chat(options: ChatCompletionOptions): Promise<AIResponse> {
    try {
      const model = options.model || this.config.model;

      // Vision capability guard: reject multimodal content early if provider
      // doesn't support it, instead of letting the upstream API return a 400.
      const wantsVision = options.messages.some(
        (m) =>
          Array.isArray(m.content) && m.content.some((p) => p.type !== 'text'),
      );
      if (wantsVision && !this.capabilities.vision) {
        return {
          success: false,
          error:
            'VISION_NOT_SUPPORTED: provider "' +
            this.config.provider +
            '" has capabilities.vision=false',
          provider: this.config.provider,
          model,
        };
      }

      // Serialize messages: convert MessageContentPart[] to the wire shape
      // expected by the target provider. By default we use the OpenAI image_url
      // shape, which most OpenAI-compatible APIs accept.
      const messages = options.messages.map((m) => {
        if (typeof m.content === 'string') return m;
        const providerName = this.config.provider;
        const converted = m.content.map((part) => {
          // Anthropic uses {type: 'image', source: {...}}
          if (providerName === 'anthropic') {
            if (part.type === 'image_url') {
              const url = part.image_url.url;
              const match = url.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: match[1],
                    data: match[2],
                  },
                };
              }
              return {
                type: 'image',
                source: { type: 'url', media_type: 'image/jpeg', data: url },
              };
            }
            if (part.type === 'inline_data') {
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: part.inline_data.mime_type,
                  data: part.inline_data.data,
                },
              };
            }
            if (part.type === 'text') return { type: 'text', text: part.text };
            return {
              type: part.type,
              source: (part as { source?: unknown }).source,
            };
          }
          // Google Gemini uses {inline_data: {mime_type, data}}
          if (providerName === 'google') {
            if (part.type === 'image_url') {
              const url = part.image_url.url;
              const match = url.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                return { inline_data: { mime_type: match[1], data: match[2] } };
              }
            }
            if (part.type === 'inline_data') {
              return part;
            }
            if (part.type === 'text') return { text: part.text };
            return { text: '' };
          }
          // OpenAI / compatible: pass image_url through, convert inline_data.
          if (part.type === 'inline_data') {
            return {
              type: 'image_url',
              image_url: {
                url:
                  'data:' +
                  part.inline_data.mime_type +
                  ';base64,' +
                  part.inline_data.data,
              },
            };
          }
          // text or image_url: pass as-is
          return part;
        });
        return { ...m, content: converted };
      });

      // OpenAI: ask for JSON object explicitly when response_format is supported.
      // Other providers ignore unknown fields; safe to omit.
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        stream: false,
      };
      if (
        options.responseFormat === 'json_object' &&
        this.config.provider === 'openai'
      ) {
        body.response_format = { type: 'json_object' };
      }

      const response = await this.client.post('/chat/completions', body);

      const data = response.data as Record<string, unknown>;
      const choices =
        (data.choices as Array<{
          message: { role: string; content: string };
          finish_reason: string;
        }>) || [];
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
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
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
   * Stream a chat completion using Server-Sent Events.
   * Parses SSE lines and invokes onChunk for each parsed JSON chunk.
   * Calls onChunk with success=false on stream errors.
   *
   * @param options - Chat messages and generation parameters (stream forced to true)
   * @param onChunk - Callback invoked with each streaming chunk or error
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
                // Ignore parse errors
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
   * Generate embedding vectors for one or more text inputs.
   * Uses the provider's default embedding model unless overridden.
   *
   * @param options - Text input(s), optional model override, encoding format, dimensions
   * @returns AIResponse with embeddings array and usage data
   */
  async embeddings(options: EmbeddingOptions): Promise<AIResponse> {
    try {
      const model = options.model || this.getDefaultEmbeddingModel();
      const input = Array.isArray(options.input)
        ? options.input
        : [options.input];

      const response = await this.client.post('/embeddings', {
        model,
        input,
        encoding_format: options.encodingFormat || 'float',
        ...(options.dimensions ? { dimensions: options.dimensions } : {}),
      });

      const data = response.data as Record<string, unknown>;
      const embeddingData =
        (data.data as Array<{ embedding: number[]; index: number }>) || [];
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
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
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

  protected getDefaultEmbeddingModel(): string {
    const models: Record<string, string> = {
      openai: 'text-embedding-3-large',
      moonshot: 'embedding-v1',
      minimax: 'embo-01',
    };
    return models[this.config.provider] || 'text-embedding-3-large';
  }
}
