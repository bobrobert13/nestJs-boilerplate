/**
 * Definition of a scheduled scrape job.
 * Used by {@link ScraperCronService} for recurring execution.
 */
export interface ScrapeJob {
  /** Unique job identifier. */
  id: string;
  /** Target URL to scrape. */
  url: string;
  /** Cron expression, e.g. every 6 hours. */
  cronExpression: string;
  /** Optional strategy name override. Falls back to auto-detection when omitted. */
  strategyName?: string;
  /** Whether the job is active. */
  enabled: boolean;
}
