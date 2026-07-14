import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

/**
 * Thrown when one or more environment variables are invalid.
 * Extends Error so NestJS ConfigModule can report it cleanly.
 */
class EnvValidationError extends Error {
  constructor(messages: string[]) {
    const prefix =
      messages.length === 1
        ? 'Invalid env var —'
        : `Invalid env vars (${messages.length}) —`;
    super(`${prefix}\n  ${messages.join('\n  ')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Centralized environment variable validation for ConfigModule.forRoot({ validate }).
 *
 * - **REQUIRED** vars missing → accumulates errors and throws once at the end.
 * - **MONGODB_URI** — applies a default with replica set if missing (warns).
 * - **Optional** vars missing → logs a warning and applies a documented default.
 *
 * @param config Raw parsed config object from dotenv / ConfigModule.
 * @returns The validated config object with defaults applied.
 * @throws {EnvValidationError} when any REQUIRED var is missing or invalid.
 */
export function validateEnv(config: Record<string, any>): Record<string, any> {
  const validated = { ...config };
  const errors: string[] = [];

  // ── App ──────────────────────────────────────────────────────
  validated.PORT = validated.PORT ?? '3000';
  const port = Number(validated.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(
      `PORT must be a number between 1–65535 (got "${validated.PORT}")`,
    );
  }

  // ── MongoDB ──────────────────────────────────────────────────
  if (!validated.MONGODB_URI) {
    const defaultUri =
      'mongodb://localhost:27017/boilerplate_db?replicaSet=rs0';
    logger.warn(`MONGODB_URI not set — using default: ${defaultUri}`);
    validated.MONGODB_URI = defaultUri;
  }

  // ── Auth: JWT ─────────────────────────────────────────────────
  if (!validated.JWT_SECRET) {
    const devSecret = 'dev-jwt-secret-do-not-use-in-production-32chars-min';
    logger.warn(
      `JWT_SECRET not set — using INSECURE dev default. DO NOT use this in production.`,
    );
    validated.JWT_SECRET = devSecret;
  }
  if (validated.JWT_SECRET && String(validated.JWT_SECRET).length < 32) {
    logger.warn(
      'JWT_SECRET is shorter than 32 characters — this is INSECURE for production.',
    );
  }
  validated.JWT_ACCESS_TOKEN_TTL = validated.JWT_ACCESS_TOKEN_TTL ?? '900';
  validated.JWT_REFRESH_TOKEN_TTL = validated.JWT_REFRESH_TOKEN_TTL ?? '604800';
  validated.JWT_ISSUER = validated.JWT_ISSUER ?? 'api-nominas';
  validated.JWT_AUDIENCE = validated.JWT_AUDIENCE ?? 'api-nominas';

  // ── Auth: Magic Link ─────────────────────────────────────────
  validated.MAGIC_LINK_ENABLED = validated.MAGIC_LINK_ENABLED ?? 'true';
  validated.MAGIC_LINK_TOKEN_TTL = validated.MAGIC_LINK_TOKEN_TTL ?? '300';

  // ── Auth: OAuth (optional — no defaults, just pass-through) ──

  // ── Auth: Argon2 ─────────────────────────────────────────────
  validated.ARGON2_TYPE = validated.ARGON2_TYPE ?? '2';
  validated.ARGON2_MEMORY_COST = validated.ARGON2_MEMORY_COST ?? '65536';
  validated.ARGON2_TIME_COST = validated.ARGON2_TIME_COST ?? '3';
  validated.ARGON2_PARALLELISM = validated.ARGON2_PARALLELISM ?? '4';

  // ── Auth: 2FA ────────────────────────────────────────────────
  validated.TWO_FACTOR_ISSUER = validated.TWO_FACTOR_ISSUER ?? 'MyApp';
  validated.TWO_FACTOR_ALGORITHM = validated.TWO_FACTOR_ALGORITHM ?? 'SHA1';
  validated.TWO_FACTOR_DIGITS = validated.TWO_FACTOR_DIGITS ?? '6';
  validated.TWO_FACTOR_PERIOD = validated.TWO_FACTOR_PERIOD ?? '30';
  validated.TWO_FACTOR_BACKUP_CODES_COUNT =
    validated.TWO_FACTOR_BACKUP_CODES_COUNT ?? '10';
  validated.TWO_FACTOR_BACKUP_CODES_LENGTH =
    validated.TWO_FACTOR_BACKUP_CODES_LENGTH ?? '10';

  // ── Auth: Passkeys ───────────────────────────────────────────
  validated.PASSKEYS_RP_ID = validated.PASSKEYS_RP_ID ?? 'localhost';
  validated.PASSKEYS_RP_NAME = validated.PASSKEYS_RP_NAME ?? 'MyApp';
  validated.PASSKEYS_RP_ORIGIN =
    validated.PASSKEYS_RP_ORIGIN ?? 'http://localhost:3000';

  // ── Playwright ───────────────────────────────────────────────
  validated.PLAYWRIGHT_HEADLESS = validated.PLAYWRIGHT_HEADLESS ?? 'true';
  validated.PLAYWRIGHT_TIMEOUT = validated.PLAYWRIGHT_TIMEOUT ?? '30000';
  validated.PLAYWRIGHT_RETRIES = validated.PLAYWRIGHT_RETRIES ?? '3';

  // ── Resend ───────────────────────────────────────────────────
  if (!validated.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY is not set. Email sending will be disabled.');
  }
  validated.RESEND_FROM_EMAIL =
    validated.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  validated.RESEND_FROM_NAME = validated.RESEND_FROM_NAME ?? 'My App';

  // ── AI Providers (all optional — provider is chosen at runtime) ──
  // Each key enables its respective provider. No defaults.

  // ── Dynamic Schema ───────────────────────────────────────────
  validated.DYNAMIC_SCHEMA_LEGACY = validated.DYNAMIC_SCHEMA_LEGACY ?? 'false';

  // ── Fail fast if any REQUIRED var is missing ─────────────────
  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  return validated;
}
