# Archive Report: Fix Pre-Existing Issues (Inngest Tests + Lint/Format Scripts)

**Change**: `fix-pre-existing-issues`
**Date**: 2026-07-03
**Branch**: `test/usuarios-add-rbac-tests` (continued from previous change, 4 work-unit commits, scope extended 2x)
**Status**: ARCHIVED

## Summary

Fixed 3 pre-existing hygiene issues that were documented as out-of-scope follow-ups in the previous changes (usuarios-rbac, usuarios-add-rbac-tests). 4 work-unit commits, 6 files touched, ~40 LOC total.

## Final state

- Total commits: 4
- Files changed: 6
- Lines added: ~40
- Build: PASS
- Tests: 96/96 unit + 1/1 E2E
- Lint: clean
- Spec coverage: 8/8 scenarios evidence-supported

## Commits (work-unit order)

1. `b1e298a` — `feat(inngest): add 4 missing create*Payload methods to InngestService` (+32 LOC, 1 file)
2. `78308c6` — `fix(scripts): correct lint and format glob patterns in package.json` (+2 lines, 1 file)
3. `648a516` — `fix(lint): repair eslint config + remove dead fail() in test` (+3/-3 LOC, 3 files — user-approved scope extension #1)
4. `b93ff3d` — `fix(lint): separate lint:fix script and disable prettier rule` (+3/-2 LOC, 2 files — user-approved scope extension #2)

## Specs synced to canonical location

- `openspec/specs/inngest-payload-methods/spec.md` (NEW — from delta, 4 requirements, 6 scenarios)
- `openspec/specs/npm-scripts/spec.md` (NEW — from delta, 2 requirements, 2 scenarios)

Both deltas were promoted to canonical by stripping the `## ADDED Requirements` heading and renaming it to `## Requirements` (matches the convention in `openspec/specs/auth/spec.md`).

## Out-of-scope issues (documented for next change)

1. **Prettier drift** in `packages/` (228 errors). The `prettier/prettier` rule was disabled to defer the format run. Re-enable after a `chore(format)` change.
2. **No CI workflow** at `.github/workflows/`. Lint/test/e2e/build are functional but not enforced on PRs.
3. **Auth/Usuarios JWT desync** — role change in `usuarios` doesn't refresh JWT until next login. Wiring `AuthService` to read roles from `usuarios` is a separate change.
4. **Global `APP_GUARD`** in `main.ts` — orthogonal improvement, separate change.
5. **`RoleManagementService` abstraction** — premature, wait for 2nd consumer.
6. **Rate limiting** on auth endpoints — out of scope.

## Scope extension history (transparency)

The original proposal had 3 in-scope fixes (~34 LOC). The apply phase required 2 additional user-approved scope extensions:

- **Extension 1**: ESLint config repair (commit `648a516`) — 5 pre-existing bugs in `eslint.config.mjs` + 2 dead-code fixes in test files. Without this, `npm run lint` would have remained broken despite the script glob fix.
- **Extension 2**: `lint:fix` script split + `prettier/prettier` disabled (commit `b93ff3d`) — the `--fix` flag in the lint script was auto-formatting 70+ files on every run, making lint non-idempotent. Plus the 228 `prettier/prettier` errors that surfaced once lint actually worked.

## Lessons learned

1. **Pre-existing hygiene issues cluster**: fixing the lint script glob exposed 5 more bugs in the eslint config. Each fix surfaced a new issue. Pattern: when a script that "does nothing" is made to work, expect cascading fixes.
2. **Auto-fix flags in scripts are dangerous** for large codebases: `eslint --fix` mutated 70+ files on every run. The fix is to separate `lint` (read-only) from `lint:fix` (explicit format).
3. **The `prettier/prettier` rule surface depends on rule enablement**: 228 errors only appear when the rule is on. For a codebase with accumulated drift, the safe pattern is to enable the rule, run `lint:fix`, commit the format, then re-enable for ongoing enforcement.
4. **Test bugs that were "invisible" become visible with lint**: the `fail()` call in the test from the previous change was a real bug (Jasmine method, never called) that lint now catches. The `expect.toThrow` pattern above it was the actual assertion.

## Archive artifacts

- This file: `openspec/changes/fix-pre-existing-issues/archive-report.md`
- Engram observation: `sdd/fix-pre-existing-issues/archive-report`
- Synced specs: 2 new files in `openspec/specs/`

---

**Skill resolution**: injected
**Persistence mode**: hybrid
**Date generated**: 2026-07-03
