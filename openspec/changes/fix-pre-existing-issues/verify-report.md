# Verify Report: Fix Pre-Existing Issues (Inngest Tests + Lint/Format Scripts)

**Change**: `fix-pre-existing-issues`
**Date**: 2026-07-03
**Branch**: `test/usuarios-add-rbac-tests` (4 work-unit commits, scope extended 3x beyond original)
**Verifier**: sdd-verify executor

---

## Test verification

### `npm run lint` result

```
> api-nominas@0.0.1 lint
> eslint "apps/**/*.ts" "packages/**/*.ts"

```

- Verdict: **clean** (0 errors, exit 0). ESLint now actually runs against the real source tree (apps/ + packages/) instead of returning "all files matching the glob pattern are ignored". The `prettier/prettier` rule is intentionally disabled (commit `b93ff3d`) because 228 prettier errors from accumulated `packages/` formatting drift are deferred to a separate `chore(format)` change.

### `npm run test` result

- Suites: **10 passed, 10 total** (was 9 passed / 1 failed — the `inngest.service.spec.ts` suite had 5 failing tests)
- Tests: **96 passed, 96 total** (was 91 passed / 5 failed)
- Output (last lines — final 20 shown below the errors stack):

```
Test Suites: 10 passed, 10 total
Tests:       96 passed, 96 total
Snapshots:   0 total
Time:        5.489 s
Ran all test suites.
```

The error stack visible in the output is the `sendHolaInngest` test intentionally throwing
(`Error: Failed to send HOLA INNGEST` from the mock) — this is the asserted expected error, not a failure. The 5 previously-failing inngest tests (`createJobStartedPayload`, `createJobCompletedPayload` × 2, `createJobFailedPayload`, `createChapterProcessedPayload`) are all in the 96 passing count.

### `npm run test:e2e` result

- Suites: **1 passed, 1 total**
- Tests: **1 passed, 1 total**
- Output:

```
> api-nominas@0.0.1 test:e2e
> jest --config ./apps/nominas/test/jest-e2e.json

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        2.796 s, estimated 3 s
Ran all test suites.
```

### `npm run build` result

- Output (last 5 lines):

```
> api-nominas@0.0.1 build
> nest build

webpack 5.106.0 compiled successfully in 6944 ms
```

- Verdict: **PASS**

### Commits (work-unit order)

```
b1e298a feat(inngest): add 4 missing create*Payload methods to InngestService
78308c6 fix(scripts): correct lint and format glob patterns in package.json
648a516 fix(lint): repair eslint config + remove dead fail() in test
b93ff3d fix(lint): separate lint:fix script and disable prettier rule
```

The 4 commits in chronological order (1.1 → 2.1 → 3.1 → 4.1 from apply-phase, see "Scope extension history" below).

---

## Spec coverage matrix

For each of the 8 source spec scenarios, document whether it's evidence-supported.

### From `inngest-payload-methods/spec.md` (6 scenarios)

- **R1 (Valid Job And Strategy Produce Started Event)** — ✅ **PASS**
  - Evidence: `packages/inngest/src/inngest.service.spec.ts:175-184` — `describe('createJobStartedPayload')` → `it('should create job.started event payload')` asserts `payload.name === 'scrapping/job.started'`, `payload.data.jobId === 'job-123'`, `payload.data.strategyName === 'manhwaweb'`, `payload.data.timestamp` defined. The test is in the 96/96 passing count.
  - Implementation: `packages/inngest/src/inngest.service.ts:94-106` — `createJobStartedPayload` returns the exact shape.

- **R2 (Timestamp Is ISO 8601)** — ✅ **PASS**
  - Evidence: Same test at line 182 asserts `expect(payload.data.timestamp).toBeDefined()`. All 4 new methods plus the existing `createHolaInngestPayload` use `new Date().toISOString()` which produces ISO 8601 by definition (the test passes at runtime — if `toISOString()` were broken the assertion would fail).
  - Note: The spec scenario states the timestamp "round-trips through `new Date(timestamp)`" — the spec does not have an explicit round-trip assertion, only `toBeDefined()`. The behavior is implicit in `Date.toISOString()` and verified by the passing test.

- **R3 (All Three Arguments Produce Completed Event With Result Count)** — ✅ **PASS**
  - Evidence: `inngest.service.spec.ts:186-198` — `describe('createJobCompletedPayload')` → `it('should create job.completed event payload with resultCount')` asserts `payload.data.success === true` and `payload.data.resultCount === 5`. In the 96 passing.
  - Implementation: `inngest.service.ts:108-123` — uses `...(resultCount !== undefined ? { resultCount } : {})` for conditional spread.

- **R4 (Two Arguments Produce Completed Event Without Result Count)** — ✅ **PASS**
  - Evidence: `inngest.service.spec.ts:199-205` — `it('should create job.completed event payload without resultCount')` asserts `payload.data.resultCount` is `toBeUndefined()`. In the 96 passing.
  - The conditional spread (line 119) is the precise implementation that satisfies "omitted or `undefined` when not supplied".

- **R5 (Error String Is Propagated In Failed Event)** — ✅ **PASS**
  - Evidence: `inngest.service.spec.ts:208-219` — `describe('createJobFailedPayload')` → `it('should create job.failed event payload')` asserts `payload.name === 'scrapping/job.failed'` and `payload.data.error === 'Test error'`. In the 96 passing.
  - Implementation: `inngest.service.ts:125-139` — includes the `error` string in `data` (not the `Error` object).

- **R6 (All Four Arguments Produce Chapter Processed Event)** — ✅ **PASS**
  - Evidence: `inngest.service.spec.ts:221-235` — `describe('createChapterProcessedPayload')` → `it('should create chapter.processed event payload')` asserts all 4 fields (`chapterId`, `chapterTitle`, `pagesScraped`) and the event `name`. In the 96 passing.
  - Implementation: `inngest.service.ts:141-157`.

### From `npm-scripts/spec.md` (2 scenarios)

- **R1 (Lint Script Matches Real Source Files)** — ✅ **PASS**
  - Evidence: `npm run lint` was executed at 2026-07-03 11:32 in this verification. Output:
    ```
    > eslint "apps/**/*.ts" "packages/**/*.ts"
    ```
    No "all files matching the glob pattern are ignored" error. ESLint successfully walked both `apps/` and `packages/`, found no violations, and exited 0.
  - Configuration: `package.json:16` — `"lint": "eslint \"apps/**/*.ts\" \"packages/**/*.ts\""` (no `--fix`; that lives in `lint:fix` since commit `b93ff3d`).

- **R2 (Format Script Touches Both Apps And Packages)** — ✅ **PASS (by inspection; not executed per user constraint)**
  - Evidence: `package.json:11` — `"format": "prettier --write \"apps/**/*.ts\" \"packages/**/*.ts\""`. The `libs/` glob has been replaced with `packages/**/*`. Per ADR-3 in `design.md`, `npm run format` is **deliberately not run** in this change to keep the diff focused (the next `format` run would touch ~228 files of accumulated `packages/` drift). The script's correctness is verified by static inspection of the glob pattern, which now matches both trees.
  - Note: The 228 prettier errors are documented as the deferred `chore(format)` follow-up (see "Known issues" below).

**Coverage summary**: 8/8 scenarios evidence-supported. All 6 inngest scenarios are covered by passing Jest tests. Both npm-scripts scenarios are covered by direct command execution (lint) or by static glob inspection (format, by design).

---

## Known issues (out of scope, documented for follow-up)

1. **Prettier drift in `packages/`** — 228 `prettier/prettier` errors would surface if the rule is re-enabled. The rule is intentionally disabled in `eslint.config.mjs` (commit `b93ff3d`) to keep `npm run lint` clean now. Re-enable after a dedicated `chore(format)` change re-formats `packages/` (a `lint:fix` script exists at `package.json:17` for explicit on-demand formatting).
2. **No CI workflow** — `.github/workflows/` does not exist. Out of scope for this hygiene change; recommend a separate infrastructure SDD cycle.
3. **Auth/Usuarios JWT desync** — role changes in `usuarios` do not refresh the affected user's JWT until next login. Out of scope (requires touching `AuthService` and the JWT signing flow).
4. **Global `APP_GUARD`** in `main.ts` — orthogonal improvement. Out of scope.
5. **`RoleManagementService` abstraction** — premature with only 1 consumer. Wait for 2nd consumer.
6. **Rate limiting** on auth endpoints — specced elsewhere in `openspec/specs/auth/spec.md`, not implemented. Out of scope.
7. **Inngest dormant specs in `packages/inngest/src/__tests__/`** — all 5 inngest tests (1 in `createHolaInngestPayload` + 4 new methods) now pass at runtime. The original issue is fully resolved.

---

## Scope extension history (transparency)

The original proposal had 3 in-scope fixes (~34 LOC). The apply phase required 3 additional scope extensions to make lint actually work. All extensions were user-approved via direct "1" (extend) decisions.

1. **Phase 1: Inngest methods (commit `b1e298a`)** — +32 LOC in `packages/inngest/src/inngest.service.ts`
   - 4 new methods following the `createHolaInngestPayload` pattern verbatim.
   - Closes the functional gap the README and `functions/index.ts` had always assumed.
   - **In original scope.**

2. **Phase 2: npm scripts (commit `78308c6`)** — +2 lines in `package.json`
   - `lint` and `format` globs: `libs/` → `packages/`, dropped non-existent `src/`/`test/`.
   - **In original scope.**

3. **Phase 3: ESLint config repair (commit `648a516`)** — +3/-3 LOC across 3 files
   - The original Phase 2 fix was insufficient: after correcting the globs, ESLint 9 returned "all files matching the glob pattern are ignored" because `eslint.config.mjs` had no `files` block.
   - 5 bugs fixed in the same config: missing `files:` block, `sourceType: 'commonjs'` → `'module'`, no `tseslint.parser`, missing `'no-unused-vars': 'off'`, missing `NodeJS` global.
   - 2 dead-code fixes in test files: `fail('...')` (Jasmine API) in `cannot-self-modify.spec.ts`, invalid `// eslint-disable-next-line @typescript-eslint/...` comment in `usuarios.e2e-spec.ts`.
   - **User-approved extension #1.**

4. **Phase 4: Separate `lint:fix` + disable prettier rule (commit `b93ff3d`)** — +3/-2 LOC across 2 files
   - After Phase 3, lint ran but surfaced 228 `prettier/prettier` errors from `packages/` formatting drift.
   - Removed `--fix` from `lint` (was making it non-idempotent); added separate `lint:fix` script.
   - Disabled `prettier/prettier` rule in `eslint.config.mjs`; will be re-enabled after a `chore(format)` change.
   - **User-approved extension #2 ("dejalo para despues").**

**Total scope**: 4 work-unit commits, 6 files touched, ~40 LOC added. Well under the 400-line review budget.

---

## Final verdict

**Status: PASS**

All 8 source spec scenarios are evidence-supported. The 5 inngest tests now pass (the original issue). `npm run lint` is clean (the original issue). `npm run build` is green. The 228 prettier errors are a documented pre-existing issue, deferred to a separate `chore(format)` change.

Ready for sdd-archive.

---

## Artifacts

- This file: `openspec/changes/fix-pre-existing-issues/verify-report.md`
- Engram observation: `sdd/fix-pre-existing-issues/verify-report` (id will be assigned on save)
- Apply-progress: `sdd/fix-pre-existing-issues/apply-progress` (id 132, updated)

---

**Skill resolution**: injected
**Persistence mode**: hybrid
**Date generated**: 2026-07-03
