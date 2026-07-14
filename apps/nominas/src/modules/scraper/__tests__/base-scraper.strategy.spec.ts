import { Page } from 'playwright';
import { PlaywrightService } from '@common/playwright';
import { BaseScraperStrategy } from '../strategies/base-scraper.strategy';

/** Concrete subclass for testing the abstract base. */
class TestStrategy extends BaseScraperStrategy {
  readonly name = 'test';
  /** Test stub: matches all URLs. */
  supports(): boolean {
    return true;
  }
  protected getSelectors(): Record<string, string> {
    return { title: 'h1' };
  }
  protected async extractData(page: Page): Promise<Record<string, unknown>> {
    const title = await this.safeText(page, 'h1');
    return { title };
  }
}

describe('BaseScraperStrategy', () => {
  let strategy: TestStrategy;
  let mockPlaywright: jest.Mocked<PlaywrightService>;
  let mockPage: jest.Mocked<Partial<Page>>;

  beforeEach(() => {
    mockPage = {
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      locator: jest.fn().mockReturnValue({
        first: jest.fn().mockReturnThis(),
        textContent: jest.fn().mockResolvedValue('Test Title'),
      }),
    };

    mockPlaywright = {
      createPage: jest.fn().mockResolvedValue(mockPage),
    } as any;

    strategy = new TestStrategy(mockPlaywright);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
    expect(strategy.name).toBe('test');
  });

  describe('scrape', () => {
    it('should navigate, wait for selectors, and extract data', async () => {
      const result = await strategy.scrape('https://example.com');

      expect(mockPlaywright.createPage).toHaveBeenCalledWith(
        'https://example.com',
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('h1', {
        timeout: 10000,
      });
      expect(result.title).toBe('Test Title');
      expect(result.structured).toEqual({ title: 'Test Title' });
      expect(result.scrapedAt).toBeDefined();
    });

    it('should retry on navigation failure', async () => {
      mockPlaywright.createPage
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce(mockPage);

      const result = await strategy.scrape('https://example.com');
      expect(mockPlaywright.createPage).toHaveBeenCalledTimes(2);
      expect(result.title).toBe('Test Title');
    });

    it('should throw after all retries exhausted', async () => {
      mockPlaywright.createPage.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(strategy.scrape('https://example.com')).rejects.toThrow(
        'ECONNREFUSED',
      );
      // maxRetries=2 → 3 attempts total
      expect(mockPlaywright.createPage).toHaveBeenCalledTimes(3);
    });
  });

  describe('safeText', () => {
    it('should return trimmed text', async () => {
      const text = await strategy['safeText'](mockPage as any, 'h1');
      expect(text).toBe('Test Title');
    });

    it('should return empty string on failure', async () => {
      mockPage.locator = jest.fn().mockReturnValue({
        first: jest.fn().mockReturnThis(),
        textContent: jest.fn().mockRejectedValue(new Error('Failed')),
      });
      const text = await strategy['safeText'](mockPage as any, 'h1');
      expect(text).toBe('');
    });
  });
});
