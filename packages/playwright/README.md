<!-- @common/playwright — status: partial -->

# @common/playwright

Playwright browser automation module for NestJS — web scraping, testing, and automated interactions.

## Features

- **Headless Chromium** — Automated browser with configurable viewport and user agent
- **Page management** — Create pages, navigate, wait for elements
- **Automatic browser lifecycle** — Initializes on module init, closes on module destroy
- **Configurable timeouts** — Global and per-action timeout configuration
- **Chromium path override** — Supports custom browser installations

## Installation

```bash
npm install @common/playwright
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlaywrightModule } from '@common/playwright';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PlaywrightModule,
  ],
})
export class AppModule {}
```

### 2. Configure .env

```env
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
PLAYWRIGHT_RETRIES=3
```

### 3. Use in any service

```typescript
import { PlaywrightService } from '@common/playwright';

@Injectable()
export class ScrapingService {
  constructor(private readonly playwright: PlaywrightService) {}

  async scrapeProduct(url: string) {
    const page = await this.playwright.createPage(url);

    const title = await page.locator('h1.product-title').textContent();
    const price = await page.locator('span.price').textContent();

    return { title, price };
  }
}
```

---

## Browser Lifecycle

```
onModuleInit()          → initialize()
                           ├── launch chromium
                           └── create browser context

onModuleDestroy()       → close()
                           ├── close page
                           ├── close context
                           └── close browser
```

The browser is shared across the application. Each `createPage()` call closes the previous page and creates a new one in the same context.

---

## Methods

### createPage(url)

Opens a URL and returns the page for interaction.

```typescript
const page = await playwright.createPage('https://example.com');
// Returns: Page
// Side effect: closes any existing page
```

### waitForSelector(selector, timeout?)

Waits for an element to appear in the DOM.

```typescript
await playwright.waitForSelector('.loading-spinner', 5000);
// Throws if element not found within timeout
```

### close()

Closes the current page and browser. Called automatically on module destroy.

```typescript
await playwright.close();
// After this, createPage() will re-initialize the browser
```

---

## Page Operations

After `createPage()`, use the returned Playwright `Page` directly:

```typescript
const page = await playwright.createPage('https://news.ycombinator.com');

// Click
await page.click('a.story-link');

// Type
await page.fill('input.search', 'playwright best practices');

// Get text
const title = await page.locator('h1').textContent();

// Get attribute
const href = await page.locator('a').first().getAttribute('href');

// Screenshot
await page.screenshot({ path: 'screenshot.png' });

// Evaluate (run JS in browser)
const links = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a')).map(a => a.href)
);
```

---

## Web Scraping Pattern

```typescript
async scrapeListPage(url: string): Promise<string[]> {
  const page = await this.playwright.createPage(url);

  await page.waitForSelector('table.results');

  const items = await page.locator('table.results tr.item').all();
  const results: string[] = [];

  for (const item of items) {
    const title = await item.locator('.title').textContent();
    results.push(title.trim());
  }

  return results;
}
```

---

## Configuration Options

```typescript
interface PlaywrightOptions {
  headless?: boolean;           // Run without GUI (default: true)
  timeout?: number;            // Default timeout in ms (default: 30000)
  viewport?: { width: number; height: number };  // Browser viewport
  userAgent?: string;          // Custom user agent string
  acceptDownloads?: boolean;   // Allow file downloads (default: false)
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PLAYWRIGHT_HEADLESS` | `true` | Run browser without GUI |
| `PLAYWRIGHT_TIMEOUT` | `30000` | Default timeout (ms) |
| `PLAYWRIGHT_RETRIES` | `3` | Retry count on failure |
| `PLAYWRIGHT_BROWSERS_PATH` | — | Custom Chromium path |

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Executable doesn't exist` | Chromium not installed | Run `npx playwright install chromium` |
| `Browser closed unexpectedly` | Memory pressure | Set `PLAYWRIGHT_HEADLESS=true` |
| `waitForSelector timeout` | Element never appeared | Increase timeout or check selector |
| `Failed to navigate` | Invalid URL or network | Verify URL is accessible |
| `Cannot find chromium` | Custom path misconfigured | Set `PLAYWRIGHT_BROWSERS_PATH` to folder containing `chrome-headless-shell` |