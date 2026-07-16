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

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger extends ConsoleLogger {
  private scrub(input: unknown): unknown {
    if (typeof input !== 'string') return input;
    return input
      .replace(KV_REDACTION, (_m, k) => `${k}=${REDACTED}`)
      .replace(EMAIL_PATTERN, '[EMAIL]');
  }

  override log(message: unknown, ...optionalParams: unknown[]): void {
    super.log(this.scrub(message) as string, ...optionalParams.map((p) => this.scrub(p)));
  }
  override warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(this.scrub(message) as string, ...optionalParams.map((p) => this.scrub(p)));
  }
  override error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(this.scrub(message) as string, ...optionalParams.map((p) => this.scrub(p)));
  }
  override debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(this.scrub(message) as string, ...optionalParams.map((p) => this.scrub(p)));
  }
  override verbose(message: unknown, ...optionalParams: unknown[]): void {
    super.verbose(this.scrub(message) as string, ...optionalParams.map((p) => this.scrub(p)));
  }
}