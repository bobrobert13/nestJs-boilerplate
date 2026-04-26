import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PLAYWRIGHT_OPTIONS } from './constants/playwright.constants';
import { PlaywrightService } from './playwright.service';

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
