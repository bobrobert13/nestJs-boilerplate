import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { LogLevel } from '@common/common';

const logger = new Logger('Sentry');

/** Default performance sampling rate applied when the env var is absent/invalid. */
const DEFAULT_TRACES_SAMPLE_RATE = 1;

/**
 * Resolves the package version for the release tag. Reads package.json
 * at runtime (inlined by webpack in prod builds) because
 * `npm_package_version` is only set under npm scripts.
 */
function resolvePackageVersion(): string {
  try {
    const pkg = require('../../../../package.json') as { version?: string };
    return pkg.version || '0.0.1';
  } catch {
    return '0.0.1';
  }
}

/** Release tag sent with every event (issue grouping/version tracking). */
const RELEASE = process.env.npm_package_version || resolvePackageVersion();

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
 * The DSN may point to Sentry SaaS or any Sentry-compatible backend
 * (e.g. GlitchTip) — only the DSN changes.
 *
 * Without `SENTRY_DSN` the SDK is never initialized and the function
 * returns `false` — zero side effects in dev/test. The "disabled"
 * warning is emitted once by `validateEnv` (RESEND pattern).
 *
 * GlitchTip note: sessions require a `release`; the SDK discards them
 * otherwise. `release` defaults to the package version and can be
 * overridden with `SENTRY_RELEASE`. `SENTRY_DEBUG=true` enables SDK
 * transport logging for troubleshooting.
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
    release: process.env.SENTRY_RELEASE?.trim() || RELEASE,
    debug: process.env.SENTRY_DEBUG?.trim() === 'true',
    // GlitchTip Logs panel: structured logs via the standard envelope
    // endpoint (enabled by default; disable with SENTRY_ENABLE_LOGS=false).
    enableLogs: process.env.SENTRY_ENABLE_LOGS?.trim() !== 'false',
    integrations: [Sentry.nestIntegration()],
  });
  logger.log(`Sentry enabled (environment: ${options.environment})`);
  return true;
}

/**
 * Forwards an application log entry to Sentry/GlitchTip as a structured
 * log. No-op when the SDK is disabled. Used as the {@link LogSink} of
 * `AppLogger` so PII is already scrubbed before reaching this point.
 *
 * @param level - Severity level (Sentry log levels).
 * @param message - Scrubbed log message.
 * @param context - Optional Nest logger context (attached as attribute).
 */
export function emitSentryLog(
  level: LogLevel,
  message: string,
  context?: string,
): void {
  if (!Sentry.isEnabled()) return;
  const attributes = context ? { context } : undefined;

  switch (level) {
    case 'trace':
      Sentry.logger.trace(message, attributes);
      break;
    case 'debug':
      Sentry.logger.debug(message, attributes);
      break;
    case 'warn':
      Sentry.logger.warn(message, attributes);
      break;
    case 'error':
      Sentry.logger.error(message, attributes);
      break;
    case 'fatal':
      Sentry.logger.fatal(message, attributes);
      break;
    default:
      Sentry.logger.info(message, attributes);
  }
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
