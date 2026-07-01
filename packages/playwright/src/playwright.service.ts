import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { PLAYWRIGHT_OPTIONS } from './constants/playwright.constants';
import type { PlaywrightOptions } from './interfaces/playwright-options.interface';

/**
 * Browser automation service wrapping Playwright Chromium.
 *
 * Manages the full browser lifecycle: launches Chromium on module init,
 * creates a persistent context with configurable viewport/user-agent,
 * and tears everything down on module destroy.
 *
 * @example
 * ```typescript
 * const page = await playwright.createPage('https://example.com');
 * await playwright.waitForSelector('h1');
 * const content = await page.content();
 * ```
 */
@Injectable()
export class PlaywrightService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightService.name);
  private readonly DEFAULT_TIMEOUT = 30000;

  /** Active Chromium browser instance. Initialized lazily on first use. */
  public browser: Browser | null = null;
  /** Default browser context with configured viewport and user agent. */
  public context: BrowserContext | null = null;
  /** Currently active page. Only one page is kept at a time. */
  public page: Page | null = null;

  constructor(
    @Inject(PLAYWRIGHT_OPTIONS)
    private readonly options: PlaywrightOptions,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  /**
   * Launches the Chromium browser and creates a persistent context.
   * Safe to call multiple times — skips if already initialized.
   *
   * Applies configured viewport, user agent, and Chromium launch flags
   * (`--no-sandbox`, `--disable-dev-shm-usage`, etc.).
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      const browserOptions: Parameters<typeof chromium.launch>[0] = {
        headless: this.options.headless ?? true,
        executablePath: this.getChromiumPath(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
        ],
      };

      this.logger.log(
        `Launching Chromium from: ${browserOptions.executablePath || 'default'}`,
      );
      this.browser = await chromium.launch(browserOptions);
      this.logger.log('Browser initialized successfully');

      const viewport = this.options.viewport ?? { width: 1920, height: 1080 };
      const userAgent =
        this.options.userAgent ??
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      this.context = await this.browser.newContext({
        viewport,
        userAgent,
        acceptDownloads: false,
      });

      this.logger.log('Browser context created successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser', error);
      throw error;
    }
  }

  /**
   * Creates a new page and navigates to the given URL.
   * Closes the previous page if one exists.
   *
   * @param url - Target URL to navigate to
   * @returns The new Playwright Page instance
   */
  async createPage(url: string): Promise<Page> {
    await this.ensureInitialized();

    if (!this.context) {
      throw new Error('Browser context is not initialized');
    }

    if (this.page) {
      await this.page.close();
    }

    this.page = await this.context.newPage();

    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout ?? this.DEFAULT_TIMEOUT,
      });
    } catch (error) {
      this.logger.error(`Failed to navigate to ${url}`, error);
      throw error;
    }

    return this.page;
  }

  /**
   * Waits for a CSS selector to appear on the current page.
   *
   * @param selector - CSS selector to wait for
   * @param timeout - Max wait time in ms (falls back to configured/default timeout)
   * @throws If the selector does not appear within the timeout
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.ensurePageExists();
    const page = this.page!;

    await page.waitForSelector(selector, {
      timeout: timeout ?? this.options.timeout ?? this.DEFAULT_TIMEOUT,
    });
  }

  /**
   * Closes the current page, browser context, and browser instance.
   * Resets all public properties to null.
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed successfully');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.browser) {
      await this.initialize();
    }
  }

  private async ensurePageExists(): Promise<void> {
    if (!this.page) {
      throw new Error('No page exists. Call createPage() or navigate() first.');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getChromiumPath(): string | undefined {
    const browsersPath = this.configService.get<string>(
      'PLAYWRIGHT_BROWSERS_PATH',
    );

    if (browsersPath) {
      const { execSync } = require('child_process');
      try {
        const result = execSync(
          `find ${browsersPath} -name "chrome-headless-shell" -type f 2>/dev/null | head -1`,
          { encoding: 'utf8' },
        ).trim();

        if (result) {
          this.logger.log(`Found Chromium at: ${result}`);
          return result;
        }
      } catch (error) {
        this.logger.warn(
          'Could not find chromium executable, using default',
          error,
        );
      }
    }

    return undefined;
  }
}
