<!-- @common/ai — status: partial -->

# @common/ai

AI Providers wrapper for NestJS - Connect to OpenAI, Anthropic, Google Gemini, Moonshot (Kimi), MiniMax and any OpenAI-compatible API.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, Google, Moonshot, MiniMax, and any OpenAI-compatible API
- **Unified Interface**: Same code for all providers via `AiService`
- **Chat Completions**: Text generation with system prompts and options
- **Embeddings**: Generate vector embeddings for text
- **Streaming**: Real-time streaming responses support
- **Schema Generation**: Generate Mongoose schemas from descriptions
- **Template Generation**: Generate HTML, email templates, JSON, code
- **Plug & Play**: Easy to add new providers or custom configurations

## Installation

```bash
npm install @common/ai axios
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { AiModule } from '@common/ai';

@Module({
  imports: [AiModule],
})
export class AppModule {}
```

### 2. Use in any service

```typescript
import { Injectable } from '@nestjs/common';
import { AiService, ChatMessage } from '@common/ai';

@Injectable()
export class MyService {
  constructor(private readonly ai: AiService) {}

  async generateContent() {
    const response = await this.ai.generateText(
      'openai',                    // Provider name
      'Explain quantum computing', // User prompt
      'You are a helpful assistant' // Optional system prompt
    );

    if (response.success) {
      console.log(response.data);
    }
  }
}
```

## Providers

### Pre-configured Providers

| Provider | Model | Description |
|----------|-------|-------------|
| `openai` | gpt-4o | OpenAI GPT models |
| `anthropic` | claude-3-5-sonnet | Anthropic Claude models |
| `google` | gemini-2.0-flash | Google Gemini models |
| `moonshot` | moonshot-v1-8k | Moonshot Kimi models |
| `minimax` | MiniMax-Text-01 | MiniMax models |

### Custom Provider Configuration

```typescript
// Register a custom provider with API key
aiService.registerProvider({
  provider: 'openai',
  model: 'gpt-4-turbo',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1', // Optional, for proxies
});

// Register a custom provider (e.g., local model)
aiService.registerProvider({
  provider: 'custom',
  model: 'llama-3',
  apiKey: 'not-needed',
  baseUrl: 'http://localhost:11434/v1',
});
```

## API Reference

### `AiService`

#### `chat(providerName, messages, options?)`

Send a chat completion request.

```typescript
const messages: ChatMessage[] = [
  { role: 'system', content: 'You are a coding assistant.' },
  { role: 'user', content: 'Write a hello world in Python' },
];

const response = await ai.chat('openai', messages, {
  temperature: 0.7,
  maxTokens: 1000,
});
```

**Parameters:**
- `providerName: string` - Provider identifier (e.g., 'openai', 'anthropic')
- `messages: ChatMessage[]` - Array of chat messages
- `options?: ChatCompletionOptions` - Optional parameters

**Returns:** `Promise<AIResponse>`

---

#### `generateText(providerName, prompt, systemPrompt?, options?)`

Generate text with optional system prompt.

```typescript
const response = await ai.generateText(
  'openai',
  'What is the capital of France?',
  'Answer in one sentence.',
  { temperature: 0.5 }
);
```

---

#### `generateSchema(providerName, description, options?)`

Generate a Mongoose schema from description.

```typescript
const response = await ai.generateSchema('openai', `
  Create a User schema with:
  - email (required, unique)
  - name (required)
  - age (optional, number)
  - createdAt, updatedAt timestamps
`);

// Response contains TypeScript code for the schema
```

---

#### `generateTemplate(providerName, type, description, options?)`

Generate templates (HTML, email, JSON, code).

```typescript
// Generate HTML page template
const html = await ai.generateTemplate(
  'openai',
  'html',
  'Create a landing page for a SaaS product with hero, features, and pricing sections'
);

// Generate email template
const email = await ai.generateTemplate(
  'anthropic',
  'email',
  'Welcome email with verification link placeholder'
);

// Generate JSON structure
const json = await ai.generateTemplate(
  'google',
  'json',
  'User profile with id, name, email, preferences object'
);
```

**Supported types:**
- `html` - Complete HTML page with TailwindCSS
- `email` - Email HTML template (inline styles)
- `json` - JSON data structure
- `code` - Source code in any language

---

#### `embeddings(providerName, input, options?)`

Generate embeddings for text.

```typescript
const response = await ai.embeddings('openai', 'Hello world');

// Or for multiple texts
const response = await ai.embeddings('openai', [
  'First text',
  'Second text',
  'Third text'
]);
```

**Returns embeddings array:**
```typescript
{
  success: true,
  data: {
    model: 'text-embedding-3-large',
    embeddings: [
      { embedding: [0.123, ...], index: 0 },
      { embedding: [0.456, ...], index: 1 }
    ],
    usage: { prompt_tokens: 10, total_tokens: 10 }
  }
}
```

---

#### `createEmbedding(providerName, text)`

Generate a single embedding vector.

```typescript
const response = await ai.createEmbedding('openai', 'Hello world');

if (response.success) {
  const vector = response.data.embedding; // Array of numbers
}
```

---

#### `chatStream(providerName, messages, onChunk, options?)`

Stream responses in real-time.

```typescript
await ai.chatStream(
  'openai',
  [{ role: 'user', content: 'Count to 10' }],
  (chunk) => {
    console.log('Received:', chunk.data);
  },
  { maxTokens: 500 }
);
```

---

#### `registerProvider(config)`

Register a custom provider.

```typescript
aiService.registerProvider({
  provider: 'my-provider',
  model: 'my-model',
  apiKey: 'optional-api-key',
  baseUrl: 'https://custom.endpoint.com/v1',
});
```

---

#### `getProvider(name)` & `listProviders()`

Manage providers.

```typescript
const provider = aiService.getProvider('openai');
const providers = aiService.listProviders();
```

---

## Types

### ChatMessage

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}
```

### AIResponse

```typescript
interface AIResponse<T = unknown> {
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
```

### AIConfig

```typescript
interface AIConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}
```

---

## Environment Variables

No environment variables required by default. API keys can be passed directly when registering providers.

For production, store API keys securely (e.g., environment variables or secrets manager):

```typescript
aiService.registerProvider({
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## Adding New Providers

The package uses OpenAI-compatible provider abstraction. To add a new provider:

```typescript
// 1. Register with base URL
aiService.registerProvider({
  provider: 'new-provider',
  model: 'model-name',
  apiKey: 'your-key',
  baseUrl: 'https://api.newprovider.com/v1', // Custom endpoint
});

// 2. Use it
const response = await ai.chat('new-provider', messages);
```

---

## Environment Variables

No environment variables required by default. API keys can be passed directly when registering providers.

For production, store API keys securely (e.g., environment variables or secrets manager):

```typescript
// .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
MOONSHOT_API_KEY=...
MINIMAX_API_KEY=...

// In your module or service
aiService.registerProvider({
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## Advanced Usage

### Provider Selection Strategy

Choose providers based on use case:

```typescript
@Injectable()
export class ContentGenerationService {
  constructor(private readonly ai: AiService) {}

  // Fast & cheap for drafts
  async generateDraft(topic: string) {
    return this.ai.generateText('moonshot', topic, {
      temperature: 0.8,
      maxTokens: 500,
    });
  }

  // High quality for final content
  async generateFinalContent(topic: string) {
    return this.ai.generateText('anthropic', topic, {
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  // Code generation
  async generateCode(description: string) {
    return this.ai.generateTemplate('openai', 'code', description, {
      temperature: 0.3, // Lower for precision
    });
  }

  // Cost-effective embeddings
  async generateEmbeddings(texts: string[]) {
    return this.ai.embeddings('minimax', texts);
  }
}
```

---

### Fallback Provider Pattern

Implement fallback logic for reliability:

```typescript
async generateWithFallback(prompt: string): Promise<AIResponse> {
  const providers = ['openai', 'anthropic', 'google'];
  
  for (const provider of providers) {
    const response = await this.ai.generateText(provider, prompt);
    
    if (response.success) {
      return response;
    }
    
    console.warn(`Provider ${provider} failed:`, response.error);
  }
  
  return {
    success: false,
    error: 'All providers failed',
    provider: 'fallback',
    model: 'none',
  };
}
```

---

### Multi-Provider Comparison

Compare outputs from different providers:

```typescript
async compareProviders(prompt: string) {
  const providers = ['openai', 'anthropic', 'google'];
  const results = await Promise.all(
    providers.map(p => this.ai.generateText(p, prompt))
  );
  
  return providers.map((provider, i) => ({
    provider,
    success: results[i].success,
    content: results[i].data,
    tokens: results[i].usage?.totalTokens,
  }));
}
```

---

### Batch Processing

Process multiple items efficiently:

```typescript
async batchEmbeddings(texts: string[], batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await this.ai.embeddings('openai', batch);
    
    if (response.success) {
      results.push(...response.data.embeddings);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
```

---

### Streaming to Client

Stream AI responses to HTTP client:

```typescript
@Controller('chat')
export class ChatController {
  constructor(private readonly ai: AiService) {}

  @Post('stream')
  async streamChat(@Body() body: { message: string }, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await this.ai.chatStream(
      'openai',
      [{ role: 'user', content: body.message }],
      (chunk) => {
        if (chunk.success) {
          res.write(`data: ${JSON.stringify(chunk.data)}\n\n`);
        }
      }
    );

    res.end();
  }
}
```

---

### Schema Generation Workflow

Complete workflow for generating and using Mongoose schemas:

```typescript
async createSchemaFromDescription(description: string) {
  // 1. Generate schema code
  const response = await this.ai.generateSchema('anthropic', description);
  
  if (!response.success) {
    throw new Error('Failed to generate schema');
  }
  
  // 2. Extract code from response (remove markdown fences)
  const code = response.data.choices[0].message.content
    .replace(/```typescript/g, '')
    .replace(/```/g, '')
    .trim();
  
  // 3. Save to file or evaluate dynamically
  await this.fs.writeFile(`src/schemas/${name}.ts`, code);
  
  return { code, saved: true };
}
```

---

### Template Generation with Context

Generate templates with custom context:

```typescript
async generateEmailTemplate(type: string, context: Record<string, any>) {
  const prompt = `
    Generate an email template for: ${type}
    
    Context:
    - Company: ${context.companyName}
    - Tone: ${context.tone}
    - CTA: ${context.callToAction}
    - Brand colors: ${context.brandColors}
    
    Include inline CSS for email compatibility.
  `;
  
  return this.ai.generateTemplate('openai', 'email', prompt);
}

// Usage
await generateEmailTemplate('welcome', {
  companyName: 'Acme Inc',
  tone: 'friendly and professional',
  callToAction: 'Verify your email',
  brandColors: 'blue (#007bff) and white',
});
```

---

## Best Practices

### 1. Error Handling

Always check `success` property:

```typescript
const response = await ai.generateText('openai', 'Hello');

if (!response.success) {
  console.error('AI Error:', response.error);
  // Implement retry logic or fallback
  return null;
}

// Safe to use response.data
return response.data;
```

---

### 2. Rate Limiting

Implement delays for batch operations:

```typescript
async processBatch(items: string[]) {
  for (const item of items) {
    const response = await this.ai.generateText('openai', item);
    
    // Check rate limit headers or errors
    if (response.error?.includes('rate limit')) {
      await this.delay(1000); // Wait 1 second
      continue;
    }
    
    await this.delay(200); // 200ms between requests
  }
}
```

---

### 3. Token Management

Monitor token usage:

```typescript
const response = await ai.chat('openai', messages, {
  maxTokens: 1000, // Limit response length
});

if (response.usage) {
  console.log(`Used ${response.usage.totalTokens} tokens`);
  console.log(`Prompt: ${response.usage.promptTokens}`);
  console.log(`Completion: ${response.usage.completionTokens}`);
}
```

---

### 4. Temperature Guidelines

| Temperature | Use Case |
|-------------|----------|
| 0.0 - 0.3 | Code generation, factual answers, schema generation |
| 0.4 - 0.7 | General chat, content creation, balanced output |
| 0.8 - 1.0 | Creative writing, brainstorming, diverse outputs |
| 1.0+ | Experimental, highly creative (may be incoherent) |

---

### 5. Provider Selection

| Task | Recommended Provider |
|------|---------------------|
| Code generation | OpenAI (gpt-4o), Anthropic (claude-3-5-sonnet) |
| Creative writing | Anthropic, Google (gemini) |
| Long context | Anthropic (200K), Google (1M+) |
| Cost-effective | Moonshot, MiniMax |
| Embeddings | OpenAI (text-embedding-3-large) |
| Local/Offline | Custom provider (Ollama, LM Studio) |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Provider not found` | Check provider name, use `ai.listProviders()` |
| `401 Unauthorized` | Verify API key is correct and active |
| `429 Rate limit` | Add delays between requests or upgrade plan |
| `Timeout` | Increase timeout in provider config or reduce maxTokens |
| `Empty response` | Check temperature (too high) or maxTokens (too low) |

---

### Debug Mode

Enable logging for debugging:

```typescript
@Injectable()
export class DebugAiService {
  constructor(private readonly ai: AiService) {}

  async debugProvider(provider: string, prompt: string) {
    console.log(`Testing provider: ${provider}`);
    console.log('Prompt:', prompt);
    
    const start = Date.now();
    const response = await this.ai.generateText(provider, prompt);
    const duration = Date.now() - start;
    
    console.log('Response:', {
      success: response.success,
      error: response.error,
      model: response.model,
      tokens: response.usage?.totalTokens,
      duration: `${duration}ms`,
    });
    
    return response;
  }
}
```

---

## Performance Tips

1. **Use appropriate models**: Don't use GPT-4 for simple tasks
2. **Cache embeddings**: Store and reuse embeddings for static content
3. **Batch requests**: Send multiple inputs in one API call when possible
4. **Stream large responses**: Use `chatStream()` for long content
5. **Set maxTokens**: Always limit response length to control costs

---

## Security Considerations

- **Never expose API keys** in client-side code
- **Validate user input** before sending to AI
- **Sanitize AI output** before displaying to users
- **Implement rate limiting** per user to prevent abuse
- **Log API usage** for monitoring and billing

---

## License

MIT