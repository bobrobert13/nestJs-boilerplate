# Design: Env Validation & Defaults

## Approach
Use the `validate` function option of `@nestjs/config`'s `ConfigModule.forRoot()`.
No new dependencies — manual validation using plain JS checks + `class-validator` types where available.

## Validation Function: `validateEnv()`

```typescript
// Accepted by ConfigModule.forRoot({ validate })
// Receives the parsed .env object, returns the validated config
// Throws on missing REQUIRED vars
// Logs warnings + applies defaults for optional vars
```

### Required (throw on missing):
| Var | Validation |
|-----|-----------|
| `JWT_SECRET` | string, min 32 chars |
| `MONGODB_URI` | string, non-empty |
| `INNGEST_EVENT_KEY` | string, non-empty |
| `INNGEST_SIGNING_KEY` | string, non-empty |

### Optional with defaults:
All other vars from AGENTS.md section 6. Warnings logged only if the default changes behavior.

## Playwright Namespaced Config
```typescript
registerAs('playwright', () => ({
  headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10),
  retries: parseInt(process.env.PLAYWRIGHT_RETRIES || '3', 10),
  browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH,
}));
```

## AI Provider Env Vars
Documented but optional — each provider initializes only if its key is present.
