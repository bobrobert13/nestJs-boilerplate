import { Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { SsrfGuard } from '@common/common';
import {
  IScraperStrategy,
  SCRAPER_STRATEGY,
  ScrapedData,
} from './interfaces/scraper-strategy.interface';
import { ScraperRepository } from './scraper.repository';
import { ScrapeResultDocument } from './schemas/scrape-result.schema';

/**
 * Orchestrator for the Strategy pattern.
 *
 * Holds a registry of {@link IScraperStrategy} instances (multi-provider
 * injection via the {@link SCRAPER_STRATEGY} token).  When a scrape is
 * requested it selects the first matching strategy, executes it, and
 * persists the result.
 */
@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @Inject(SCRAPER_STRATEGY)
    /* eslint-disable-next-line no-unused-vars -- NestJS DI, used via this.strategies */
    private readonly strategies: IScraperStrategy[],
    /* eslint-disable-next-line no-unused-vars -- NestJS DI, used via this.repository */
    private readonly repository: ScraperRepository,
    @Optional() private readonly ssrfGuard?: SsrfGuard,
  ) {}

  /**
   * Execute a scrape for the given URL.
   *
   * Strategy selection: if `strategyName` is provided, finds by name;
   * otherwise iterates the registry and picks the first strategy whose
   * {@link IScraperStrategy.supports} returns `true`.
   *
   * @param url Full URL to scrape.
   * @param strategyName Optional strategy name override.
   * @returns The persisted result document.
   * @throws NotFoundException if no strategy matches the URL.
   */
  async scrape(
    url: string,
    strategyName?: string,
  ): Promise<ScrapeResultDocument> {
    // PR5 / H5 — refuse SSRF destinations BEFORE strategy lookup.
    if (this.ssrfGuard) {
      await this.ssrfGuard.assertSafeUrl(url);
    }

    const strategy = strategyName
      ? this.findByName(strategyName)
      : this.findByUrl(url);

    if (!strategy) {
      throw new NotFoundException(
        strategyName
          ? `Strategy "${strategyName}" not found`
          : `No strategy registered for URL: ${url}`,
      );
    }

    const doc = await this.repository.create(url, strategy.name);

    try {
      const docId = String(doc._id);
      await this.repository.markRunning(docId);
      this.logger.log(`Scraping ${url} with strategy "${strategy.name}"`);

      const result: ScrapedData = await strategy.scrape(url);

      await this.repository.markSuccess(docId, result.structured);
      this.logger.log(`Scrape complete for ${url}`);

      return (await this.repository.findById(docId))!;
    } catch (error) {
      const msg = (error as Error).message;
      await this.repository.markFailed(String(doc._id), msg);
      throw error;
    }
  }

  /** List all registered strategy names. */
  listStrategies(): string[] {
    return this.strategies.map((s) => s.name);
  }

  /** Return recent scrape results. */
  async getRecent(limit = 20): Promise<ScrapeResultDocument[]> {
    return this.repository.findRecent(limit);
  }

  /** Return a single result by id. */
  async getResult(id: string): Promise<ScrapeResultDocument | null> {
    return this.repository.findById(id);
  }

  // ── Private helpers ────────────────────────────────────────

  private findByName(name: string): IScraperStrategy | undefined {
    return this.strategies.find((s) => s.name === name);
  }

  private findByUrl(url: string): IScraperStrategy | undefined {
    return this.strategies.find((s) => s.supports(url));
  }
}
