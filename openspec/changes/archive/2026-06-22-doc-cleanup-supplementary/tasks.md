# Tasks: Documentation Cleanup and Supplementary Files

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | hybrid |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Cleanup

- [x] 1.1 Delete corrupt `README.mdgit` (UTF-16 LE binary at project root)
- [x] 1.2 Move `inngest-config-context.md` (AI session debug log) from root to `.kiro/inngest-config-context.md`
- [x] 1.3 Delete empty directory `packages/resend/src/dto/`
- [x] 1.4 Delete empty directory `packages/serve-static/templates/assets/` (and `css/` + `js/` subdirs)

## Phase 2: Supplementary Documentation

- [x] 2.1 Create `CONTRIBUTING.md` with: fork/branch/PR workflow, conventional commits guide, code review process, local dev setup, links to AGENTS.md and BOILERPLATE.md
- [x] 2.2 Add purpose note to top of `AGENTS.md` (after title): "Technical reference for AI agents — English, API-focused"
- [x] 2.3 Add purpose note to top of `BOILERPLATE.md` (after title): "Developer guide for humans — Spanish, tutorial-style"

## Phase 3: Verification

- [x] 3.1 Run `npm run build` and `npm run format` — ensure no regressions
- [x] 3.2 Verify: `README.mdgit` absent, `inngest-config-context.md` in `.kiro/`, empty dirs removed, `CONTRIBUTING.md` exists, purpose notes present in AGENTS.md and BOILERPLATE.md
