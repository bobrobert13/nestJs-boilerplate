/**
 * Generic result wrapper for scraping operations.
 * Callers should check `success` before accessing `data`.
 *
 * @typeParam T - The type of scraped data on success
 */
export interface ScrapingResult<T = unknown> {
  /** Whether the scraping operation succeeded */
  success: boolean;
  /** Scraped payload (present only on success) */
  data?: T;
  /** Error description (present only on failure) */
  error?: string;
}
