# Proposal: Documentation Cleanup and Supplementary Files

## Intent

Final cleanup of the documentation ecosystem after Changes 1–3. Remove corrupt/obsolete files, clean empty directories, relocate non-documentation artifacts, and add supplementary documentation.

## Scope

### In Scope

1. **Delete** `README.mdgit` — corrupt UTF-16 LE binary, not valid markdown.
2. **Move** `inngest-config-context.md` (5006-line AI agent session debug log) from root to `.kiro/`.
3. **Remove** empty directory tree `packages/resend/src/dto/`.
4. **Remove** empty directory tree `packages/serve-static/templates/assets/` (empty `css/` + `js/` subdirs).
5. **Create** `CONTRIBUTING.md` with: fork/branch/PR workflow, conventional commit rules, code review process, local dev setup, links to AGENTS.md and BOILERPLATE.md.
6. **Add purpose note** to `AGENTS.md` top: "Technical reference for AI agents (English, concise, API-focused)."
7. **Add purpose note** to `BOILERPLATE.md` top: "Developer guide for humans (Spanish, narrative, tutorial-style)."

### Out of Scope

- Docker/deployment docs, new API documentation, source code changes.

## Capabilities

### New Capabilities

None — cleanup and supplementary docs only.

### Modified Capabilities

None — no behavioral changes to existing capabilities.

## Approach

Straightforward file-system operations: delete 1 corrupt file, move 1 session log, remove 2 empty directory trees, create CONTRIBUTING.md, prepend purpose notes to 2 files.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `README.mdgit` | Deleted | Corrupt UTF-16 LE binary |
| `inngest-config-context.md` | Moved | Relocate to `.kiro/` |
| `packages/resend/src/dto/` | Deleted | Empty directory tree |
| `packages/serve-static/templates/assets/` | Deleted | Empty directory tree |
| `CONTRIBUTING.md` | New | Contribution guide |
| `AGENTS.md` | Modified | Purpose note at top |
| `BOILERPLATE.md` | Modified | Purpose note at top |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `inngest-config-context.md` needed for reference | Low | Move (not delete); accessible in `.kiro/` |

## Rollback Plan

Git revert each commit. If directories need restoration: `mkdir -p`.

## Dependencies

- Changes 1, 2, 3 completed.

## Success Criteria

- [ ] `README.mdgit` deleted
- [ ] `inngest-config-context.md` moved to `.kiro/`
- [ ] `packages/resend/src/dto/` and `packages/serve-static/templates/assets/` removed
- [ ] `CONTRIBUTING.md` created with required sections
- [ ] `AGENTS.md` and `BOILERPLATE.md` have purpose notes at top
- [ ] `npm run build` passes
