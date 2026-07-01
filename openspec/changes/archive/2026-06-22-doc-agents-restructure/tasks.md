# Tasks: Restructure AGENTS.md for AI Agent Consumption

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~170 (131 additions + 20 header modifications + cross-ref links) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Package Capability Matrix

- [x] 1.1 Insert after line 22 (`---` end of Quick Reference), before line 24 (`## 1. Project Overview`): add `### Package Capability Matrix` unnumbered section with 10-row table per design §1 (Package | Import | Key Exports | §Ref columns). Precede with `---`.

## Phase 2: Architecture Section + First Renumbering

- [x] 2.1 Insert after line 133 (closing ` ``` ` of Project Overview directory tree), before line 135 (`---`): add `## 2. Architecture & Data Flow` section with ASCII dependency tree (`apps/nominas` → packages, `@common/auth` → database, stand-alone packages list) per design §2. Append `---` separator.
- [x] 2.2 Renumber 12 section headers: `## 2. Using Shared Packages` (line 137) → `## 3.`, `## 3. Development Setup` (line 154) → `## 4.`, `## 4. Commands Reference` (line 223) → `## 5.`, `## 5. Code Style Guidelines` (line 253) → `## 6.`, `## 6. External Services` (line 314) → `## 7.`, `## 7. Creating New Modules` (line 1011) → `## 8.`, `## 8. Extracting Packages` (line 1063) → `## 9.`, `## 9. Package Setup Wizard` (line 1096) → `## 10.`, `## 10. Troubleshooting` (line 1163) → `## 11.`, `## 11. Deployment Checklist` (line 1192) → `## 12.`, `## 12. Key Files` (line 1206) → `## 13.`, `## 13. Docker` (line 1218) → `## 14.`.

## Phase 3: Module Patterns Subsection

- [x] 3.1 Insert after line 311 (end of `Module Organization` code block ` ``` `), before line 312 (`---`): add `### Module Patterns` subsection under Code Style Guidelines (§6). Document Pattern A (Flat: `usuarios/` structure) and Pattern B (`services/` subdirectory: `dynamic-schema/` structure) with directory trees and usage guidance per design §3.

## Phase 4: Error Handling + Second Renumbering

- [x] 4.1 Insert after the `---` ending Code Style Guidelines (line 312, shifted by prior phases), before External Services header (currently `## 7. External Services` post-Phase2): add `## 7. Error Handling Patterns` section with 4-row strategy table (Package | Strategy | Check | Example) covering `@common/ai`, `@common/documents`, `@common/http`, `@common/database` per design §4. Append `---` separator.
- [x] 4.2 Renumber 8 headers (use content-match on `## N.` pattern, numbers are post-Phase2 values): `## 7. External Services` → `## 8.`, `## 8. Creating New Modules` → `## 9.`, `## 9. Extracting Packages` → `## 10.`, `## 10. Package Setup Wizard` → `## 11.`, `## 11. Troubleshooting` → `## 12.`, `## 12. Deployment Checklist` → `## 13.`, `## 13. Key Files` → `## 14.`, `## 14. Docker` → `## 15.`.

## Phase 5: Cross-reference Links

- [x] 5.1 Add `> **Related:**` block at end of each major section (before each `---` separator) with final §N anchors per design §5: Capability Matrix → §3; §2 Arch → §1 + §8; §6 Module Patterns → §9; §7 Error Handling → §8; all other §N sections → nearest relevant section. Use `[§N Section Name](#n-section-name)` Markdown anchors.

## Phase 6: Verification

- [x] 6.1 Run `npm run build && npm run format` — must pass (0 code changes).
- [x] 6.2 Verify renumbering: `grep -n '^## [0-9]' AGENTS.md` outputs §1–§15 sequential with no gaps. Verify each `> **Related:**` anchor (`#n-...`) resolves to an existing section header.
