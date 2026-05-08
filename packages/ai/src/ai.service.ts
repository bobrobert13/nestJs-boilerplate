import { Injectable, Global } from '@nestjs/common';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import {
  AIConfig,
  ChatCompletionOptions,
  EmbeddingOptions,
  AIResponse,
  ChatMessage,
  GeneratedSchema,
  SchemaFieldDefinition,
  SchemaGenerationOptions,
} from './types/ai.types';
import { IAIProvider } from './interfaces/provider.interface';

@Global()
@Injectable()
export class AiService {
  private readonly providers: Map<string, IAIProvider> = new Map();

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    // OpenAI
    this.registerProvider({
      provider: 'openai',
      model: 'gpt-4o',
    });

    // Anthropic
    this.registerProvider({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    });

    // Google (Gemini)
    this.registerProvider({
      provider: 'google',
      model: 'gemini-2.0-flash',
    });

    // Moonshot (Kimi)
    this.registerProvider({
      provider: 'moonshot',
      model: 'moonshot-v1-8k',
    });

    // MiniMax
    this.registerProvider({
      provider: 'minimax',
      model: 'MiniMax-Text-01',
    });
  }

  registerProvider(config: AIConfig): void {
    const provider = new OpenAICompatibleProvider(config);
    const key = config.provider;
    this.providers.set(key, provider);
  }

  private getProviderKey(provider: string, model: string): string {
    return `${provider}:${model}`;
  }

  getProvider(name: string): IAIProvider | undefined {
    return this.providers.get(name);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async chat(
    providerName: string,
    messages: ChatMessage[],
    options?: Partial<ChatCompletionOptions>,
  ): Promise<AIResponse> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      return {
        success: false,
        error: `Provider '${providerName}' not found. Use ai.listProviders() to see available providers.`,
        provider: providerName,
        model: options?.model || 'unknown',
      };
    }

    return provider.chat({ messages, ...options });
  }

  async generateSchema(
    providerName: string,
    description: string,
    options?: {
      temperature?: number;
      model?: string;
    },
  ): Promise<AIResponse> {
    const systemPrompt = `Eres un experto en diseño de esquemas MongoDB/Mongoose. Genera un esquema Mongoose completo en TypeScript basado en la descripción proporcionada.

Responde SOLO con código TypeScript siguiendo este formato exacto:
- Usa @Schema() y @Prop() de @nestjs/mongoose
- Incluye tipos de TypeScript apropiados
- Agrega validaciones básicas (@IsString, @IsOptional, etc.)
- Agrega timestamps: true

Ejemplo de respuesta:
\`\`\`typescript
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
\`\`\``;

    return this.chat(providerName, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description },
    ], {
      temperature: options?.temperature ?? 0.3,
      model: options?.model,
    });
  }

  async generateTemplate(
    providerName: string,
    templateType: 'html' | 'email' | 'json' | 'code',
    description: string,
    options?: {
      temperature?: number;
      model?: string;
    },
  ): Promise<AIResponse> {
    const prompts: Record<string, string> = {
      html: `Genera una plantilla HTML completa con TailwindCSS. Incluye todo el HTML necesario (doctype, head, body). La plantilla debe ser práctica y lista para usar. Responde SOLO con el código HTML.`,
      email: `Genera una plantilla de email HTML responsive compatible con clientes de email. Usa estilos inline para máxima compatibilidad. Responde SOLO con el código HTML.`,
      json: `Genera una estructura JSON completa y válida basada en la descripción. Responde SOLO con el JSON.`,
      code: `Genera código fuente completo y funcional basado en la descripción. Especifica el lenguaje si no está claro. Responde SOLO con el código.`,
    };

    return this.chat(providerName, [
      { role: 'system', content: prompts[templateType] || prompts.code },
      { role: 'user', content: description },
    ], {
      temperature: options?.temperature ?? 0.3,
      model: options?.model,
    });
  }

  async generateText(
    providerName: string,
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    },
  ): Promise<AIResponse> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return this.chat(providerName, messages, {
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens,
      model: options?.model,
    });
  }

  async embeddings(
    providerName: string,
    input: string | string[],
    options?: Partial<EmbeddingOptions>,
  ): Promise<AIResponse> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      return {
        success: false,
        error: `Provider '${providerName}' not found.`,
        provider: providerName,
        model: options?.model || 'unknown',
      };
    }

    return provider.embeddings({ input, ...options });
  }

  async createEmbedding(
    providerName: string,
    text: string,
  ): Promise<AIResponse> {
    const result = await this.embeddings(providerName, text);

    if (result.success && result.data) {
      const data = result.data as Record<string, unknown>;
      if (Array.isArray(data.embeddings)) {
        const embeddings = data.embeddings as Array<{ embedding: number[] }>;
        return {
          ...result,
          data: {
            embedding: embeddings[0]?.embedding || [],
            model: data.model,
            usage: result.usage,
          },
        };
      }
    }

    return result;
  }

  async chatStream(
    providerName: string,
    messages: ChatMessage[],
    onChunk: (chunk: AIResponse) => void,
    options?: Partial<ChatCompletionOptions>,
  ): Promise<void> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      onChunk({
        success: false,
        error: `Provider '${providerName}' not found.`,
        provider: providerName,
        model: options?.model || 'unknown',
      });
      return;
    }

    return provider.chatStream({ messages, ...options }, onChunk);
  }

  async generateSchemaFromImage(
    providerName: string,
    imageData: string,
    options?: SchemaGenerationOptions,
  ): Promise<AIResponse<GeneratedSchema>> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      return {
        success: false,
        error: `Provider '${providerName}' not found.`,
        provider: providerName,
        model: options?.model || 'unknown',
      };
    }

    const systemPrompt = `You are an expert at analyzing document images and inferring MongoDB/Mongoose schema structures.

Given an image of a document (invoice, form, ID, etc.), analyze the visual structure and output a JSON schema that represents the fields visible in the document.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "fields": [
    { "name": "fieldName", "type": "string|number|boolean|date|array|object", "required": true|false, "default": null, "validate": {} }
  ],
  "collectionName": "collectionName",
  "metadata": {}
}

Rules:
- "name" must be a valid JavaScript property name (camelCase or snake_case)
- "type" must be one of: string, number, boolean, date, array, object
- "required" is optional, defaults to false
- "collectionName" should be singular, lowercase (e.g., "invoices", "users")
- Analyze the image to determine appropriate field names and types
- Include all visible fields from the document`;

    const userPrompt = `Analyze this document image and extract the schema fields. Return only the JSON schema. Image data: ${imageData.substring(0, 100)}...`;

    try {
      const response = await this.chat(providerName, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: options?.temperature ?? 0.3,
        model: options?.model,
      });

      if (!response.success) {
        return response as AIResponse<GeneratedSchema>;
      }

      // Parse the JSON response
      const content = response.data as string;
      const jsonMatch = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const schema = JSON.parse(jsonMatch) as GeneratedSchema;
        return {
          ...response,
          data: schema,
        };
      } catch {
        // Retry once if JSON parse fails
        const retryResponse = await this.chat(providerName, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Retry: ${userPrompt}` },
        ], {
          temperature: options?.temperature ?? 0.3,
          model: options?.model,
        });

        if (!retryResponse.success) {
          return retryResponse as AIResponse<GeneratedSchema>;
        }

        const retryContent = retryResponse.data as string;
        const retryJsonMatch = retryContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
          const schema = JSON.parse(retryJsonMatch) as GeneratedSchema;
          return {
            ...retryResponse,
            data: schema,
          };
        } catch {
          return {
            success: false,
            error: 'SCHEMA_GENERATION_ERROR: AI returned malformed JSON after retry',
            provider: providerName,
            model: options?.model || 'unknown',
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `SCHEMA_GENERATION_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: providerName,
        model: options?.model || 'unknown',
      };
    }
  }

  async generateSchemaFromText(
    providerName: string,
    text: string,
    options?: SchemaGenerationOptions,
  ): Promise<AIResponse<GeneratedSchema>> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      return {
        success: false,
        error: `Provider '${providerName}' not found.`,
        provider: providerName,
        model: options?.model || 'unknown',
      };
    }

    const systemPrompt = `You are an expert at analyzing text content and inferring MongoDB/Mongoose schema structures.

Given text extracted from a document or a description of a form/document, analyze the content and output a JSON schema that represents the fields.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "fields": [
    { "name": "fieldName", "type": "string|number|boolean|date|array|object", "required": true|false, "default": null, "validate": {} }
  ],
  "collectionName": "collectionName",
  "metadata": {}
}

Rules:
- "name" must be a valid JavaScript property name (camelCase or snake_case)
- "type" must be one of: string, number, boolean, date, array, object
- "required" is optional, defaults to false
- "collectionName" should be singular, lowercase (e.g., "invoices", "users")
- Infer appropriate field names and types from the text content
- Include all relevant fields mentioned in the text`;

    try {
      const response = await this.chat(providerName, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ], {
        temperature: options?.temperature ?? 0.3,
        model: options?.model,
      });

      if (!response.success) {
        return response as AIResponse<GeneratedSchema>;
      }

      // Parse the JSON response
      const content = response.data as string;
      const jsonMatch = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const schema = JSON.parse(jsonMatch) as GeneratedSchema;
        return {
          ...response,
          data: schema,
        };
      } catch {
        // Retry once if JSON parse fails
        const retryResponse = await this.chat(providerName, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Retry: ${text}` },
        ], {
          temperature: options?.temperature ?? 0.3,
          model: options?.model,
        });

        if (!retryResponse.success) {
          return retryResponse as AIResponse<GeneratedSchema>;
        }

        const retryContent = retryResponse.data as string;
        const retryJsonMatch = retryContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
          const schema = JSON.parse(retryJsonMatch) as GeneratedSchema;
          return {
            ...retryResponse,
            data: schema,
          };
        } catch {
          return {
            success: false,
            error: 'SCHEMA_GENERATION_ERROR: AI returned malformed JSON after retry',
            provider: providerName,
            model: options?.model || 'unknown',
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `SCHEMA_GENERATION_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: providerName,
        model: options?.model || 'unknown',
      };
    }
  }
}
