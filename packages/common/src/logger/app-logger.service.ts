import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

/**
 * PR3 / M4 / REQ-log-scrubbing-1,2 — global NestJS logger that scrubs
 * PII and secrets before they reach the log sink.
 *
 * Patterns redacted:
 *   - `email=<value>`, `password=<value>`, `token=<value>` → `[REDACTED]`
 *   - standalone email addresses → `[EMAIL]`
 *
 * BootstrapLogger is intentionally NOT extended through AppLogger — its
 * route-map output must remain unchanged.
 */
const KV_REDACTION = /(email|password|token)=([^\s,;]+)/gi;
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const REDACTED = '[REDACTED]';

/** Severity levels forwarded to the external log sink. */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * External sink receiving already-scrubbed log entries (e.g. an
 * observability backend). Must never throw — failures are swallowed.
 */
export type LogSink = (
  level: LogLevel,
  message: string,
  context?: string,
) => void;

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger extends ConsoleLogger {
  /** Process-wide sink shared by every AppLogger instance. */
  private static externalSink: LogSink | undefined;

  /**
   * Registers the process-wide external log sink (or clears it with
   * `undefined`). Kept SDK-agnostic: the wiring lives in the app layer.
   *
   * @param sink - The sink to forward scrubbed log entries to.
   */
  public static setExternalSink(sink: LogSink | undefined): void {
    AppLogger.externalSink = sink;
  }

  /**
   * Forwards a scrubbed entry to the external sink. A failing sink
   * never breaks application logging.
   */
  private forward(level: LogLevel, message: unknown, context?: string): void {
    const sink = AppLogger.externalSink;
    if (!sink || typeof message !== 'string') return;
    try {
      sink(level, message, context);
    } catch {
      // A failing sink must never break application logging.
    }
  }

  /**
   * Resolves the caller context. When this logger is the global
   * override (`app.useLogger`), Nest appends the caller context of
   * `new Logger('X')` instances as the last optional parameter —
   * same convention as `ConsoleLogger.printMessage`.
   */
  private resolveContext(params: unknown[]): string | undefined {
    if (this.context) return this.context;
    const last = params[params.length - 1];
    return typeof last === 'string' ? last : undefined;
  }

  private scrub(input: unknown): unknown {
    if (typeof input !== 'string') return input;
    return input
      .replace(KV_REDACTION, (_m, k) => `${k}=${REDACTED}`)
      .replace(EMAIL_PATTERN, '[EMAIL]');
  }

  /** Logs at info level: scrubs PII, prints, and forwards to the sink. */
  override log(message: unknown, ...optionalParams: unknown[]): void {
    const scrubbed = this.scrub(message) as string;
    super.log(scrubbed, ...optionalParams.map((p) => this.scrub(p)));
    this.forward('info', scrubbed, this.resolveContext(optionalParams));
  }
  /** Logs at warn level: scrubs PII, prints, and forwards to the sink. */
  override warn(message: unknown, ...optionalParams: unknown[]): void {
    const scrubbed = this.scrub(message) as string;
    super.warn(scrubbed, ...optionalParams.map((p) => this.scrub(p)));
    this.forward('warn', scrubbed, this.resolveContext(optionalParams));
  }
  /** Logs at error level: scrubs PII, prints, and forwards to the sink. */
  override error(message: unknown, ...optionalParams: unknown[]): void {
    const scrubbed = this.scrub(message) as string;
    super.error(scrubbed, ...optionalParams.map((p) => this.scrub(p)));
    this.forward('error', scrubbed, this.resolveContext(optionalParams));
  }
  /** Logs at debug level: scrubs PII, prints, and forwards to the sink. */
  override debug(message: unknown, ...optionalParams: unknown[]): void {
    const scrubbed = this.scrub(message) as string;
    super.debug(scrubbed, ...optionalParams.map((p) => this.scrub(p)));
    this.forward('debug', scrubbed, this.resolveContext(optionalParams));
  }
  /** Logs at verbose level: scrubs PII, prints, and forwards to the sink. */
  override verbose(message: unknown, ...optionalParams: unknown[]): void {
    const scrubbed = this.scrub(message) as string;
    super.verbose(scrubbed, ...optionalParams.map((p) => this.scrub(p)));
    this.forward('trace', scrubbed, this.resolveContext(optionalParams));
  }
}
