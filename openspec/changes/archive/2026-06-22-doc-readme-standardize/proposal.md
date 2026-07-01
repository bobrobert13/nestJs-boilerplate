# Proposal: Standardize Package READMEs

## Intent

All 10 package READMEs vary in structure, depth, and completeness — unpredictable for AI agent consumption. Standardize them to a consistent 7-section template so agents can find information reliably across packages.

## Scope

### In Scope
1. Define standard README template: Description → Installation → Quick Start → API Reference → Configuration/Env Vars → Error Handling → Common Pitfalls
2. Apply template to 10 `packages/*/README.md` files — verify existing sections, add missing ones
3. Fix `packages/common/README.md` HttpError cross-reference — document it as re-exported from `@common/http` (the primary definition)
4. Create `apps/nominas/README.md` per `openspec/specs/nominas-app-readme/spec.md`

### Out of Scope
- AGENTS.md changes (done in Change 1 + 2)
- Docker/deployment docs
- New code features
- Cleaning corrupt files or CONTRIBUTING.md (Change 4)

## Capabilities

### New Capabilities
None — all package READMEs already exist. This standardizes existing documentation structure.

### Modified Capabilities
None — no spec-level behavioral requirements change. `nominas-app-readme` spec is being **implemented**, not modified.

## Approach

1. Audit all 10 READMEs against the 7-section template, log gaps
2. Define template as canonical section order with minimum content requirements per section
3. Apply template mechanically — add missing sections, reorder existing content without deleting
4. For `common/README.md`: add note that HttpError classes originate in `@common/http` and are re-exported
5. For `apps/nominas/README.md`: write from scratch following the existing `nominas-app-readme` spec

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/ai/README.md` | Modified | Align to template (content mostly present from Change 1) |
| `packages/auth/README.md` | Modified | Align to template |
| `packages/common/README.md` | Modified | Fix HttpError cross-reference + template alignment |
| `packages/database/README.md` | Modified | Align to template (content mostly present from Change 1) |
| `packages/documents/README.md` | Modified | Align to template |
| `packages/http/README.md` | Modified | Align to template |
| `packages/inngest/README.md` | Modified | Align to template |
| `packages/playwright/README.md` | Modified | Align to template |
| `packages/resend/README.md` | Modified | Align to template |
| `packages/serve-static/README.md` | Modified | Align to template |
| `apps/nominas/README.md` | New | Create app README |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| README changes too large for single PR | Low | Template application is mechanical, ~300 lines total diff |
| Some READMEs need minimal changes | — | Accept partial standardization; 7-section structure is the minimum bar |

## Rollback Plan

Git revert. All changes are markdown-only, no code touched.

## Dependencies

- Change 1 (`doc-agents-missing-api`) completed — ai/README.md and database/README.md already have type/API content added
- Change 2 (`doc-agents-restructure`) completed — AGENTS.md now references consistent package docs

## Success Criteria

- [ ] All 10 package READMEs follow the 7-section template
- [ ] `apps/nominas/README.md` exists with module index, setup, Swagger/health endpoints
- [ ] `packages/common/README.md` cross-references `@common/http` as HttpError primary source
- [ ] `npm run build` passes (no code changes, validates TS config intact)
