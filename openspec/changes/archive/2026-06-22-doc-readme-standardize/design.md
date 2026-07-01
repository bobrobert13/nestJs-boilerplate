# Design: Standardize Package READMEs

## Technical Approach

Mechanical template alignment — audit each README against a 7-section canonical structure, then add missing sections and reorder content. Never delete existing content; only add/reorder. Most READMEs are 70–90% compliant; the fix is section renaming and consolidating scattered content under canonical headings.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Template structure | 7 sections: Description → Features → Installation → Quick Start → API Reference → Configuration → Error Handling → Common Pitfalls | Mirrors proposal spec; matches what AI agents scan for first |
| Content preservation | Additive only — reorder sections, never delete text | Zero risk of information loss; git diff shows pure structural moves |
| HttpError in @common/common | Add note: "Primary definition in @common/http; re-exported here for convenience" + link | Fixes documented inconsistency (AGENTS.md §7 already says import from either) |
| Thin sections | "No environment variables required" is valid content | Don't fabricate content; agents need to know there's nothing to configure |
| Section naming | "Common Pitfalls" not "Common Issues" or "Troubleshooting" | Consistent canonical name across all 10 READMEs |

## README Audit Matrix

| Package | Lines | Descr | Feat | Install | QuickStart | API Ref | Config | Error | Pitfalls |
|---------|-------|-------|------|---------|------------|---------|--------|-------|----------|
| ai | 849 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PARTIAL | ✅ |
| auth | 358 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| common | 174 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| database | 293 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| documents | 167 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | PARTIAL |
| http | 180 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| inngest | 181 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| playwright | 201 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| resend | 169 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| serve-static | 212 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

**Legend**: ✅=present, ❌=missing, PARTIAL=content exists but scattered or in wrong section

## Per-File Changes

### ai — Reorder + extract Error Handling
- Move duplicate "Environment Variables" into single `## Configuration` section
- Extract `## Error Handling` from "Best Practices" item #1 (success check pattern)
- Rename "Troubleshooting" → `## Common Pitfalls`

### auth — Add 3 missing sections
- Add `## API Reference` consolidating AuthService methods, decorators, guards
- Add `## Error Handling` (UnauthorizedException pattern, token expiry)
- Add `## Common Pitfalls` (JWT secret min length, Argon2 memory in Docker, role guard ordering)

### common — Add 2 sections + HttpError fix
- Add `## API Reference` consolidating BaseAdapter, DatabaseExceptionFilter, HttpError classes (primitive, not the full hierarchy — see below)
- Add `## Configuration` state "No environment variables required"
- Fix HttpError section: replace hierarchy listing with cross-reference paragraph pointing to `@common/http` as primary definition, noting re-export convenience

### database — Add Error Handling
- Add `## Error Handling` (MongoServerSelectionError, TransientTransactionError, retry behavior)

### documents — Add Configuration + rename
- Add `## Configuration` state "No environment variables required"
- Rename "Limits and Constraints" content into `## Common Pitfalls`

### http — Add Configuration
- Add `## Configuration` state "No environment variables required (axios URLs are per-request)"

### inngest — Add API Ref + Error Handling
- Add `## API Reference` consolidating sendEvent, sendEvents, createFunction signatures
- Add `## Error Handling` (fetch failed, event not synced, step retry pattern)

### playwright — Add Error Handling
- Add `## Error Handling` (browser not installed, selector timeout, navigation failure patterns)

### resend — Add Error Handling
- Add `## Error Handling` (Unauthorized for invalid key, domain verification, template rendering failures)

### serve-static — Rename + Add 2 sections
- Rename "Usage" heading to `## Quick Start`
- Add `## Error Handling` (template not found, EJS compile errors)
- Add `## Common Pitfalls` (static assets path, Tailwind CDN in production)

### apps/nominas — Expand per spec
Existing ~49 lines; expand to fulfill `nominas-app-readme` spec:
- Add `## Architecture` listing all 6 AppModule imports with descriptions
- Add `## Prerequisites` with explicit Node 20+, MongoDB version
- Add `## Environment Variables` table referencing root `.env.example`
- Expand `## Module Documentation` with endpoint tables for usuarios and dynamic-schema

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/ai/README.md` | Modify | Reorder + extract Error Handling + rename Troubleshooting |
| `packages/auth/README.md` | Modify | Add API Reference, Error Handling, Common Pitfalls sections |
| `packages/common/README.md` | Modify | Add API Ref, Config; fix HttpError cross-reference |
| `packages/database/README.md` | Modify | Add Error Handling section |
| `packages/documents/README.md` | Modify | Add Config; rename Limits→Common Pitfalls |
| `packages/http/README.md` | Modify | Add Configuration section |
| `packages/inngest/README.md` | Modify | Add API Reference, Error Handling sections |
| `packages/playwright/README.md` | Modify | Add Error Handling section |
| `packages/resend/README.md` | Modify | Add Error Handling section |
| `packages/serve-static/README.md` | Modify | Rename Usage→Quick Start; add Error Handling + Common Pitfalls |
| `apps/nominas/README.md` | Modify | Expand per nominas-app-readme spec (49→~120 lines) |
| `openspec/changes/doc-readme-standardize/design.md` | Create | This file |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Build | No broken imports or TS errors | `npm run build` must pass |
| Link check | All relative links resolve | Manual grep for `](../../` patterns |
| Template compliance | All 10 READMEs have 7 sections | `grep -c "^## "` per file ≥ 7 |
| Lint | Markdown style consistent | `npm run format` on all .md files |

No code changes — no unit/integration/e2e tests needed.

## Migration / Rollout

No migration required. All changes are markdown-only. `git revert` for rollback.

## Open Questions

- None. Template and per-file changes are fully specified.
