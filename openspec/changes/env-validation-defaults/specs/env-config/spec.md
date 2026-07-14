# Spec: Environment Configuration Validation

## Scenario: Missing required env var at startup
- GIVEN the app starts with `.env` missing `JWT_SECRET` or `MONGODB_URI`
- WHEN `ConfigModule.forRoot()` runs with `validate`
- THEN the app SHALL log an error and throw, preventing startup

## Scenario: Missing optional env var at startup
- GIVEN the app starts with `.env` missing `RESEND_API_KEY`
- WHEN `ConfigModule.forRoot()` runs with `validate`
- THEN the app SHALL log a warning and continue with a default empty value

## Scenario: Playwright config via registerAs
- GIVEN `@common/playwright` is imported
- WHEN `PlaywrightModule` initializes
- THEN `PLAYWRIGHT_HEADLESS`, `PLAYWRIGHT_TIMEOUT`, `PLAYWRIGHT_RETRIES` env vars SHALL be available under the `playwright` namespace
- AND missing vars SHALL fall back to sensible defaults (headless: true, timeout: 30000, retries: 3)

## Scenario: .env.example exists
- GIVEN a new developer clones the repo
- WHEN they look for environment configuration
- THEN `.env.example` SHALL exist with all documented vars and required/optional markers
