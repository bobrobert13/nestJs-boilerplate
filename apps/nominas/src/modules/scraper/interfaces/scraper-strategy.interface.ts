/** Scraped data from a single page. */
export interface ScrapedData {
  /** Page title */
  title: string;
  /** Raw text content */
  content: string;
  /** Structured data extracted via strategy-specific selectors */
  structured: Record<string, unknown>;
  /** ISO timestamp of scrape */
  scrapedAt: string;
}

/**
 * Contract for a web scraping strategy.
 *
 * Each concrete strategy targets one website or a family of similarly
 * structured pages.  The strategy is responsible for:
 * - Declaring which URLs it supports via {@link supports}
 * - Orchestrating Playwright interactions via {@link scrape}
 *
 * @example
 * ```typescript
 * @Injectable()
 * class HackerNewsStrategy implements IScraperStrategy {
 *   readonly name = 'hacker-news';
 *   supports(url: string): boolean { return url.includes('news.ycombinator.com'); }
 *   // ...scrape implementation
 * }
 * ```
 */
export interface IScraperStrategy {
  /** Unique, human-readable strategy name (e.g. `'hacker-news'`). */
  readonly name: string;

  /**
   * Whether this strategy can handle the given URL.
   * @param url Full URL to test.
   * @returns `true` if this strategy should scrape this page.
   */
  supports(url: string): boolean;

  /**
   * Execute the scrape against the given URL.
   * @param url The target URL.
   * @returns Structured scraped data.
   * @throws On navigation or extraction failure.
   */
  scrape(url: string): Promise<ScrapedData>;
}

/** Injection token for the strategy registry (multi-provider). */
export const SCRAPER_STRATEGY = Symbol('SCRAPER_STRATEGY');
