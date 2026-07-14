# Proposal: Improve Startup Logs

## What

Improve the application startup log messages across the entire boilerplate — better structured, grouped by domain of interest, and extensible for future modules. Includes a lightweight `LogCategory` taxonomy and a `BootstrapLogger` utility.

## Why

Current startup logging is fragmented, inconsistent, and lacks a unified summary:

| Problem | Example |
|---------|---------|
| Fragmented output | `main.ts` logs two lines, `AuthModule` logs three, `DatabaseService` logs several — no single view |
| No categories | Log messages are just strings — can't filter by domain (DB, Auth, Playwright) |
| No extensibility | Each new module repeats ad-hoc pattern |
| No availability summary | No single place showing what features are enabled/disabled |
| No timing | No way to see how long each phase took |

## Scope

### In scope

- Create `LogCategory` enum in `@common/common`
- Create `BootstrapLogger` utility in `@common/common` (static helper, zero dependencies)
- Enhance `main.ts` bootstrap with rich startup banner + timing
- Standardize `AuthModule.onModuleInit()` logs to use categories
- Standardize `DatabaseService.onModuleInit()` logs to use categories
- Standardize `PlaywrightService.onModuleInit()` logs to use categories
- Add `AppModule.onApplicationBootstrap()` for aggregated feature-availability summary
- Update `CHANGELOG.md`
- Update `AGENTS.md` status dashboard
- Update `packages/common/README.md` if API surface changes

### Out of scope

- Replacing NestJS `Logger` — we keep the built-in logger, just wrap formatting
- Adding external logging libraries (pino, winston) — that's a separate change
- Request-context logging (CLS/Pino) — out of scope for this change
- Modifying existing service logs beyond startup (CRUD logs stay as-is)
- Removing existing `console.log` calls in scripts (those are tooling, not app code)

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing log parsers | All existing log messages preserved; only *new* enriched messages added alongside original ones |
| Over-engineering a tiny concern | Design is intentionally minimal — a single enum + a static helper class, no DI, no new dependencies |
| Category enum becomes a dumping ground | Enum is open for extension but kept flat; reviewed at PR time |

## Affected Packages

| Package | Impact |
|---------|--------|
| `@common/common` | New exports: `LogCategory` enum, `BootstrapLogger` class |
| `@common/auth` | `AuthModule.onModuleInit()` uses `BootstrapLogger` |
| `@common/database` | `DatabaseService` uses `BootstrapLogger` for connect/success logs |
| `@common/playwright` | `PlaywrightService` uses `BootstrapLogger` for init logs |
| `apps/nominas` | `main.ts` enhanced banner; `app.module.ts` gets `onApplicationBootstrap()` |

## Rollback Plan

If the enriched startup logs cause issues in production (e.g., log aggregation tools choke on box-drawing characters), set `LOG_STYLE=plain` env var to fall back to minimal format. The `BootstrapLogger` reads this env var.

```typescript
// Fallback: if LOG_STYLE=plain, use simple "[Category] Message" format
// Default: rich format with box-drawing characters
```
