/**
 * Log categories for structured startup and runtime messages.
 *
 * Each category groups log entries by domain of interest so they can be
 * filtered, aggregated, or displayed as a section.  Open for extension:
 * add new members when a new module needs its own category.
 */
export enum LogCategory {
  /** Application bootstrap / lifecycle phase */
  BOOT = 'BOOT',
  /** MongoDB database connection and transactions */
  DB = 'MongoDB',
  /** Authentication (JWT, Magic Link, 2FA, Passkeys) */
  AUTH = 'Auth',
  /** Playwright browser automation */
  PLAYWRIGHT = 'Playwright',
  /** Feature availability / capability flags */
  FEATURE = 'Feature',
  /** Configuration and environment variables */
  CONFIG = 'Config',
  /** HTTP API endpoints and Swagger */
  API = 'API',
}
