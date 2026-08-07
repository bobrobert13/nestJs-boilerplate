import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

const logger = new Logger('Sentry');

/** Default performance sampling rate applied when the env var is absent/invalid. */
const DEFAULT_TRACES_SAMPLE_RATE = 1;

/**
 * Sentry options resolved from environment variables.
 * Subset of `@sentry/nestjs` `NodeClientOptions` managed by this module.
 */
export interface SentryEnvOptions {
  /** Data Source Name — required to enable Sentry. */
  dsn: string;
  /** Environment tag reported with every event. */
  environment: string;
  /** Performance tracing sample rate, clamped to [0, 1]. */
  tracesSampleRate: number;
}

/**
 * Parses `SENTRY_TRACES_SAMPLE_RATE` into a sampling rate.
 *
 * - Missing, empty or non-numeric values → {@link DEFAULT_TRACES_SAMPLE_RATE}.
 * - Numeric values are clamped to the [0, 1] range.
 *
 * @param raw - Raw env var value.
 * @returns Sampling rate between 0 and 1.
 */
export function parseTracesSampleRate(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_TRACES_SAMPLE_RATE;
  const value = Number(raw);
  if (Number.isNaN(value)) return DEFAULT_TRACES_SAMPLE_RATE;
  return Math.min(1, Math.max(0, value));
}

/**
 * Builds the Sentry client options from the given environment.
 *
 * Sentry is enabled only when `SENTRY_DSN` is a non-empty string.
 * `SENTRY_ENVIRONMENT` takes precedence over `NODE_ENV`; both default
 * to `'development'`.
 *
 * @param env - Environment map (usually `process.env`).
 * @returns The resolved options, or `null` when Sentry must stay disabled.
 */
export function buildSentryOptions(
  env: Record<string, string | undefined>,
): SentryEnvOptions | null {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return null;

  const environment =
    env.SENTRY_ENVIRONMENT?.trim() || env.NODE_ENV || 'development';

  return {
    dsn,
    environment,
    tracesSampleRate: parseTracesSampleRate(env.SENTRY_TRACES_SAMPLE_RATE),
  };
}

/**
 * Initializes the Sentry SDK from `process.env` (runs before
 * `ConfigModule` validation, so env is read directly).
 *
 * Without `SENTRY_DSN` the SDK is never initialized and the function
 * returns `false` — zero side effects in dev/test. The "disabled"
 * warning is emitted once by `validateEnv` (RESEND pattern).
 *
 * Note (bundled builds): with webpack/ts-node, `express` is always
 * loaded before this runs, so the SDK logs a one-time "express is
 * not instrumented" notice when tracing is enabled. It only disables
 * express route perf spans — error capture is unaffected.
 *
 * @returns `true` when Sentry was initialized, `false` when disabled.
 */
export function initSentry(): boolean {
  const options = buildSentryOptions(process.env);
  if (!options) {
    return false;
  }

  Sentry.init({
    ...options,
    integrations: [Sentry.nestIntegration()],
  });
  logger.log(`Sentry enabled (environment: ${options.environment})`);
  return true;
}

/**
 * Captures an exception with Sentry only when the SDK is enabled.
 * Safe to call before `initSentry()` — no-op in dev/test.
 *
 * @param exception - The exception to report.
 */
export function captureException(exception: unknown): void {
  if (Sentry.isEnabled()) {
    Sentry.captureException(exception);
  }
}

/**
 * Registers the Express-level Sentry error handler when Sentry is
 * enabled. Acts as a safety net for errors escaping the Nest
 * exception layer (e.g. pre-router middleware); handler exceptions
 * are reported via the `DatabaseExceptionFilter` capture hook.
 *
 * @param app - The initialized Nest application.
 * @param enabled - Whether Sentry was initialized at bootstrap.
 */
export function attachSentryErrorHandler(
  app: INestApplication,
  enabled: boolean,
): void {
  if (enabled) {
    Sentry.setupExpressErrorHandler(app);
  }
}
