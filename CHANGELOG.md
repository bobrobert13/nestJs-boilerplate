# Changelog

## fix-docker-local-stack — 2026-07-17

Single commit `b1ea11e` (`fix(docker): unblock local docker stack + add
reproducible test harness`) that makes `./docker-test.sh` succeed end-to-end
and unblocks follow-up E-2 (live-Mongo e2e gate).

### Files
- `docker-test.sh` — rewritten as a thin wrapper of `docker compose`
  with pre-flight, auto-bump, `rs.initiate`, health-check, `down -v`.
- `docker-test-ubuntu.sh` — Ubuntu-only wrapper that `apt install`s
  docker.io + docker-compose-plugin if missing.
- `docker-compose.test.yml` — override used by the test scripts
  (Mongo without auth, MONGODB_URI without credentials).
- `.gitattributes` — forces LF on `*.sh`, `Dockerfile`, `*.yml`, etc.,
  preventing the CRLF regression that broke the entrypoint.
- `.dockerignore` — removed `package-lock.json` (required by `npm ci`).
- `apps/nominas/entrypoint.sh` — CRLF → LF; validates `main.js` instead of
  the non-existent `main`.

### Unblocked follow-ups
- **E-2** (live-Mongo e2e gate): no longer deferred. `./docker-test.sh` brings
  up Mongo (ReplicaSet `rs0`) + service and exposes `/api/health` for a
  subsequent Jest e2e to hit. `down -v` cleans the stack after.

## hardening-medium-low — 2026-07-16

5 stacked-to-main PRs implementing the deferred MEDIUM/LOW findings from the
2026-07-15 audit and the residual lint debt.

### PR1 — lint-cleanup (3 commits, chore)
- `chore(lint): run eslint --fix for auto-fixable subset [CHORE]`
- `chore(lint): swap to @typescript-eslint/no-unused-vars + NodeJS globals [CHORE]`
- `docs(*): add JSDoc stubs to public methods [CHORE]`
- Lint baseline: 475 errors / 195 warnings → 0 errors / 50 warnings.

### PR2 — low-batch (4 commits, security)
- L1 [SECURITY]: require explicit MONGODB_URI in production.
- L3 [SECURITY]: `findByEmailWithSecrets` projects safe fields only.
- L5 [SECURITY]: magic-link tokens persisted to MongoDB with TTL index.
- L9 partial: dynamic-schema controller class-level `@Roles('admin')`.

### PR3 — low-http-frontend (7 commits, security)
- E-1 [SECURITY]: SSRF guard now correctly skips IPv4↔IPv6 CIDR cross-comparison.
- L2 [SECURITY]: Tailwind CDN SRI hash pinned; CSP allows the CDN host.
- L6 [SECURITY]: newsletter send uses bounded concurrency via
  `Promise.allSettled`.
- L7 [SECURITY]: `sanitizeViewName` regex tightened to `^[a-zA-Z0-9_-]+$`.
- L8 [SECURITY]: `requestIdMiddleware` validates
  `^[A-Za-z0-9_-]{8,128}$`, regenerates UUID on injection attempts.
- L11 [SECURITY]: cron init log em-dash / check-mark UTF-8 fixes.
- L12 [SECURITY]: scraper Swagger descriptions: mojibake → em-dash.

### PR4 — medium-core (3 commits, security)
- M1 [SECURITY]: per-endpoint `@Throttle()` decorators on auth + newsletter.
- M9 [SECURITY]: `DatabaseService.disconnect()` and `onApplicationShutdown`
  cancel pending retry timer so SIGTERM exits cleanly.
- M10 [SECURITY]: `TransactionService.isTransientError` uses only
  `hasErrorLabel('TransientTransactionError')`.

### PR5 — medium-pagination-and-verify (5 commits, security)
- L9 final: dynamic-schema controller remains admin-only; no `@Public()` needed.
- L10 [SECURITY]: `usuarios.update()` uses typed payload (no `data: any`).
- M2 [SECURITY]: `FindUsuariosDto { page @Min(1), limit @Min(1) @Max(100) }`
  and `GET /usuarios/page` returning `{ data, total, page, limit }`.
  Legacy `GET /usuarios` array endpoint preserved as deprecated.
- M5 [SECURITY]: verified playwright-service matches design §14.4 — no
  divergence, no fix needed (`--no-sandbox` only when env explicitly true).
- L4 [SECURITY]: `compileAndRegister` calls `unregister()` on hash conflict
  before re-registering, so `connection.model(name)` returns the new model.

### Known follow-ups
- E-2 (live-Mongo e2e gate): **resolved** on 2026-07-17 by
  `fix(docker): unblock local docker stack + add reproducible test harness`
  (commit `b1ea11e`). `./docker-test.sh` brings up Mongo (ReplicaSet `rs0`)
  + service and exposes `/api/health`; `down -v` cleans the stack.
- E-3 (release commit count reconciliation) addressed via per-PR commit subjects.
- E-4 (AppLogger/useLogger wiring): `main.ts` does not call `app.useLogger()`
  because `BootstrapLogger` writes to `console.*` directly. Documented here.
- Tailwind CDN SRI hash (`sha384-igm5BeiBt36UU4gqwWS7imYme…`) is pinned to
  the 2026-07-16 body; refresh whenever the upstream CDN body changes
  (KNOWN-GOTCHA).
