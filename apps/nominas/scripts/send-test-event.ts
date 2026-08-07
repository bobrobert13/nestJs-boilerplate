/**
 * Standalone GlitchTip/Sentry connectivity check.
 *
 * Isolates SDK + DSN + network from the Nest wiring: initializes the SDK
 * with `debug: true`, captures one test error, flushes the transport and
 * reports the result. Inspect the `[Sentry]` debug lines on failure
 * (401/403 = invalid DSN, timeout = network/TLS).
 *
 * Usage:
 *   npx ts-node apps/nominas/scripts/send-test-event.ts
 *   SENTRY_DSN=... npx ts-node apps/nominas/scripts/send-test-event.ts
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/nestjs';

async function main(): Promise<void> {
  // Load the repo-root .env (same file ConfigModule reads at boot).
  dotenv.config();

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    console.error('SENTRY_DSN is not set (checked process env and .env).');
    process.exit(1);
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? 'diagnostic',
    release:
      process.env.SENTRY_RELEASE ?? process.env.npm_package_version ?? '0.0.1',
    debug: true,
  });

  const eventId = Sentry.captureException(
    new Error('GlitchTip connectivity test (safe to resolve)'),
  );
  console.log('Captured event id:', eventId);

  // v10 sends envelopes via the OTel batch processor; give it the full
  // batch interval before flushing.
  await new Promise((resolve) => setTimeout(resolve, 6000));

  const flushed = await Sentry.flush(10_000);
  console.log(
    flushed
      ? 'Flush OK — check the GlitchTip UI.'
      : 'Flush FAILED — see [Sentry] debug lines above.',
  );
  process.exit(flushed ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
