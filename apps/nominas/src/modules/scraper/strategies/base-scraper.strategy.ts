import { Logger } from '@nestjs/common';
import { Page } from 'playwright';
import { PlaywrightService } from '@common/playwright';
import {
  IScraperStrategy,
  ScrapedData,
} from '../interfaces/scraper-strategy.interface';

/**
 * Abstract base for concrete scraping strategies.
 *
 * Encapsulates shared Playwright orchestration:
 * - Browser navigation and page lifecycle
 * - Selector waiting and text extraction helpers
 * - Retry logic with configurable attempts and delay
 * - Structured error handling
 *
 * Concrete strategies only need to implement {@link supports},
 * {@link extractData}, and optionally override selectors/options.
 *
 * @example
 * ```typescript
 * class ExampleStrategy extends BaseScraperStrategy {
 *   readonly name = 'example';
 *   supports(url: string): boolean { return url.includes('example.com'); }
 *   protected async extractData(page: Page): Promise<Record<string, unknown>> {
 *     return { title: await page.locator('h1').textContent() };
 *   }
 *   protected getSelectors(): Record<string, string> {
 *     return { title: 'h1', body: 'article' };
 *   }
 * }
 * ```
 */
export abstract class BaseScraperStrategy implements IScraperStrategy {
  /** Unique strategy name. */
  abstract readonly name: string;

  /** Base logger — subclasses can override. */
  protected readonly logger: Logger;

  /**
   * @param playwright Shared Playwright browser automation service.
   */

  constructor(protected readonly playwright: PlaywrightService) {
    this.logger = new Logger(this.constructor.name);
  }

  // ── IScraperStrategy ────────────────────────────────────────

  /** @inheritdoc */

  abstract supports(url: string): boolean;

  /**
   * Full scrape lifecycle: navigate, wait for selectors, extract.
   * @throws On unrecoverable navigation or extraction failure.
   */
  async scrape(url: string): Promise<ScrapedData> {
    const page = await this.navigate(url);
    try {
      await this.waitForSelectors(page);
      const structured = await this.extractData(page);
      return this.buildResult(url, structured);
    } finally {
      // ponytail: single-page policy — page is reused per-scrape, closed by PlaywrightService via createPage
    }
  }

  // ── Template methods (override in concrete strategies) ──────

  /**
   * Return a map of logical field names → CSS selectors.
   * Used by {@link waitForSelectors} to ensure all required
   * elements are present before extraction begins.
   */
  protected getSelectors(): Record<string, string> {
    return { body: 'body' };
  }

  /**
   * Core extraction logic.
   * Called after navigation and selector waiting succeed.
   * @param page The live Playwright {@link Page}.
   * @returns A flat key-value record of extracted data.
   */

  protected abstract extractData(page: Page): Promise<Record<string, unknown>>;

  // ── Helpers (shared across all strategies) ─────────────────

  /** Max retry attempts when navigation or extraction fails. */
  protected maxRetries(): number {
    return 2;
  }

  /** Delay between retries in milliseconds. */
  protected retryDelayMs(): number {
    return 1000;
  }

  /**
   * Navigate to a URL with retry on transient failures.
   * @param url Target URL.
   * @returns A live Playwright Page.
   */
  protected async navigate(url: string): Promise<Page> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.maxRetries(); attempt++) {
      try {
        const page = await this.playwright.createPage(url);
        return page;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Navigation attempt ${attempt + 1}/${this.maxRetries() + 1} failed: ${lastError.message}`,
        );
        if (attempt < this.maxRetries()) {
          await this.sleep(this.retryDelayMs());
        }
      }
    }
    throw lastError;
  }

  /**
   * Wait until every selector from {@link getSelectors} is visible in the DOM.
   * @param page Active Playwright Page.
   * @throws If any selector times out.
   */
  protected async waitForSelectors(page: Page): Promise<void> {
    const selectors = this.getSelectors();
    for (const [field, selector] of Object.entries(selectors)) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
      } catch (error) {
        throw new Error(
          `[${this.name}] Selector "${field}" ("${selector}") not found: ${(error as Error).message}`,
        );
      }
    }
  }

  /**
   * Safe text extraction — returns empty string on failure instead of throwing.
   * @param page Active Playwright Page.
   * @param selector CSS selector.
   */
  protected async safeText(page: Page, selector: string): Promise<string> {
    try {
      const el = page.locator(selector).first();
      const text = await el.textContent();
      return (text ?? '').trim();
    } catch {
      return '';
    }
  }

  /**
   * Safe attribute extraction.
   * @param page Active Playwright Page.
   * @param selector CSS selector.
   * @param attr Attribute name (e.g. `'href'`, `'src'`).
   */
  protected async safeAttr(
    page: Page,
    selector: string,
    attr: string,
  ): Promise<string | null> {
    try {
      const el = page.locator(selector).first();
      return await el.getAttribute(attr);
    } catch {
      return null;
    }
  }

  // ── Internal ───────────────────────────────────────────────

  /** Build the result envelope. */
  private buildResult(
    url: string,
    structured: Record<string, unknown>,
  ): ScrapedData {
    return {
      title:
        (structured['title'] as string) ?? (structured['name'] as string) ?? '',
      content: JSON.stringify(structured),
      structured,
      scrapedAt: new Date().toISOString(),
    };
  }

  /** Promise-based sleep. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
