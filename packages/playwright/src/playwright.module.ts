import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PLAYWRIGHT_OPTIONS } from './constants/playwright.constants';
import { PlaywrightService } from './playwright.service';
import playwrightConfig from './config/playwright.config';
import type { PlaywrightConfig } from './config/playwright.config';

@Module({
  imports: [ConfigModule.forFeature(playwrightConfig)],
  providers: [
    PlaywrightService,
    {
      provide: PLAYWRIGHT_OPTIONS,
      useFactory: (configService: ConfigService) => {
        const pw = configService.get<PlaywrightConfig>('playwright');
        return {
          headless: pw?.headless ?? true,
          viewport: { width: 1920, height: 1080 },
          timeout: pw?.timeout ?? 30000,
          retries: pw?.retries ?? 3,
          retryDelay: 1000,
        };
      },
      inject: [ConfigService],
    },
  ],
  exports: [PlaywrightService],
})
export class PlaywrightModule {}
