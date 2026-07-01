# Tasks: Standardize Package READMEs

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200–300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | ask-on-risk |

## Phase 1: High-Gap READMEs (common, auth, documents)

- [x] 1.1 `common/README.md` — Add `## Error Handling` restructured with DatabaseExceptionFilter and BaseAdapter patterns; rename `## Common Errors` → `## Common Pitfalls`
- [x] 1.2 `common/README.md` — Add `## Configuration` with "No environment variables required"
- [x] 1.3 `common/README.md` — Fix HttpError section: cross-reference `@common/http` as primary source, list 7 subclasses (removed ConflictError, added TimeoutError + ServiceUnavailableError), note factory re-export
- [x] 1.4 `auth/README.md` — Add `## API Reference` with AuthService, MagicLinkService, TwoFactorService, PasskeysService method tables, Guards and Decorators tables
- [x] 1.5 `auth/README.md` — Add `## Error Handling` for UnauthorizedException, token expiry, refresh, guard ordering
- [x] 1.6 `auth/README.md` — Add `## Common Pitfalls` for JWT secret length, Argon2 in Docker, guard ordering, demo user, ConfigModule
- [x] 1.7 `documents/README.md` — Add `## Configuration` with "No environment variables required"
- [x] 1.8 `documents/README.md` — Rename `## Limits and Constraints` → `## Common Pitfalls` with expanded content (password-protected docs, scanned images, complex layouts)

## Phase 2: Moderate-Gap READMEs (database, ai, http, playwright)

- [x] 2.1 `database/README.md` — Add `## Error Handling` for MongoServerSelectionError, TransientTransactionError, retry behavior, connection vs transaction error tables
- [x] 2.2 `ai/README.md` — Extract success-check patterns into `## Error Handling` with error patterns table, rate limiting, token management, fallback pattern
- [x] 2.3 `ai/README.md` — Merge duplicate env-var content into `## Configuration`; rename `## Troubleshooting` → `## Common Pitfalls`
- [x] 2.4 `http/README.md` — Add `## Configuration` with "No environment variables required (axios URLs are configured per-request)"
- [x] 2.5 `playwright/README.md` — Add `## Error Handling` for browser not installed, selector timeout, navigation failure; include recovery pattern

## Phase 3: Light-Update READMEs (inngest, resend, serve-static)

- [x] 3.1 `inngest/README.md` — Add `## API Reference` with sendEvent, sendEvents, getClient, createFunction signatures and trigger options table
- [x] 3.2 `inngest/README.md` — Add `## Error Handling` for fetch failure, event sync, step retry, SSL in dev
- [x] 3.3 `resend/README.md` — Add `## Error Handling` for invalid key, domain verification, template rendering, programmatic error handling code
- [x] 3.4 `serve-static/README.md` — Rename `## Usage` → `## Quick Start`
- [x] 3.5 `serve-static/README.md` — Add `## Error Handling` for ENOENT, invalid view name, EJS compile errors; include recovery pattern
- [x] 3.6 `serve-static/README.md` — Add `## Common Pitfalls` for template path resolution, Tailwind CDN in production, serveRoot conflicts, cached templates

## Phase 4: App README Expansion

- [x] 4.1 `apps/nominas/README.md` — Add `## Architecture` listing 6 AppModule imports with descriptions (database, inngest, playwright, ai, documents, auth)
- [x] 4.2 `apps/nominas/README.md` — Add `## Prerequisites` (Node 20+, MongoDB, Inngest, Playwright) and `## Setup` (clone, .env, npm install + start:dev)
- [x] 4.3 `apps/nominas/README.md` — Expand `## Module Documentation` with endpoint tables for usuarios (5 endpoints) and dynamic-schema (5 endpoints), plus auth endpoints
- [x] 4.4 `apps/nominas/README.md` — Add `## Navigation` linking AGENTS.md, BOILERPLATE.md, and 9 package READMEs

## Phase 5: Verification

- [x] 5.1 `npm run build` — no TS errors (webpack compiled successfully, 4569ms)
- [x] 5.2 `npm run format` on changed .md files — all files formatted correctly
- [x] 5.3 Verify ≥7 `## ` sections in all 11 READMEs — confirmed (common: 9, auth: 16, documents: 9, database: 9, ai: 15, http: 8, playwright: 11, inngest: 12, resend: 9, serve-static: 12, nominas: 7)
- [x] 5.4 Spot-check relative links resolve to real files — HttpError cross-reference verified: `../http/README.md#error-handling` links correctly
