# Proposal: Restructure AGENTS.md for AI Agent Consumption

## Intent

AGENTS.md (1230 lines after Change 1) is a linear reference document. AI agents need quick discovery, cross-references, and architectural context to navigate the codebase efficiently. This change adds five navigational sections without modifying existing content.

## Scope

### In Scope

1. **Package Capability Matrix** — Table after Quick Reference mapping each of the 10 packages to key exports and primary purpose.
2. **Architecture & Data Flow** — Diagram-style section after Project Overview showing inter-package dependencies (e.g., dynamic-schema → ai + documents, auth → database).
3. **Module Patterns** — Document flat structure (`usuarios/` — controller, service, repo at module root) vs services/ subdirectory structure (`dynamic-schema/` — services/ subdirectory for multi-service modules).
4. **Error Handling Patterns** — Map each package's error strategy: AI `{success:boolean}`, Documents string error codes via `DOCUMENT_ERROR_CODES`, HTTP `HttpError` class hierarchy + `createHttpError` factory, Database exceptions with retry.
5. **Cross-reference Index** — "Related Sections" links at each major section boundary.

### Out of Scope

- New API documentation (completed in Change 1)
- Standardizing package READMEs (Change 3)
- Cleanup and supplementary docs (Change 4)

## Capabilities

### New Capabilities

- `agents-doc-structure`: Document organization optimized for AI agent consumption — capability matrix, architecture diagram, module patterns, error handling patterns, cross-reference index.

### Modified Capabilities

None — restructuring of existing content only; no spec-level behavior changes.

## Approach

Insert 5 compact sections at precise anchor points in AGENTS.md:

1. **Capability Matrix** → after line ~24 (Quick Reference), before Project Overview
2. **Architecture & Data Flow** → after line ~134 (Project Overview), before Using Shared Packages
3. **Module Patterns** → after line ~310 (Code Style), before External Services
4. **Error Handling Patterns** → after Module Patterns
5. **Cross-reference links** → prepend "Related Sections:" to each existing section

All sections use compact tables and bullet points. Target ≤250 added lines total.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `AGENTS.md` | Modified | Add 5 new sections; no existing content removed or modified |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AGENTS.md exceeds 1500 lines | Medium | Keep sections concise (tables + bullets); target ≤250 lines added |
| Duplicated content with existing sections | Low | Cross-reference existing sections instead of duplicating |

## Rollback Plan

Git revert. All changes are additive sections in a single markdown file. Zero code changes.

## Dependencies

- Change 1 (`doc-agents-missing-api`) completed — current AGENTS.md already has all API surfaces documented

## Success Criteria

- [ ] Capability Matrix table within first 100 lines of AGENTS.md
- [ ] Architecture section shows inter-package dependency flows
- [ ] Module Patterns section documents flat vs services/ patterns
- [ ] Error Handling section maps each package's error strategy
- [ ] Cross-reference links exist in each major section
- [ ] `npm run build` passes (no code changes)
