export interface PlaywrightOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}
