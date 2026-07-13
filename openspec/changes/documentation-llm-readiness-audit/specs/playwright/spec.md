# Playwright Specification — DELTA

## ADDED Requirements

### Custom Timeout Per Action

The system MUST allow per-action timeout overrides independent of the global
configuration.

#### Scenario: waitForSelector with custom timeout

- GIVEN a slow-loading element that takes 45 seconds to appear
- WHEN `playwright.waitForSelector(''.slow'', 60000)` is called with a 60s timeout
- THEN the system waits up to 60 seconds before throwing
- AND does not use the default `PLAYWRIGHT_TIMEOUT` (30000ms)

#### Scenario: Default timeout is used when not specified

- GIVEN a selector that appears within 5 seconds
- WHEN `playwright.waitForSelector(''.fast'')` is called without arguments
- THEN the system uses the module-level default timeout (30s)

### Browser Re-initialization

The system MUST support re-initialization after explicit `close()`.

#### Scenario: close() then createPage() reinitializes browser

- GIVEN a closed browser instance via `playwright.close()`
- WHEN `playwright.createPage(''https://example.com'')` is called
- THEN the system relaunches Chromium automatically
- AND returns a valid `Page` object without throwing

#### Scenario: Lifecycle hooks fire on re-initialization

- GIVEN a closed browser instance
- WHEN `createPage()` triggers re-init
- THEN `onModuleInit` is invoked on the new instance

### Page Lifecycle Management

The system MUST enforce a single-page-per-context policy to prevent memory leaks.

#### Scenario: createPage() closes previous page

- GIVEN an existing page open in the browser context at URL A
- WHEN `createPage(''https://B.com'')` is called with a new URL
- THEN the system closes the previous page at URL A
- AND opens a new page at URL B in the same context

#### Scenario: Concurrent pages rejected

- GIVEN an open page in the context
- WHEN a caller attempts to call `createPage()` while another caller holds the page reference
- THEN the system serializes the calls (mutual exclusion via single-page policy)

### Error Scenarios

The system MUST handle browser failures gracefully.

#### Scenario: Browser crash detected

- GIVEN the underlying Chromium process dies unexpectedly
- WHEN a subsequent `createPage()` is attempted
- THEN the system detects the dead process
- AND re-initializes a fresh browser automatically

#### Scenario: Network timeout during navigation

- GIVEN a URL that never resolves
- WHEN `createPage(unreachableUrl)` is called
- THEN the system throws after the configured timeout expires