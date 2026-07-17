import { Injectable, Logger } from '@nestjs/common';

let Cron: any;
try {
  Cron = require('@nestjs/schedule').Cron;
} catch {
  Cron =
    () =>
    (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) =>
      descriptor || target;
}

import { ScraperService } from '../scraper.service';

/**
 * Scheduled scraping jobs.
 *
 * Each method decorated with {@link Cron} runs on a fixed schedule.
 * In the future, jobs can be sourced dynamically from a persisted
 * {@link ScrapeJob} registry in the database.
 *
 * This service uses the shared `@nestjs/schedule` infrastructure
 * bootstrapped by the global {@link CronModule}.
 */
@Injectable()
export class ScraperCronService {
  private readonly logger = new Logger(ScraperCronService.name);

  /**
   * @param scraperService Orchestrator for scraping strategies.
   */

  constructor(private readonly scraperService: ScraperService) {}

  /**
   * Example scheduled scrape - runs every 6 hours.
   * Replace URL with a real target when a concrete strategy is registered.
   */
  @Cron('0 */6 * * *', { name: 'scraper-example-daily' })
  async handleExampleCron(): Promise<void> {
    this.logger.log('Running scheduled example scrape');
    try {
      await this.scraperService.scrape(
        'https://news.ycombinator.com',
        'example',
      );
    } catch (error) {
      this.logger.error(
        `Scheduled scrape failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
