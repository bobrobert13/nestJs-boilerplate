# Tasks: Fix Pre-Existing Issues (Inngest Tests + Lint/Format Scripts)

## Summary

Add 4 missing `create*Payload` methods to `InngestService` (closes the public-API gap the spec and README already document) and fix 2 glob patterns in `package.json` so `npm run lint` and `npm run format` actually run on the real `apps/` + `packages/` tree. Total: 4 tasks across 2 phases. Estimated ~34 LOC across 2 files. Single branch, no PR (user solo, work under 400-line review budget).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Total estimated changed lines | +34 (32 service + 2 script) |
| Files touched | 2 (`packages/inngest/src/inngest.service.ts`, `package.json`) |
| Risk level | Low |
| Chained PRs recommended | No |
| 400-line budget risk | Low |
| Decision needed before apply | No |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Execution order

**Phase 1 (inngest methods) must complete before verify** because the 5 failing tests in `inngest.service.spec.ts` only pass after the 4 missing methods exist. **Phase 2 (scripts) is independent** of Phase 1 — the script fixes do not touch any code the inngest tests load. The two phases can be applied in any order, but Phase 1 first lets `npm run test` go green immediately and unblocks the human's mental model. Phases 1 and 2 each get one work-unit commit (methods+tests together per work-unit-commits; scripts in a single separate commit because they are a different concern).

## Tasks

### Phase 1: Inngest service methods

#### 1.1 Add 4 `create*Payload` methods to `InngestService`
- **Files**: MODIFIED `packages/inngest/src/inngest.service.ts` (+32 lines)
- **Depends on**: nothing
- **Estimated lines**: +32 lines (4 methods × ~8 lines each)
- **What to do** (insert after `createHolaInngestPayload` at line 92, before `sendHolaInngest` at line 94):
  - `createJobStartedPayload(jobId: string, strategyName: string): InngestEventPayload<'scrapping/job.started'>` — returns `{ name: 'scrapping/job.started', data: { jobId, strategyName, timestamp: new Date().toISOString() } }`
  - `createJobCompletedPayload(jobId: string, strategyName: string, resultCount?: number): InngestEventPayload<'scrapping/job.completed'>` — `data` includes `success: true`, conditionally includes `resultCount` (only when arg is defined; spec scenario "without resultCount" requires `resultCount === undefined` when omitted)
  - `createJobFailedPayload(jobId: string, strategyName: string, error: string): InngestEventPayload<'scrapping/job.failed'>` — `data` includes the `error` string (message, not the `Error` object)
  - `createChapterProcessedPayload(jobId: string, chapterId: string, chapterTitle: string, pagesScraped: number): InngestEventPayload<'scrapping/chapter.processed'>` — all 4 fields + `timestamp` in `data`
  - Each method follows the **exact** shape of the existing `createHolaInngestPayload` (sync, returns `{ name, data: { ..., timestamp: new Date().toISOString() } }`)
  - `InngestEventPayload` is already imported at line 6 — no new imports needed
  - **DO NOT** include any other refactor (no docstring changes, no grouping, no renames)
- **Acceptance**: `npm run test` shows 96/96 tests pass (was 91/96 with 5 inngest failures). The 5 previously-failing tests in `inngest.service.spec.ts` lines 175-235 now pass.
- **Work-unit commit message**: `feat(inngest): add 4 missing create*Payload methods to InngestService`

#### 1.2 Verify Phase 1: `npm run test` shows 96/96 pass
- **Files**: none (verification only)
- **Depends on**: 1.1
- **Estimated lines**: 0
- **What to do**: Run `npm run test`. Confirm the 5 inngest tests pass. Confirm no other test was broken.
- **Acceptance**: `npm run test` reports 96/96 tests pass and 0 failed.
- **Work-unit commit message**: N/A (verification, no new commit)

### Phase 2: npm script fixes

#### 2.1 Fix `lint` and `format` scripts in `package.json`
- **Files**: MODIFIED `package.json` (2 lines)
- **Depends on**: nothing (independent of Phase 1)
- **Estimated lines**: 2 lines modified (no additions, no deletions)
- **What to do**:
  - Line 11 `format`: change `"prettier --write \"apps/**/*.ts\" \"libs/**/*.ts\""` → `"prettier --write \"apps/**/*.ts\" \"packages/**/*.ts\""`
  - Line 16 `lint`: change `"eslint \"{src,apps,libs,test}/**/*.ts\" --fix"` → `"eslint \"apps/**/*.ts\" \"packages/**/*.ts\" --fix"`
  - The `eslint.config.mjs` `ignores` list (`dist/`, `node_modules/`, `coverage/`) is still honored
  - **DO NOT** run `npm run format` after the script fix — defer to a separate change to keep this PR's diff clean
  - **DO NOT** add new scripts (no `format:check`, no `lint:check`, etc.)
- **Acceptance**:
  - `npm run lint` exits 0 OR surfaces only real lint errors that are documented as follow-up (the command now actually runs against real files, which it has not done since project creation)
  - `npm run format` runs without error (script matches files in both `apps/` and `packages/`) — but the run is NOT a step in this task; only verify the glob is correct
- **Work-unit commit message**: `fix(scripts): correct lint and format glob patterns in package.json`

#### 2.2 Verify Phase 2: `npm run lint` and `npm run build` green
- **Files**: none (verification only)
- **Depends on**: 2.1
- **Estimated lines**: 0
- **What to do**: Run `npm run lint`, then `npm run build`. Confirm both exit with code 0. If `npm run lint` surfaces real lint errors, document them as a follow-up; do not fix in this change.
- **Acceptance**: Both commands exit with code 0. Any real lint errors are recorded in a follow-up note, not silently fixed.
- **Work-unit commit message**: N/A (verification, no new commit)

## Cumulative line count

- Phase 1: +32 LOC (service methods)
- Phase 2: 2 LOC modified (script globs)
- **Total: +34 LOC across 2 files**

## Cumulative work-unit commit count

- 2 commits: `feat(inngest): add 4 missing create*Payload methods to InngestService` + `fix(scripts): correct lint and format glob patterns in package.json`
- 2 verifications, no commit (Phase 1.2, Phase 2.2)
- No `chore(format)` commit in this change (deferred per ADR-3 in `design.md`)

## PR recommendation

**Single branch, no PR** — per user decision. All work continues on `test/usuarios-add-rbac-tests` (no new branch). No push, no PR creation. ~34 LOC is well under the 400-line review budget. The change is small, focused, and fully revertible.

## Important constraints

- **DO** keep tasks TIGHT. Each task is a meaningful work unit.
- **DO** use the work-unit commit messages above exactly.
- **DO** include the 4 new method signatures on the existing import surface (no new imports — `InngestEventPayload` is already imported at line 6).
- **DO** conditionally include `resultCount` in `createJobCompletedPayload.data` only when the argument is defined (spec scenario requires `undefined` when omitted).
- **DO NOT** include any code in this tasks file. Method signatures and data-key lists are OK; no full implementations.
- **DO NOT** run `npm run format` in any task. Defer to a separate change (per ADR-3 in `design.md`).
- **DO NOT** add a CI workflow, refactor the inngest functions, reformat `packages/`, or touch any out-of-scope item (auth/JWT desync, `APP_GUARD`, `RoleManagementService`, rate limiting, E2E maintenance).
- **DO NOT** delete or rewrite the 5 failing tests in `inngest.service.spec.ts` — the spec is correct; the service is incomplete (per ADR-1 in `design.md`).
