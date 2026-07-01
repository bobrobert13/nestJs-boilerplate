# Design: Restructure AGENTS.md for AI Agent Consumption

## Technical Approach

Insert 5 additive sections into AGENTS.md (1231 lines) at precise anchor points. Zero existing
content is removed or modified. All new sections use compact tables and bullet lists. The
renumbering cascade propagates through §2 → §15 across all existing cross-references.
Estimated addition: ≤250 lines.

## Architecture Decisions

### Decision: Capability Matrix placement

| Option | Tradeoff |
|--------|----------|
| After Quick Reference (unnumbered) | First scan-able table; no renumbering cost |
| After §2 Using Shared Packages | Matches proposal but buried under 133 lines |
| Inside §1 Project Overview | Overloads an already heavy section |

**Choice**: Unnumbered section after Quick Reference (line 22), before §1. The spec demands
"within first 100 lines" — this guarantees line ≤50. Renumbering cost: none.

### Decision: Architecture & Data Flow placement

| Option | Tradeoff |
|--------|----------|
| New §2, shift all following +1 | Clean numbering; logical flow after overview |
| Unnumbered between §1 and §2 | No renumbering but invisible in ToC surface |
| Subsection of §1 | Mixed with directory tree, loses prominence |

**Choice**: New §2. Shifts old §2–§13 → new §3–§14. 12 cross-reference fixes needed
within AGENTS.md (all internal links update from `§N` to `§N+1`).

### Decision: Error Handling sectioning

| Option | Tradeoff |
|--------|----------|
| New top-level §7 | Clear prominence, own anchor, shifts §6–§13 → §8–§15 |
| Subsection of §6 Code Style | Keeps numbering but wrong semantic bucket |

**Choice**: New top-level §7 Error Handling Patterns. Shifts old §6 (External Services)
to §8, continuing the cascade. Error strategies are an architectural concern, not style.

## Data Flow — Section Insertion Map

```
Current AGENTS.md (1231 lines)
│
├── [line 1-22]    Quick Reference           ← no change
├── [INSERT]       Package Capability Matrix  ← after line 22, unnumbered
├── [line 24-133]  §1 Project Overview        ← no change (anchor unchanged)
├── [INSERT]       §2 Architecture & Data Flow← NEW, after line 133
├── [line 137-151] §2→§3 Using Shared Pkgs    ← renumbered
├── [line 154-220] §3→§4 Development Setup    ← renumbered
├── [line 223-249] §4→§5 Commands Reference   ← renumbered
├── [line 253-311] §5→§6 Code Style           ← renumbered
│   └── [INSERT]   Module Patterns            ← new subsection, after Module Org
├── [INSERT]       §7 Error Handling Patterns  ← NEW, before old §6
├── [line 314-1008]§6→§8 External Services    ← renumbered
├── [line 1011-1059]§7→§9 Creating Modules    ← renumbered
├── [line 1063-1092]§8→§10 Extracting Pkgs    ← renumbered
├── [line 1096-1159]§9→§11 Setup Wizard       ← renumbered
├── [line 1163-1188]§10→§12 Troubleshooting   ← renumbered
├── [line 1192-1202]§11→§13 Deploy Checklist  ← renumbered
├── [line 1206-1214]§12→§14 Key Files         ← renumbered
└── [line 1218-1231]§13→§15 Docker            ← renumbered
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `AGENTS.md` | Modify | Insert 5 sections at anchors; update 12 internal section-number cross-references; add Related-links to each major section ending |

## Section Content Design

### Section 1: Package Capability Matrix (after line 22)

Markdown table, 10 rows + header. Columns: Package | Import | Key Exports | §Ref.

```
| @common/ai      | @common/ai        | AiModule, AiService, ChatMessage     | §8 |
| @common/auth    | @common/auth       | AuthModule, JwtAuthGuard, Public, Roles, TwoFactorService, PasskeysService | §8 |
| @common/common | @common/common | DatabaseExceptionFilter, HttpError | §8 |
| @common/database| @common/database   | DatabaseModule, TransactionService   | §8 |
| @common/documents| @common/documents | DocumentProcessorService             | §8 |
| @common/http    | @common/http       | HttpModule, HttpService, DownloadService | §8 |
| @common/inngest | @common/inngest    | InngestModule, InngestService        | §8 |
| @common/playwright| @common/playwright| PlaywrightModule, PlaywrightService  | §8 |
| @common/resend  | @common/resend     | ResendModule, ResendService, NewsletterModule | §8 |
| @common/serve-static| @common/serve-static| ServeStaticModule, ServeStaticService | §8 |
```

Section header: `### Package Capability Matrix` (unnumbered, same level as Quick Reference).
Preceded by a horizontal rule.

### Section 2: Architecture & Data Flow (new §2)

ASCII dependency tree + explanatory text. Uses `→` for direction.

```
apps/nominas
 ├── @common/database
 ├── @common/inngest
 ├── @common/playwright
 └── modules
      ├── usuarios              (standalone CRUD)
      └── dynamic-schema
           ├── @common/ai
           └── @common/documents

@common/auth ── @common/database
 ├── two-factor/
 └── passkeys/

@common/resend
 └── modules/newsletter/
```

Packages with zero project-internal deps (only npm): `common`, `http`, `serve-static`, `documents`, `inngest`, `playwright`, `ai`.

### Section 3: Module Patterns (new subsection under §6 Code Style)

Two patterns with directory trees:

**Pattern A: Flat (CRUD modules)**
```
apps/nominas/src/modules/mi-modulo/
├── dto/
├── interfaces/
├── schemas/
├── mi-modulo.controller.ts
├── mi-modulo.module.ts
├── mi-modulo.repository.ts
└── mi-modulo.service.ts
```

Use when: Single entity CRUD (matching `usuarios/`).

**Pattern B: services/ subdirectory**
```
apps/nominas/src/modules/mi-modulo/
├── dto/
├── schemas/
├── services/                   ← multi-service logic
│   ├── mi-modulo.service.ts
│   └── mi-modulo-helper.service.ts
├── mi-modulo.controller.ts
├── mi-modulo.module.ts
└── mi-modulo.repository.ts
```

Use when: Multiple internal services or orchestrator (matching `dynamic-schema/`).

### Section 4: Error Handling Patterns (new §7)

| Package | Strategy | How to check | Example |
|---------|----------|-------------|---------|
| @common/ai | AIResponse.success boolean | `if (result.success)` | `const r = await ai.generateText(...); if (r.success) console.log(r.data);` |
| @common/documents | DOCUMENT_ERROR_CODES via Error.message | `JSON.parse(error.message)` | `throw new Error(JSON.stringify({code: DOCUMENT_ERROR_CODES.DOCUMENT_PARSE_ERROR, message: "..."}))` |
| @common/http | HttpError class hierarchy | `error instanceof HttpError` | `try { ... } catch (e) { if (e instanceof NotFoundError) { ... } }` |
| @common/database | NestJS exceptions + Mongoose retry | `try/catch` | `try { ... } catch (e) { if (e instanceof mongoose.Error.MongooseServerSelectionError) { ... } }` |

### Section 5: Cross-reference Index

Each major section gets a `> **Related:**` block at the end. Examples:

After Capability Matrix:
```
> **Related:** [§3 Using Shared Packages](#3-using-shared-packages) for import syntax
```

After §2 Architecture:
```
> **Related:** [§1 Project Overview](#1-project-overview) for directory tree | [§8 External Services](#8-external-services) for detailed API docs
```

After §7 Error Handling:
```
> **Related:** [§8 External Services](#8-external-services) → each package subsection | [§8 @common/database](#commondatabase) for transaction retry
```

After §6 Module Patterns subsection:
```
> **Related:** [§8 Creating New Modules](#9-creating-new-modules) for step-by-step guide
```

All §N references use final renumbered values.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | Section placement | Grep for new section headers at correct line ranges |
| Integrity | Internal cross-references | Verify all `§N` references match final section numbers |
| Build | `npm run build` | Must pass (0 code changes) |
| Format | `npm run format` | No markdown syntax errors |

No runtime tests — documentation-only change.

## Migration / Rollout

No migration required. `git revert` for rollback. All changes are additive markdown
insertions in a single file.

## Open Questions

None. Verified: `tsconfig.json` line 25 confirms the path `@common/common` → `packages/common/src/index.ts`. AGENTS.md already uses this correctly.
