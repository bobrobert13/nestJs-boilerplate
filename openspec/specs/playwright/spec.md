# Playwright Specification

## Purpose

Automatización de navegador para web scraping. Chromium pre-instalado en Docker.

Documentación asociada: `packages/playwright/README.md`

## Requirements

### Page Navigation

The system MUST navigate to URLs using Playwright.

#### Scenario: Navigate and get content

- GIVEN a valid URL
- WHEN `PlaywrightService.navigate(url)` is called
- THEN the system opens a headless browser
- AND navigates to the URL
- AND returns the page content

### Screenshot Capture

The system SHOULD capture screenshots of web pages.

#### Scenario: Take screenshot

- GIVEN a page loaded in the browser
- WHEN `PlaywrightService.screenshot(url)` is called
- THEN the system returns a screenshot buffer

### Scraping Configuration

The system MUST support configurable headless mode, timeouts, and retries.

#### Scenario: Configure scraping options

- GIVEN PLAYWRIGHT_HEADLESS=true, PLAYWRIGHT_TIMEOUT=30000
- WHEN the PlaywrightService is initialized
- THEN the browser runs in headless mode with 30s timeout

## Affected Documentation

- `packages/playwright/README.md`
- `AGENTS.md` — section 3 (Packages Index)
