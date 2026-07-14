import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlaywrightModule } from '@common/playwright';
import { CronModule } from '../../common/cron/cron.module';

import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScraperRepository } from './scraper.repository';
import { ScraperCronService } from './services/scraper-cron.service';

import {
  ScrapeResult,
  ScrapeResultSchema,
} from './schemas/scrape-result.schema';

import { ExampleScraperStrategy } from './strategies/example.strategy';
import { SCRAPER_STRATEGY } from './interfaces/scraper-strategy.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScrapeResult.name, schema: ScrapeResultSchema },
    ]),
    PlaywrightModule,
    CronModule,
  ],
  controllers: [ScraperController],
  providers: [
    ScraperRepository,
    ScraperService,
    ScraperCronService,
    /** Register concrete strategies as multi-providers under the same token. */
    {
      provide: SCRAPER_STRATEGY,
      useClass: ExampleScraperStrategy,
      multi: true,
    } as any,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
