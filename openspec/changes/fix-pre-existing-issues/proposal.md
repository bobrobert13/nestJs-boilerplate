# Proposal: Fix Pre-Existing Issues (Inngest Tests + Lint/Format Scripts)

## Intent

This change addresses two classes of pre-existing hygiene debt that were surfaced by the previous `usuarios-add-rbac-tests` change and were deliberately deferred to keep that PR focused: (1) **5 dormant inngest test failures** in `packages/inngest/src/inngest.service.spec.ts` (the spec and README document a public API that the service does not implement), and (2) **broken `lint` and `format` scripts** in `package.json` whose globs reference directories (`src/`, `libs/`) that do not exist in this project — so `npm run lint` matches zero files and `npm run format` silently only formats `apps/`, never touching `packages/`.

## Why

- **Test health:** `npm run test` reports `Tests: 5 failed, 91 passed, 96 total` and `Suites: 1 failed, 9 passed, 10 total`. All 5 failures live in `inngest.service.spec.ts`. The test suite was dormant until commit `021f7f3` broadened Jest `roots` to include `<rootDir>/packages/`.
- **Functional gap (not just tests):** the 4 missing methods (`createJobStartedPayload`, `createJobCompletedPayload`, `createJobFailedPayload`, `createChapterProcessedPayload`) are documented as the public API in `packages/inngest/src/README.md` (lines 37-40) and the inngest functions in `functions/index.ts` listen for these 4 events. Nothing in the current codebase can send them — only `sendHolaInngest` works. The spec is correct; the service is incomplete.
- **Lint script broken since project creation:** the `lint` script runs `eslint "{src,apps,libs,test}/**/*.ts" --fix` and ESLint responds `all of the files matching the glob pattern are ignored`. ESLint 9 with no `files` block in `eslint.config.mjs` marks all files as ignored by default. There is no `src/`, `libs/`, or `test/` directory in this project — TS source lives under `apps/` and `packages/`.
- **Format script has the same bug:** `format` uses `"apps/**/*.ts" "libs/**/*.ts"` — the `libs/` glob silently matches nothing, so `packages/` is never formatted. The 8 dirty files left by a previous `format` run (now committed in `8e06845`) were only in `apps/`.
- **CI cannot enforce code quality** while `lint` is broken.

## Goals

1. The system MUST add 4 missing `create*Payload` methods to `InngestService`: `createJobStartedPayload`, `createJobCompletedPayload`, `createJobFailedPayload`, `createChapterProcessedPayload`.
2. The system MUST fix the `lint` script in `package.json` to actually lint the project's TS files.
3. The system MUST fix the `format` script in `package.json` to format both `apps/` and `packages/`.
4. `npm run test` MUST pass with 96/96 tests green (was 91/96 with 5 inngest failures).
5. `npm run lint` MUST exit with code 0 on the current codebase (or surface real lint errors that are documented as a follow-up).
6. `npm run build` MUST pass.

## Non-goals

- Adding a CI workflow at `.github/workflows/` — separate infrastructure change.
- Refactoring the inngest functions or their event handling.
- Reformatting `packages/` (would produce a noisy diff; deferred to a separate change).
- Touching the auth/JWT desync, global `APP_GUARD`, `RoleManagementService`, or rate limiting concerns.
- Running `npm run format` after the script fix (deferred to avoid a noisy diff in this PR).

## Approach (high level)

**Step 1 — Add 4 methods to `InngestService`.** Follow the exact pattern of the existing `createHolaInngestPayload` (lines 82-92 of `inngest.service.ts`): a sync method that returns `{ name, data: { ..., timestamp: new Date().toISOString() } }`. Each method takes the parameters documented in the README and returns the correct shape from `ScrappingEvents` in `serve/interfaces/inngest.interfaces.ts`. `createJobCompletedPayload` only includes `resultCount` in `data` when the argument is provided. `createJobFailedPayload` includes the error string in `data`.

**Step 2 — Fix the `lint` script in `package.json`.** Change `eslint "{src,apps,libs,test}/**/*.ts" --fix` to `eslint "apps/**/*.ts" "packages/**/*.ts" --fix`. The `eslint.config.mjs` ignores list (`dist/`, `node_modules/`, `coverage/`) is still honored.

**Step 3 — Fix the `format` script in `package.json`.** Change `prettier --write "apps/**/*.ts" "libs/**/*.ts"` to `prettier --write "apps/**/*.ts" "packages/**/*.ts"`. Do NOT run `npm run format` as part of this change (deferred).

**Step 4 — Verify.** Run `npm run test` (expect 96/96), `npm run lint` (expect real output, ideally clean), `npm run build` (expect green).

## Scope

### In Scope (3 fixes, 2 files)

- `packages/inngest/src/inngest.service.ts` — ADD 4 methods (~32 LOC total), following the existing `createHolaInngestPayload` pattern.
- `package.json` — MODIFY 2 lines (the `lint` and `format` scripts).

### Out of Scope (8 items)

- Auth/Usuarios JWT role desync (separate change).
- Global `APP_GUARD` in `main.ts` (orthogonal, separate change).
- `RoleManagementService` abstract class extraction (premature, 1 consumer).
- Rate limiting on auth endpoints (specced elsewhere, not implemented).
- E2E test maintenance (current 1/1 E2E test passes).
- `overrideProvider(RBAC_HIERARCHY)` pattern (not a bug — established convention).
- CI workflow (separate infrastructure concern).
- Reformatting `packages/` (deferred to a separate change to keep this PR's diff focused).
- The 8 dirty files from a previous `format` run (already committed in `8e06845` by the orchestrator as a separate `chore(format)` commit).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/inngest/src/inngest.service.ts` | Modified | ADD 4 `create*Payload` methods following the existing `createHolaInngestPayload` pattern (~32 LOC) |
| `package.json` | Modified | FIX 2 script lines: `lint` (line 16) and `format` (line 11) — replace stale `libs/`/`src/` globs with `apps/**/*.ts` + `packages/**/*.ts` |

## Decisions taken (with rationale)

1. **Add methods to service, do not delete the spec tests** — The spec is correct (`inngest.service.spec.ts` lines 175-235 documents the intended public API). The `README.md` (lines 37-40) documents all 4 missing methods as the public API. The `ScrappingEvents` interface in `serve/interfaces/inngest.interfaces.ts` defines the event data shapes. The inngest functions in `functions/index.ts` listen for these 4 events. The service is the incomplete piece; the fix is to add what is missing. This also unblocks production use of the scrapping job lifecycle.
2. **Fix both `lint` AND `format` in the same change** — Same root cause (stale `libs/` glob), same file (`package.json`), one-line edits each. Cheap to combine and avoids leaving one script half-fixed.
3. **Do not reformat `packages/`** — Would produce a noisy diff unrelated to the core fix. Defer to a separate `chore(format)` change.
4. **Do not run `npm run format` after the script fix** — Same reason: the next `format` run would touch the entire `packages/` tree. Defer the run to a separate change.
5. **Single PR, no chained PRs** — Far under the 400-line budget, focused scope, user working solo.

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|------------|------------|
| 1 | The 4 new inngest methods could subtly disagree with the `ScrappingEvents` shapes (e.g., wrong key name, wrong type) | Low | Copy types verbatim from `serve/interfaces/inngest.interfaces.ts` (lines 1-31); the spec already asserts the expected shape with `expect(payload.data.X).toBe(...)` |
| 2 | `npm run lint` surfaces real lint errors after the script fix (since the command has never actually run on this codebase) | Medium | Document any errors surfaced. If they are cosmetic (whitespace, import order), fix in this change. If architectural, defer to a separate change. |
| 3 | The `format` script fix might break someone's local workflow that depends on `libs/` | Very low | There is no `libs/` directory in this project; the script was already broken |

## Rollback Plan

1. **Code-level:** `git revert` the merge commit. The 4 inngest method additions are purely additive (no consumer code in this branch calls them yet, and the spec already references them). The 2 `package.json` script lines are one-line modifications that revert cleanly.
2. **No database changes.**
3. **No production impact** — the inngest methods are new public API; no existing code depends on them. The `lint`/`format` script fixes only affect developer tooling, not runtime behavior.

## Out of scope (future work)

- **Add a CI workflow** at `.github/workflows/` to enforce `lint` + `test` + `build` on PR.
- **Reformat `packages/`** after the format script fix (separate `chore(format)` change).
- **Wire `AuthService` to read `roles` from `usuarios`** (auth/JWT desync — see `usuarios-rbac` follow-up #1).
- **Add global `APP_GUARD`** in `main.ts` (see `usuarios-rbac` follow-up #3).
- **Extract `RoleManagementService` abstract class** in `packages/auth/` (premature — wait for a 2nd consumer).
- **Add rate limiting** on auth endpoints (specced in `openspec/specs/auth/spec.md`, not implemented).
- **Add `mongodb-memory-server`** for integration tests (current pattern mocks at the Mongoose model level).

## Dependencies

- `sdd/fix-pre-existing-issues/explore` (engram #127) — completed
- `sdd/usuarios-add-rbac-tests/archive-report` (engram #125) — inngest failure documented as out-of-scope
- `sdd/usuarios-rbac/archive-report` (engram #113) — `npm run lint` broken documented as a known limitation
- `openspec/specs/inngest/spec.md` (if it exists) — defines the event payload contracts
- `openspec/config.yaml` rules — `proposal` rule: "Include rollback plan for risky changes" (mandated)
- Commit `021f7f3` — broadened Jest `roots` to include `packages/`, which exposed the dormant inngest failures
- Commit `8e06845` — committed the 8 dirty files from a previous `format` run (done by orchestrator)

## Success Criteria

- [ ] `InngestService` has 4 new methods: `createJobStartedPayload`, `createJobCompletedPayload`, `createJobFailedPayload`, `createChapterProcessedPayload`
- [ ] `package.json` `lint` script uses `apps/**/*.ts packages/**/*.ts` (or similar working glob)
- [ ] `package.json` `format` script uses `apps/**/*.ts packages/**/*.ts` (or similar working glob)
- [ ] `npm run test` reports 96/96 tests pass (was 91/96 with 5 inngest failures)
- [ ] `npm run lint` exits with code 0 (or surfaces real lint errors that are documented as a follow-up)
- [ ] `npm run build` is green
- [ ] `npm run format` is NOT run as part of this change (deferred to avoid a noisy diff)
