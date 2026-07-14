import { Injectable } from '@nestjs/common';
import { Page } from 'playwright';
import { PlaywrightService } from '@common/playwright';
import { BaseScraperStrategy } from './base-scraper.strategy';

/**
 * Example concrete strategy that scrapes the Hacker News homepage.
 *
 * Demonstrates the minimal implementation needed:
 * - {@link name} identifier
 * - {@link supports} URL matching
 * - {@link getSelectors} for required elements
 * - {@link extractData} with locator-based extraction
 *
 * Reference: `sites/hacker-news.md`
 */
@Injectable()
export class ExampleScraperStrategy extends BaseScraperStrategy {
  readonly name = 'example';

  /**
   * @param playwright Shared Playwright browser automation service.
   */
  constructor(playwright: PlaywrightService) {
    super(playwright);
  }

  /** Match hackernews or any URL containing `example` in the hostname. */
  supports(url: string): boolean {
    try {
      const host = new URL(url).hostname;
      return host.includes('news.ycombinator.com') || host.includes('example');
    } catch {
      return false;
    }
  }

  protected getSelectors(): Record<string, string> {
    return {
      title: 'title',
      // ponytail: HN homepage uses <a class="titlelink"> for story titles
      storyContainer: '.athing',
    };
  }

  protected async extractData(page: Page): Promise<Record<string, unknown>> {
    const pageTitle = await this.safeText(page, 'title');

    // Extract top stories from the homepage
    const stories: { title: string; url: string | null }[] = [];

    const rows = page.locator('tr.athing');
    const count = await rows.count();
    const max = Math.min(count, 10);

    for (let i = 0; i < max; i++) {
      const row = rows.nth(i);
      const titleEl = row.locator('span.titleline a').first();
      const title = (await titleEl.textContent())?.trim() ?? '';
      const url = await titleEl.getAttribute('href');
      if (title) {
        stories.push({ title, url: url ?? null });
      }
    }

    return {
      pageTitle,
      storyCount: max,
      stories,
    };
  }
}
