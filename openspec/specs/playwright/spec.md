# Playwright Specification

## Purpose

Automatizacion de navegador para web scraping y testing. Encapsula Playwright Chromium dentro de un NestJS `Injectable` con lifecycle `onModuleInit` / `onModuleDestroy`.

Configuracion via `PlaywrightOptions` (DI token `PLAYWRIGHT_OPTIONS`) y `ConfigService` para resolver rutas custom de Chromium.

Documentacion asociada: `packages/playwright/README.md`, `AGENTS.md` (seccion 4).

## Requirements

### Page Navigation

The system MUST navigate to URLs using Playwright with `waitUntil: domcontentloaded`.

#### Scenario: Navigate and get content

- GIVEN an initialized `PlaywrightService`
  - AND a valid URL `https://example.com`
- WHEN `playwright.createPage("https://example.com")` is called
- THEN the system opens a Chromium page
  - AND navigates to the URL waiting for `domcontentloaded` event
  - AND returns the `Page` object

#### Scenario: Custom timeout on navigation

- GIVEN `options.timeout = 60000`
- WHEN `createPage(slowUrl)` is called
- THEN the system waits up to 60 seconds before throwing

### Custom Timeout Per Action

The system MUST allow per-action timeout overrides via optional arguments.

#### Scenario: waitForSelector with explicit timeout

- GIVEN a page is open
- WHEN `playwright.waitForSelector(".slow", 60000)` is called with 60s timeout
- THEN the system waits up to 60 seconds before throwing
  - AND overrides the global config timeout

#### Scenario: waitForSelector uses default timeout when not specified

- GIVEN no `timeout` argument
- WHEN `playwright.waitForSelector(".fast")` is called
- THEN the system uses `options.timeout ?? DEFAULT_TIMEOUT` (30000ms)

### Single Page Lifecycle

The system MUST enforce a single-page-per-context policy. Creating a new page closes the previous one.

#### Scenario: createPage closes previous page

- GIVEN a page is currently open from `createPage("https://A.com")`
- WHEN `createPage("https://B.com")` is called
- THEN the system closes the previous page
  - AND opens a new page for URL B in the same context

### Browser Lifecycle Management

The system MUST implement NestJS lifecycle hooks for automatic initialization and cleanup.

#### Scenario: onModuleInit launches browser

- GIVEN `PlaywrightModule` is imported in `AppModule`
- WHEN the NestJS application starts
- THEN `PlaywrightService.onModuleInit()` is called automatically
  - AND launches Chromium via `chromium.launch({ headless: true, ... })`

#### Scenario: onModuleDestroy closes browser

- GIVEN an initialized Playwright service
- WHEN the application shuts down (SIGTERM)
- THEN `PlaywrightService.onModuleDestroy()` is called
  - AND closes page, context, and browser in order

#### Scenario: initialize() is idempotent

- GIVEN a browser is already initialized
- WHEN `initialize()` is called again
- THEN the system returns early without relaunching

### Re-initialization After Close

The system MUST support re-initialization after explicit `close()`.

#### Scenario: createPage after close re-initializes

- GIVEN the browser was closed via `playwright.close()`
- WHEN `playwright.createPage(url)` is called
- THEN `ensureInitialized()` detects the null browser
  - AND launches a fresh Chromium automatically

### Configuration

The system MUST support configurable headless, viewport, userAgent, acceptDownloads, and timeout.

#### Scenario: Headless mode

- GIVEN `options.headless = true`
- WHEN `initialize()` runs
- THEN Chromium runs without GUI

#### Scenario: Custom viewport

- GIVEN `options.viewport = { width: 1280, height: 720 }`
- WHEN the browser context is created
- THEN the page renders at 1280x720

#### Scenario: Default userAgent when not specified

- GIVEN no `options.userAgent`
- WHEN the browser context is created
- THEN the default Chrome 120 user agent is used

#### Scenario: Chromium path override from config

- GIVEN `PLAYWRIGHT_BROWSERS_PATH` env var is set
- WHEN `getChromiumPath()` is called
- THEN it runs `find` to locate `chrome-headless-shell`
  - AND returns the resolved path

### Error Handling

The system MUST log errors via NestJS `Logger` and throw on unrecoverable failures.

#### Scenario: Navigation failure logs and rethrows

- GIVEN a URL that returns a network error
- WHEN `createPage(badUrl)` is called
- THEN the system logs the error with the URL
  - AND throws the original Playwright error

#### Scenario: Browser launch failure logs and throws

- GIVEN Chromium cannot be launched (missing executable)
- WHEN `initialize()` runs
- THEN the system logs `Failed to initialize browser`
  - AND throws the cause error

### usePage Guard

The system MUST guard operations that require an open page.

#### Scenario: waitForSelector without page throws

- GIVEN no page is open
- WHEN `waitForSelector("body")` is called
- THEN the system throws `Error: No page exists. Call createPage() or navigate() first.`

## Affected Documentation

- `packages/playwright/README.md`
- `AGENTS.md` — section 4 (Packages Index)
