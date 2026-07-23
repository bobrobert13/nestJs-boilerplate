# Tasks: Improve Startup Logs

## Group 1 — Infrastructure (@common/common)

### 1.1 Create `packages/common/src/logger/log-category.enum.ts`

- [x] Define `LogCategory` enum with members: `BOOT`, `DB`, `AUTH`, `PLAYWRIGHT`, `FEATURE`, `CONFIG`, `API`
- [x] Add JSDoc explaining each member

### 1.2 Create `packages/common/src/logger/bootstrap-logger.ts`

- [x] Create `BootstrapLogger` class with static methods:
  - `log(category: LogCategory, message: string, detail?: string): void`
  - `step(label: string, durationMs?: number): void`
  - `section(title: string, items?: string[]): void`
  - `summary(items: Record<string, string>): void`
  - `banner(title: string, version?: string): void`
- [x] Implement rich format (box-drawing) and plain fallback (`LOG_STYLE=plain`)
- [x] Add JSDoc on all public methods

### 1.3 Create `packages/common/src/logger/index.ts`

- [x] Barrel export: `export * from './log-category.enum'` and `export * from './bootstrap-logger'`

### 1.4 Update `packages/common/src/index.ts`

- [x] Add `export * from './logger'`

### 1.5 Update `packages/common/README.md`

- [x] Document new exports: `LogCategory` and `BootstrapLogger`

---

## Group 2 — Consumers (@common/auth, @common/database, @common/playwright)

### 2.1 Update `AuthModule.onModuleInit()` — `packages/auth/src/auth.module.ts`

- [x] Import `BootstrapLogger` and `LogCategory` from `@common/common`
- [x] Replace raw `Logger.log()` calls with `BootstrapLogger.log(LogCategory.AUTH, ...)`
- [x] Preserve existing messages — just wrap with category

### 2.2 Update `DatabaseService` — `packages/database/src/database.service.ts`

- [x] Import `BootstrapLogger` and `LogCategory` from `@common/common`
- [x] Use `BootstrapLogger.log(LogCategory.DB, ...)` for connect / success / failure
- [x] Sanitize MongoDB URI in logs (mask password)

### 2.3 Update `PlaywrightService` — `packages/playwright/src/playwright.service.ts`

- [x] Import `BootstrapLogger` and `LogCategory` from `@common/common`
- [x] Use `BootstrapLogger.log(LogCategory.PLAYWRIGHT, ...)` for init / context / close

---

## Group 3 — Application (apps/nominas)

### 3.1 Enhance `main.ts` bootstrap

- [x] Import `BootstrapLogger` and `LogCategory` from `@common/common`
- [x] After `app.listen()`: call `BootstrapLogger.banner()` with app name + version
- [x] Use `BootstrapLogger.step()` for each phase (env validation, DB connect, modules)
- [x] Show HTTP endpoint and Swagger URL in summary
- [x] Add timing between bootstrap phases

### 3.2 Add `AppModule.onApplicationBootstrap()` — `apps/nominas/src/app.module.ts`

- [x] Import `BootstrapLogger` and `LogCategory` from `@common/common`
- [x] Implement `OnApplicationBootstrap` interface
- [x] Read feature flags from ConfigService and emit grouped summary:
  - MongoDB status
  - Playwright status
  - Auth methods available
  - Inngest configured?
  - Resend configured?
  - AI Providers configured?
  - Dynamic Schema mode
- [x] Use `BootstrapLogger.section()` and `BootstrapLogger.summary()`

---

## Group 4 — Documentation

### 4.1 Update `CHANGELOG.md`

- [x] Add v0.6.0 entry with `Added` for logging utilities

### 4.2 Update `AGENTS.md` — status dashboard

- [x] Add `improve-startup-logs` to active changes table
- [x] Update `@common/common` status if JSDoc coverage improved

### 4.3 Verify build and lint

- [x] `npm run build` passes
- [x] `npm run lint` passes
