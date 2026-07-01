# Design: Document APIs Missing from AGENTS.md

## Technical Approach

Additive documentation-only change — zero code modifications. Insert 5 new/updated subsections into AGENTS.md §6 following the existing pattern (heading → import code block → inline example → endpoint table where applicable). Each subsection maps 1:1 to a spec requirement. Update BOILERPLATE.md structure tree and §4 to reference the dynamic-schema app module. Amend `packages/ai/README.md` and `packages/database/README.md` with new API references. Create `apps/nominas/README.md` as a module index.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| Document dynamic-schema under AGENTS.md §6 (External Services) vs. §7 (Creating Modules) | §6 keeps all API surfaces unified; §7 would imply it's a template. dynamic-schema is a concrete module, not a pattern. | **§6** — subtitle "App Module: @common/dynamic-schema" with note it lives in apps/nominas/. |
| HttpError classes in @common/http vs. @common/common | Duplicated class hierarchy exists in both packages. Only `@common/common` re-exports them. Spec requires documenting under @common/http. | **Document under @common/http** with a cross-reference note: "Also exported from `@common/common`." |
| Transaction decorators as subsection of existing Transaction vs. new top-level §6 entry | Existing `@common/database` §6 entry already has Transaction Support block. Extending it in-place minimizes cognitive diff. | **Extend in-place** under `@common/database` — add sub-headings for Declarative API and TransactionManager. |
| apps/nominas/README.md tone: English vs. Spanish | AGENTS.md is English, BOILERPLATE.md is Spanish. App README is for developers navigating modules. | **English** — consistent with AGENTS.md, the primary developer reference for module browsing. |

## Data Flow

```
Spec requirement ──→ Source code API signature verification ──→ Doc subsection placement
                                      │
       AGENTS.md §6 ◄── dynamic-schema, http, ai+, database+
       BOILERPLATE.md ◄── structure tree + §4.11 dynamic-schema
       packages/ai/README.md ◄── generateSchemaFromImage/Text
       packages/database/README.md ◄── @Transaction, TransactionManager
       apps/nominas/README.md ◄── CREATE (does not exist)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `AGENTS.md` | Modify | Insert dynamic-schema subsection after existing §6 services. Extend `@common/ai` (add generateSchemaFromImage/Text to key methods table + code example). Extend `@common/database` (add @Transaction/@TransactionParam/TransactionManager sub-headings). Insert new `@common/http` subsection (HttpError table + DownloadService API + HttpModule registration). |
| `BOILERPLATE.md` | Modify | Add `dynamic-schema/` to structure tree (line 149). Add §4.11 dynamic-schema with one-paragraph description and cross-reference to AGENTS.md for full API. |
| `packages/ai/README.md` | Modify | Add `generateSchemaFromImage()` and `generateSchemaFromText()` entries after existing `generateSchema()` in API Reference. Each includes signature, params, returns, example, and cross-ref to dynamic-schema module. |
| `packages/database/README.md` | Modify | Add "Declarative Transaction API" section after existing "WithTransaction Service Pattern" — documents `@Transaction()` and `@TransactionParam()`. Add "TransactionManager" section for programmatic lifecycle API. Include comparison table (decorator vs. withTransaction vs. TransactionManager). |
| `apps/nominas/README.md` | Create | Application overview, module composition table (6 imported modules), local module index (usuarios + dynamic-schema), setup instructions, Swagger/health check endpoints, navigation links to AGENTS.md and package READMEs. |

## Interfaces / Contracts

No code interfaces defined. Documentation contracts:

- **AGENTS.md §6 subsection header**: `### @common/dynamic-schema (App Module)`
- **Endpoint table columns**: Method | Path | Body | Response | Errors
- **Method signature convention**: `methodName(param: Type, options?: OptionsType): Promise<ReturnType>`
- **Cross-reference format**: `> See [package/README.md](./packages/name/README.md) for full API.`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Lint | Markdown validity | `npm run lint` — ESLint ignores `.md`, no change |
| Build | TypeScript compilation unaffected | `npm run build` must pass unchanged |
| Manual | Doc accuracy | Verify each API signature matches source; verify all imports exist in package index files |

No automated tests — documentation-only change. Manual verification checklist embedded in tasks.

## Migration / Rollout

No migration required. All changes are additive markdown sections. Rollback via `git revert`. No dependency on other changes.

## Open Questions

- [ ] Should `@common/http` index.ts be updated to re-export `HttpError` classes? Currently not exported, but spec mandates documenting them. Resolve during apply — document as-is with `@common/common` cross-reference.
- [ ] dynamic-schema module lives in `apps/nominas/` not `packages/`. Should AGENTS.md note this as a pattern deviation or propose moving it to packages? Resolve: document as-is; moving is out of scope for this change.
