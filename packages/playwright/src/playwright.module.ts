import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PLAYWRIGHT_OPTIONS } from './constants/playwright.constants';
import { PlaywrightService } from './playwright.service';

/**
 * NestJS module for browser automation via Playwright (Chromium).
 *
 * Provides `PlaywrightService` with default options (headless, 1920x1080
 * viewport, 30s timeout, 3 retries). The service manages the browser
 * lifecycle automatically via `OnModuleInit` / `OnModuleDestroy`.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    PlaywrightService,
    {
      provide: PLAYWRIGHT_OPTIONS,
      useFactory: () => ({
        headless: true,
        viewport: { width: 1920, height: 1080 },
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
      }),
    },
  ],
  exports: [PlaywrightService],
})
export class PlaywrightModule {}
