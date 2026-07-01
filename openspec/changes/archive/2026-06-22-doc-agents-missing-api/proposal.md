# Proposal: Document APIs Missing from AGENTS.md

## Intent

A documentation audit (108 TS files, 20 .md files, 10 packages, 2 app modules) identified 5 API surfaces in source code but absent from AGENTS.md, BOILERPLATE.md, and package READMEs. This change documents all 5 — first of 4 audit-driven documentation changes.

## Scope

### In Scope
1. Add `dynamic-schema` module docs — 5 endpoints (extract, generate-from-text, generate-from-image, compile, pipeline), 3 services, AI document pipeline. Zero current documentation anywhere.
2. Add `@common/ai` methods `generateSchemaFromImage()` and `generateSchemaFromText()` to AGENTS.md and packages/ai/README.md.
3. Document `@common/database` declarative transaction API: `@Transaction()`, `@TransactionParam()`, `TransactionManager`. Only `TransactionService.withTransaction()` documented now.
4. Add `@common/http` section to AGENTS.md: HttpError hierarchy (7 classes + `createHttpError` factory), `DownloadService` (`file()`, `image()` with Sharp, `video()`).
5. Create `apps/nominas/README.md` — main app has zero module documentation.

### Out of Scope
- AGENTS.md restructuring (Change 2)
- Package README standardization (Change 3)
- Cleanup/supplementary docs (Change 4)
- Docker/deployment docs
- Source code changes

## Capabilities

### New Capabilities
- `dynamic-schema-module`: 5 endpoints (extract, generate-from-text, generate-from-image, compile, pipeline) for AI-powered document-to-schema pipeline.
- `ai-schema-generation`: generateSchemaFromImage() / generateSchemaFromText() — derive MongoDB schemas from images and text.
- `database-transaction-decorators`: @Transaction(), @TransactionParam(), TransactionManager — declarative and programmatic transactions.
- `http-error-download`: HttpError hierarchy (7 classes + createHttpError factory) and DownloadService (file, image with Sharp, video).
- `nominas-app-docs`: Application README with module index and setup.

### Modified Capabilities
None — documentation additions only, no spec-level behavior changes.

## Approach

Add `dynamic-schema` and `@common/http` sections to AGENTS.md §6. Amend `@common/ai` and `@common/database` subsections. Update BOILERPLATE.md §3 with dynamic-schema module pattern. Update packages/ai/README.md, packages/database/README.md. Create apps/nominas/README.md.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| AGENTS.md §6 | Modified | Add dynamic-schema, http sections; extend ai, database |
| BOILERPLATE.md | Modified | Add dynamic-schema module pattern reference |
| packages/ai/README.md | Modified | Add generateSchemaFromImage/Text methods |
| packages/database/README.md | Modified | Add @Transaction, @TransactionParam, TransactionManager |
| apps/nominas/README.md | New | Module index, setup, and navigation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Docs become stale | Low | Docs reference actual API shapes verified from source |
| AGENTS.md grows too large | Low | ~200 line additions; current size 880 lines |

## Rollback Plan

All changes are additive markdown sections. Revert via `git revert`. No code changes involved.

## Dependencies

- SDD Init completed (openspec/ exists, Engram persisted)

## Success Criteria

- [ ] AGENTS.md documents all 5 missing API surfaces
- [ ] apps/nominas/README.md exists with module descriptions
- [ ] packages/ai/README.md includes generateSchemaFromImage/Text
- [ ] packages/database/README.md includes Transaction decorators
- [ ] `npm run lint` passes (markdown does not affect lint)
- [ ] Docs match actual source API signatures (verified during audit)
