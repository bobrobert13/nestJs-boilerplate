import { AiService } from './ai.service';
import { IAIProvider } from './interfaces/provider.interface';
import { AIResponse, ChatMessage } from './types/ai.types';

function createMockProvider(
  overrides: Partial<IAIProvider> = {},
): jest.Mocked<IAIProvider> {
  return {
    name: 'openai',
    config: { provider: 'openai', model: 'gpt-4o' },
    capabilities: {
      chat: true,
      embeddings: true,
      vision: true,
      streaming: true,
      functionCalling: true,
    },
    chat: jest.fn().mockResolvedValue({
      success: true,
      provider: 'openai',
      model: 'gpt-4o',
    }),
    chatStream: jest.fn(),
    embeddings: jest.fn(),
    validateConfig: jest.fn().mockReturnValue(true),
    ...overrides,
  } as any;
}

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    service = new AiService();
  });

  describe('registerProvider / getProvider / listProviders', () => {
    it('registers default providers on construction', () => {
      const providers = service.listProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('google');
      expect(providers).toContain('moonshot');
      expect(providers).toContain('minimax');
    });

    it('registers a custom provider', () => {
      service.registerProvider({
        provider: 'custom-llm',
        model: 'custom-v1',
        apiKey: 'key',
      });
      expect(service.getProvider('custom-llm')).toBeDefined();
      expect(service.listProviders()).toContain('custom-llm');
    });

    it('overrides an existing provider', () => {
      service.registerProvider({ provider: 'openai', model: 'gpt-4o-mini' });
      expect(service.getProvider('openai')?.config.model).toBe('gpt-4o-mini');
    });

    it('returns undefined for unknown provider', () => {
      expect(service.getProvider('nonexistent')).toBeUndefined();
    });
  });

  describe('chat', () => {
    it('returns error for unknown provider', async () => {
      const result = await service.chat('nonexistent', [
        { role: 'user', content: 'hello' },
      ]);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Provider 'nonexistent' not found");
    });

    it('delegates to the correct provider', async () => {
      const mockResponse: AIResponse = {
        success: true,
        data: { choices: [{ message: { content: 'hi' } }] },
        provider: 'openai',
        model: 'gpt-4o',
      };
      const mockProvider = createMockProvider({
        chat: jest.fn().mockResolvedValue(mockResponse),
      });
      (service as any).providers.set('openai', mockProvider);

      const messages: ChatMessage[] = [{ role: 'user', content: 'hello' }];
      const result = await service.chat('openai', messages);

      expect(result.success).toBe(true);
      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({ messages }),
      );
    });

    it('passes options through to provider', async () => {
      const mockProvider = createMockProvider();
      (service as any).providers.set('openai', mockProvider);

      await service.chat('openai', [{ role: 'user', content: 'test' }], {
        temperature: 0.5,
        model: 'gpt-4o-mini',
      });

      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.5, model: 'gpt-4o-mini' }),
      );
    });
  });

  describe('generateSchemaFromText', () => {
    it('returns parsed schema on valid JSON response', async () => {
      const schemaJson = JSON.stringify({
        fields: [{ name: 'title', type: 'string', required: true }],
        collectionName: 'articles',
      });
      const mockProvider = createMockProvider({
        chat: jest.fn().mockResolvedValue({
          success: true,
          data: { choices: [{ message: { content: schemaJson } }] },
          provider: 'openai',
          model: 'gpt-4o',
        }),
      });
      (service as any).providers.set('openai', mockProvider);

      const result = await service.generateSchemaFromText(
        'openai',
        'An article',
      );

      expect(result.success).toBe(true);
      expect((result.data as any).fields).toHaveLength(1);
      expect((result.data as any).collectionName).toBe('articles');
      expect((result.data as any).source).toBe('text');
    });

    it('retries with temperature 0 on malformed JSON', async () => {
      const validJson = JSON.stringify({
        fields: [{ name: 'name', type: 'string' }],
        collectionName: 'users',
      });
      const mockProvider = createMockProvider({
        chat: jest
          .fn()
          .mockResolvedValueOnce({
            success: true,
            data: { choices: [{ message: { content: 'not json' } }] },
            provider: 'openai',
            model: 'gpt-4o',
          })
          .mockResolvedValueOnce({
            success: true,
            data: { choices: [{ message: { content: validJson } }] },
            provider: 'openai',
            model: 'gpt-4o',
          }),
      });
      (service as any).providers.set('openai', mockProvider);

      const result = await service.generateSchemaFromText('openai', 'A user');

      expect(result.success).toBe(true);
      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
      expect(mockProvider.chat).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ temperature: 0 }),
      );
    });

    it('returns error when provider fails', async () => {
      const mockProvider = createMockProvider({
        chat: jest.fn().mockResolvedValue({
          success: false,
          error: 'Rate limit',
          provider: 'openai',
          model: 'gpt-4o',
        }),
      });
      (service as any).providers.set('openai', mockProvider);

      const result = await service.generateSchemaFromText('openai', 'text');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit');
    });

    it('strips markdown code fences from response', async () => {
      const schemaJson = JSON.stringify({
        fields: [{ name: 'id', type: 'number' }],
        collectionName: 'items',
      });
      const wrappedJson = '```json\n' + schemaJson + '\n```';
      const mockProvider = createMockProvider({
        chat: jest.fn().mockResolvedValue({
          success: true,
          data: { choices: [{ message: { content: wrappedJson } }] },
          provider: 'openai',
          model: 'gpt-4o',
        }),
      });
      (service as any).providers.set('openai', mockProvider);

      const result = await service.generateSchemaFromText('openai', 'items');
      expect(result.success).toBe(true);
      expect((result.data as any).collectionName).toBe('items');
    });
  });

  describe('generateSchemaFromImage', () => {
    it('rejects vision content for providers without vision capability', async () => {
      const mockProvider = createMockProvider({
        name: 'moonshot',
        config: { provider: 'moonshot', model: 'moonshot-v1-8k' },
        capabilities: {
          chat: true,
          embeddings: true,
          vision: false,
          streaming: true,
          functionCalling: true,
        },
      });
      (service as any).providers.set('moonshot', mockProvider);

      const result = await service.generateSchemaFromImage(
        'moonshot',
        'base64data',
        'image/png',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('VISION_NOT_SUPPORTED');
    });

    it('sends multimodal content for vision-capable providers', async () => {
      const schemaJson = JSON.stringify({
        fields: [{ name: 'receipt_id', type: 'string' }],
        collectionName: 'receipts',
      });
      const mockProvider = createMockProvider({
        chat: jest.fn().mockResolvedValue({
          success: true,
          data: { choices: [{ message: { content: schemaJson } }] },
          provider: 'openai',
          model: 'gpt-4o',
        }),
      });
      (service as any).providers.set('openai', mockProvider);

      const result = await service.generateSchemaFromImage(
        'openai',
        'base64imagedata',
        'image/png',
      );

      expect(result.success).toBe(true);
      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text' }),
                expect.objectContaining({ type: 'image_url' }),
              ]),
            }),
          ]),
        }),
      );
    });
  });

  describe('embeddings', () => {
    it('delegates to provider embeddings', async () => {
      const mockProvider = createMockProvider({
        embeddings: jest.fn().mockResolvedValue({
          success: true,
          data: { embeddings: [{ embedding: [0.1, 0.2], index: 0 }] },
          provider: 'openai',
          model: 'text-embedding-3-large',
        }),
      });
      (service as any).providers.set('openai', mockProvider);

      const result = await service.embeddings('openai', 'hello world');

      expect(result.success).toBe(true);
      expect(mockProvider.embeddings).toHaveBeenCalledWith(
        expect.objectContaining({ input: 'hello world' }),
      );
    });

    it('returns error for unknown provider', async () => {
      const result = await service.embeddings('nonexistent', 'text');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
