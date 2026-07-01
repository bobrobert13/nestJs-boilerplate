/**
 * Configuration options for the Playwright browser service.
 */
export interface PlaywrightOptions {
  /** Run browser in headless mode (default: true) */
  headless?: boolean;
  /** Browser viewport dimensions (default: 1920x1080) */
  viewport?: { width: number; height: number };
  /** Custom User-Agent string */
  userAgent?: string;
  /** Default timeout in milliseconds for navigation and waits (default: 30000) */
  timeout?: number;
  /** Number of retry attempts for transient failures (default: 3) */
  retries?: number;
  /** Delay in milliseconds between retries (default: 1000) */
  retryDelay?: number;
}
