# Spec: Logging — Startup Log Improvements

> Delta spec for `@common/common` — logging utilities.
> Affects: `@common/common`, `@common/auth`, `@common/database`, `@common/playwright`, `apps/nominas`

## Requirements

### R1: LogCategory Enum
The system MUST export a `LogCategory` enum from `@common/common` with at least the following members:

- `BOOT` — Application bootstrap phase
- `DB` — Database (MongoDB) operations
- `AUTH` — Authentication (JWT, Magic Link, 2FA, Passkeys)
- `PLAYWRIGHT` — Playwright browser automation
- `FEATURE` — Feature availability / capability flags
- `CONFIG` — Configuration and environment
- `API` — HTTP API / Swagger

The enum SHOULD be extensible (open for new members without breaking existing code).

### R2: BootstrapLogger Utility
The system MUST export a `BootstrapLogger` class from `@common/common` with the following static methods:

- `log(category: LogCategory, message: string, detail?: string): void` — Emit a single log line with consistent format
- `step(step: string, durationMs?: number): void` — Log a step during bootstrap with optional timing
- `section(title: string): void` — Start a visually delimited section grouping related messages
- `summary(items: Record<string, string>): void` — Emit a key-value summary block

The format MUST be:
- Default: rich format with box-drawing characters for sections and aligned key-value pairs
- Fallback: if `process.env.LOG_STYLE === 'plain'`, use simple `[Category] Message` text format

### R3: Enhanced main.ts Bootstrap
The application bootstrap in `apps/nominas/src/main.ts` MUST:

1. SHOW a startup banner with application name and version
2. LOG each bootstrap phase (env validation, database, modules) with timing
3. SHOW a feature-availability summary at the end
4. SHOW the HTTP endpoint and Swagger URL in the summary

### R4: AuthModule Startup Logs
`AuthModule.onModuleInit()` MUST use `BootstrapLogger.log(LogCategory.AUTH, ...)` for:
- Loading config
- Feature availability (JWT, Magic Link, 2FA, Passkeys)

### R5: DatabaseService Startup Logs
`DatabaseService.onModuleInit()` MUST use `BootstrapLogger.log(LogCategory.DB, ...)` for:
- Connection attempt with URI (sanitized — password masked)
- Connection success or failure
- Reconnection events

### R6: PlaywrightService Startup Logs
`PlaywrightService.onModuleInit()` MUST use `BootstrapLogger.log(LogCategory.PLAYWRIGHT, ...)` for:
- Chromium path resolution
- Browser launch success or failure
- Context creation

### R7: Aggregated Feature Summary
The `AppModule` (or a dedicated `AppStartupService`) MUST implement `OnApplicationBootstrap` and emit a grouped summary of all feature availability:
- MongoDB: connected or error
- Playwright: initialized or disabled
- Auth: list of enabled methods
- Inngest: configured or disabled
- Resend: configured or disabled
- Dynamic Schema: enabled or legacy mode active
- AI Providers: list of configured providers

### R8: Backward Compatibility
All existing log messages MUST be preserved. New messages are ADDED alongside, not replacing, existing messages.
