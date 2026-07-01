import { Module, Global } from '@nestjs/common';
import { AiService } from './ai.service';

/**
 * AI module providing multi-provider AI capabilities.
 *
 * Registers AiService globally so it's available in all modules
 * without explicit imports. Pre-configured providers include
 * OpenAI, Anthropic, Google Gemini, Moonshot (Kimi), and MiniMax.
 *
 * @example
 * ```typescript
 * @Module({ imports: [AiModule] })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}