import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BootstrapLogger, LogCategory } from "@common/common";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import { PLAYWRIGHT_OPTIONS } from "./constants/playwright.constants";
import { execSync } from 'child_process';
import type { PlaywrightOptions } from "./interfaces/playwright-options.interface";

/**
 * NestJS wrapper around Playwright Chromium for browser automation.
 * Manages browser lifecycle (launch/close), single-page navigation and selector waiting.
 * Configurable via PLAYWRIGHT_HEADLESS env var (default: headless).
 * @see PlaywrightModule
 */
@Injectable()
export class PlaywrightService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightService.name);
  private readonly DEFAULT_TIMEOUT = 30000;
  public browser: Browser | null = null;
  public context: BrowserContext | null = null;
  public page: Page | null = null;
  /**
   * Injects PlaywrightOptions via the PLAYWRIGHT_OPTIONS DI token and ConfigService for env-driven overrides.
   * @param options PlaywrightOptions resolved by the module factory.
   * @param configService Nest ConfigService used to read env vars at runtime.
   */
  constructor(
    @Inject(PLAYWRIGHT_OPTIONS)
    private readonly options: PlaywrightOptions,
    private readonly configService: ConfigService,
  ) {}

  /** NestJS lifecycle: launches Chromium on boot. */
  async onModuleInit(): Promise<void> { await this.initialize(); }

  /** NestJS lifecycle: closes the browser gracefully on shutdown. */
  async onModuleDestroy(): Promise<void> { await this.close(); }

  /**
   * Launches Chromium with the configured PlaywrightOptions and creates a shared browser context.
   * Idempotent: subsequent calls are no-ops while the browser is alive.
   * @throws On launch failure (e.g. missing browser binary).
   */
  async initialize(): Promise<void> {
    if (this.browser) { return; }
    try {
      const browserOptions = {
        headless: this.options.headless ?? true,
        executablePath: this.getChromiumPath(),
        args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-accelerated-2d-canvas"],
      };
      this.logger.log(`Launching Chromium from: ${browserOptions.executablePath || "default"}`);
      this.browser = await chromium.launch(browserOptions);
      this.logger.log("Browser initialized successfully");
      BootstrapLogger.log(LogCategory.PLAYWRIGHT, 'Chromium initialized', browserOptions.headless ? 'headless' : 'headed');
      const viewport = this.options.viewport ?? { width: 1920, height: 1080 };
      const userAgent = this.options.userAgent ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      this.context = await this.browser.newContext({ viewport, userAgent, acceptDownloads: false });
      this.logger.log("Browser context created successfully");
    } catch (error) {
      this.logger.error("Failed to initialize browser", error);
      throw error;
    }
  }

  /**
   * Navigates to the given URL and returns the live Page.
   * Single-page policy: closes the previous page if any.
   * @param url Absolute URL to navigate to.
   * @returns The Playwright Page ready for locators/interactions.
   */
  async createPage(url: string): Promise<Page> {
    await this.ensureInitialized();
    if (!this.context) { throw new Error('Browser context is not initialized'); }
    if (this.page) { await this.page.close(); }
    this.page = await this.context.newPage();
    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout ?? this.DEFAULT_TIMEOUT,
      });
    } catch (error) {
      this.logger.error('Failed to navigate to ' + url, (error as Error).stack);
      throw error;
    }
    return this.page;
  }

  /**
   * Waits for a CSS selector to appear in the DOM.
   * @param selector CSS selector to wait for.
   * @param timeout Optional per-call timeout in ms.
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.ensurePageExists();
    const page = this.page!;
    await page.waitForSelector(selector, {
      timeout: timeout ?? this.options.timeout ?? this.DEFAULT_TIMEOUT,
    });
  }

  /**
   * Closes the current page, context, and Chromium process.
   * Called automatically on module destroy.
   */
  async close(): Promise<void> {
    if (this.page) { await this.page.close(); this.page = null; }
    if (this.context) { await this.context.close(); this.context = null; }
    if (this.browser) { await this.browser.close(); this.browser = null; this.logger.log('Browser closed successfully'); }
  }

  /** Ensures the browser is initialized; lazily calls initialize(). @internal */
  private async ensureInitialized(): Promise<void> { if (!this.browser) { await this.initialize(); } }

  /** Ensures a page is open. @internal */
  private async ensurePageExists(): Promise<void> { if (!this.page) { throw new Error('No page exists. Call createPage() or navigate() first.'); } }

  /**
   * Resolves the absolute path to chrome-headless-shell.
   * Reads from the namespaced 'playwright.browsersPath' config.
   * On Windows, relies on Playwright's built-in browser discovery.
   * @internal
   */
  private getChromiumPath(): string | undefined {
    const pwConfig = this.configService.get<{ browsersPath?: string }>('playwright');
    const browsersPath = pwConfig?.browsersPath;
    if (browsersPath) {
      if (process.platform !== 'win32') {
        try {
          const result = execSync(
            'find ' + browsersPath + ' -name chrome-headless-shell -type f 2>/dev/null | head -1',
            { encoding: 'utf8' },
          ).trim();
          if (result) {
            this.logger.log('Found Chromium at: ' + result);
            return result;
          }
        } catch (error) {
          this.logger.warn('Could not find chromium executable, using default', (error as Error).stack);
        }
      } else {
        this.logger.debug('Windows detected - relying on Playwright built-in browser discovery');
      }
    }
    return undefined;
  }
}
