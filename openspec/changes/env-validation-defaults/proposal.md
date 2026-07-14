# Proposal: Env Validation & Defaults

## What
Add centralized environment variable validation at startup with sensible defaults for non-essential vars.

## Why
Currently the app starts even when critical env vars like `JWT_SECRET` are missing, only to fail later at runtime with cryptic errors. New developers have no reference of what variables are needed.

## Scope
- `apps/nominas/src/config/env.validation.ts` — validation function for `ConfigModule.forRoot()`
- `apps/nominas/src/app.module.ts` — wire validation
- `packages/playwright/src/config/playwright.config.ts` — add `registerAs` namespace
- `packages/playwright/src/playwright.module.ts` — use `ConfigModule.forFeature`
- `packages/playwright/src/playwright.service.ts` — use namespaced config
- `AGENTS.md` — section 6 update with required/optional markers
- `.env.example` — new reference file
- `CHANGELOG.md` — entry

## Risks
- Adding validation could break existing `.env` files that are missing vars. Mitigation: only REQUIRED vars (`JWT_SECRET`, `MONGODB_URI`) throw; everything else warns and uses defaults.
