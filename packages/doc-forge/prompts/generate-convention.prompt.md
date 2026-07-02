# Prompt: Generate Documentation Convention

## Input Required

- `{{PROJECT_TYPE}}` — monorepo-nestjs, single-app-fastapi, library-rust, cli-go, etc.
- `{{LANGUAGE}}` — Primary language
- `{{FRAMEWORK}}` — Primary framework
- `{{SRC_DIR}}` — Source directory structure
- `{{EXISTING_DOCS}}` — List of existing documentation files with their current state
- `{{TEAM_PREFERENCES}}` — Detected or user-provided preferences:
  - Primary human language for docs (English, Spanish, Japanese, etc.)
  - Preferred diagram tool (Mermaid, PlantUML, ASCII)
  - Commit message convention (conventional commits, custom format)
  - Status tag preference (HTML comments, badges, YAML frontmatter)
- `{{INDICES_USED}}` — Which index modes are active (feature-to-file, capability-matrix, cross-cutting, error-handling)

## Output Format

A DOCUMENTATION-CONVENTION.md file:

```markdown
# Documentation Convention — {{PROJECT_NAME}}

This convention defines how to structure documentation so it is consumable
by both humans and AI agents. The goal is that any agent can understand the
project, its dependencies, and how to contribute without ambiguity.

## 1. File Naming and Structure

## 2. Required Documentation Per Component

## 3. {{LANGUAGE_DOC_FORMAT}} (JSDoc, Docstrings, etc.)

## 4. Cross-References

## 5. AGENTS.md — Master Index

## 6. Documentation Status Tags

## 7. Diagrams

## 8. Auto-Sync Rules

### Triggers for Documentation

### Commit Message Template

### Pre-Commit Checklist for AI Agents

## 9. Index Strategies Applied
```

## Prompt

```
You are establishing the documentation convention for {{PROJECT_NAME}}.

PROJECT CONTEXT:
- Type: {{PROJECT_TYPE}}
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Source directory: {{SRC_DIR}}
- Primary human language: {{HUMAN_LANGUAGE}}

TEAM PREFERENCES:
{{TEAM_PREFERENCES}}

EXISTING DOCUMENTATION (for reference — what's already in place):
{{EXISTING_DOCS_LIST}}

ACTIVE INDEX STRATEGIES (these will be applied):
{{INDICES_USED_LIST}}

YOUR TASK:
Generate a DOCUMENTATION-CONVENTION.md that establishes the standard for all
future documentation. This is the FIRST file generated because all other docs
depend on it.

---

## SECTION 1: File Naming and Structure

Define naming conventions:

- README files: `README.md` in every package/module directory
- Configuration docs: `CONFIG.md`, not `config.md` or `configuration.md`
- Index doc: `AGENTS.md` at root (for AI agents), not `DEVELOPER_GUIDE.md`
- Changelog: `CHANGELOG.md` at root using Keep a Changelog format
- Architecture decisions: `docs/adr/NNNN-title-with-dashes.md`

Define directory structure requirements:
```

{{PACKAGE_DIR_TEMPLATE}}/
├── README.md # [REQUIRED] Entry point
├── {{SRC_STRUCTURE}} # [REQUIRED] Source code with docs
├── package.json # [REQUIRED] Metadata
└── tsconfig.json # [REQUIRED] Config

````

---

## SECTION 2: Required Documentation Per Component

Build a table based on {{PROJECT_TYPE}}:

| Document | Monorepo | Single App | Library | CLI Tool |
|----------|----------|------------|---------|----------|
| README.md | Required | Required | Required | Required |
| AGENTS.md | Required | Recommended | Optional | Optional |
| CHANGELOG.md | Required | Required | Required | Required |
| CONTRIBUTING.md | Required | Recommended | Required | Recommended |
| DOCUMENTATION-CONVENTION.md | Recommended | Recommended | Optional | Optional |
| Package READMEs | Required (per pkg) | N/A | N/A | N/A |
| Module READMEs | N/A | Recommended | N/A | Optional |
| SECURITY.md | Required (public) | Required (public) | Required (public) | Optional |
| CODE_OF_CONDUCT.md | Required (public) | Required (public) | Required (public) | Optional |
| LICENSE | Required | Required | Required | Required |

For README.md, define the MINIMUM sections:

| Section | Required | Description |
|---------|----------|-------------|
| `# Name` | Yes | Title with component name |
| `## Quick Start` | Yes | Minimal import + usage code |
| `## Environment Variables` | Yes | Table: variable, default, required, description |
| `## API Reference` | Yes | Table: export, type, description, example |
| `## Dependencies` | Yes | External + internal dependency tables |
| `## Error Handling` | Yes | Error strategy + try/catch examples |
| `## Common Pitfalls` | Recommended | Non-obvious gotchas |
| `## Deployment` | Recommended | Production considerations |

---

## SECTION 3: {{LANGUAGE_DOC_FORMAT}}

Define the docstring/JSDoc standard for {{LANGUAGE}}:

### Required Tags

For TypeScript/JavaScript:
```typescript
/**
 * {{ONE_LINE_DESCRIPTION}}
 * @param {{PARAM}} - {{DESCRIPTION}}
 * @returns {{DESCRIPTION}}
 * @throws {{ERROR_TYPE}} {{CONDITION}}
 */
````

For Python (Google style):

```python
"""{{ONE_LINE_DESCRIPTION}}

Args:
    {{param}}: {{description}}

Returns:
    {{description}}

Raises:
    {{ErrorType}}: {{condition}}
"""
```

### Exceptions

Define what does NOT need documentation:

- Private methods (name should be self-descriptive)
- Obvious constructor parameters (e.g., dependency injection)
- Simple getters/setters
- Test files

### Required for ALL Public Exports

Every exported class, function, decorator, guard, interface MUST have a docstring.
The @param tags must match the parameter names exactly (case-sensitive).

---

## SECTION 4: Cross-References

Define how to reference other packages/modules within the project:

In Markdown:

```markdown
Depends on: [@common/database](../database/README.md)
Used by: [@common/resend](../resend/README.md)
See also: [AuthModule — Two Factor](../auth/README.md#two-factor)
```

In JSDoc/Docstrings:

```{{LANGUAGE}}
// @see {@link AuthService} for user validation
```

Rules:

- Use RELATIVE paths (not absolute) so links work in any checkout location
- Include section anchors (`#section-name`) when pointing to specific content
- Every package README must list its internal dependencies and consumers

---

## SECTION 5: AGENTS.md — Master Index

Define what the AGENTS.md index must contain:

- Quick reference of commands
- Feature-to-file index (if {{PROJECT_TYPE}} is monorepo or multi-module)
- Cross-cutting concerns table
- Package capability matrix
- Architecture diagram (Mermaid)
- Error handling patterns table
- Per-package reference sections with purpose, location, dependencies, and doc status
- Creating new modules guide with code examples
- Deployment checklist

---

## SECTION 6: Documentation Status Tags

Define how to mark documentation status:

```markdown
<!-- {{PACKAGE_NAME}} — status: complete | partial | critical -->
```

| Status     | Meaning                                     | CI Action  |
| ---------- | ------------------------------------------- | ---------- |
| `complete` | README + JSDoc + tested examples            | Pass check |
| `partial`  | README exists but missing JSDoc or sections | Warning    |
| `critical` | No README or incorrect information          | Fail CI    |

The first line of every README must be the status tag.

---

## SECTION 7: Diagrams

Define diagram conventions:

- Use Mermaid for inline diagrams in READMEs
- For architecture: `graph TD` or `graph LR`
- For sequences: `sequenceDiagram`
- No external image hosting — everything inline in markdown
- Maximum 15 nodes per diagram for readability

---

## SECTION 8: Auto-Sync Rules

### Triggers for Documentation

When an AI agent or developer makes ANY of these changes, they MUST document it:

| Action                   | Documentation Required                                        |
| ------------------------ | ------------------------------------------------------------- |
| New package/module       | README.md + package.json + tsconfig + JSDoc + AGENTS.md index |
| New public method/export | JSDoc on the method/export                                    |
| New environment variable | Add to README.md env table + AGENTS.md                        |
| New API endpoint         | Swagger/OpenAPI decorators + README API table                 |
| New external dependency  | Add to README dependencies section                            |
| Breaking change          | CHANGELOG.md entry                                            |
| Removed/renamed export   | Update all cross-references                                   |

### Commit Message Template

```
docs(@common/{{PACKAGE_NAME}}): {{BRIEF_CHANGE}}

- README.md: updated {{SECTION}}
- JSDoc: added to {{CLASS}}.{{METHOD}}
```

### Pre-Commit Checklist for AI Agents

- [ ] JSDoc on all new public exports
- [ ] README.md of affected package updated
- [ ] `package.json` description updated if applicable
- [ ] New environment variables documented in README
- [ ] AGENTS.md updated if structural changes
- [ ] CHANGELOG.md updated if breaking change

---

## SECTION 9: Index Strategies Applied

List which index modes are active and where they appear:

| Index Mode        | Active                     | Location      | Purpose                        |
| ----------------- | -------------------------- | ------------- | ------------------------------ |
| Feature-to-File   | {{FEATURE_TO_FILE_ACTIVE}} | AGENTS.md §2  | Map questions to files         |
| Capability Matrix | {{CAPABILITY_ACTIVE}}      | AGENTS.md §3  | Package → import → exports     |
| Cross-Cutting     | {{CROSS_CUTTING_ACTIVE}}   | AGENTS.md §2a | Hidden dependencies            |
| Error Handling    | {{ERROR_HANDLING_ACTIVE}}  | AGENTS.md §7  | Per-component error strategies |

---

## GLOBAL RULES:

1. WRITE IN {{HUMAN_LANGUAGE}} — if the team communicates in a non-English language,
   write the convention in that language. Structural headings may be bilingual.

2. BE SPECIFIC — every rule must have a code example showing the correct format.
   "Use JSDoc" is not enough. Show the exact template with @param, @returns, @throws.

3. MACHINE-CHECKABLE — every rule must be verifiable by CI, not just human review.
   If a rule says "every public export must have JSDoc", there must be a CI job
   that counts undocumented exports.

4. ADAPTED TO {{PROJECT_TYPE}} — the convention must reflect the actual project
   structure, not a generic template. If the project is a monorepo, the convention
   tells you where package READMEs go. If it's a single app, it tells you where
   module READMEs go.

5. SELF-VALIDATE: After writing, verify:
   - Every section has a purpose statement
   - All code examples use the actual {{LANGUAGE}} syntax
   - The status table has CI actions defined
   - The trigger table covers all common change types
   - The pre-commit checklist is actionable (concrete checks, not vague)

OUTPUT the complete DOCUMENTATION-CONVENTION.md. Do NOT wrap in code fences.

```

## Usage Context

- **Phase**: Phase 3 (Generate) — step 1 of document generation order (MUST be first)
- **Trigger**: After Phase 2 blueprint determines what docs are needed
- **Depends on**: Phase 0 hydration, Phase 1 audit, Phase 2 blueprint
- **Feeds into**: ALL other generation prompts (they read CONVENTION.md for format rules)
- **Re-run frequency**: Rarely — only when the team wants to change documentation standards

## Real Example from nestJs-boilerplate

This prompt was applied to the NestJS 11 monorepo to produce `DOCUMENTATION-CONVENTION.md`:

**What existed before**: No convention document. Documentation standards were implicit — some READMEs had status tags, some had API tables, but formats were inconsistent.

**What the prompt produced**: A 163-line convention in Spanish (the team's primary language) covering:

1. **Naming per package**: Required file structure for every `packages/<name>/` — README.md, src/, package.json, tsconfig.json
2. **README minimum content**: 6 required sections (Title, Quick Start, Env Vars, API, Dependencies, Deployment) with a table showing which are mandatory vs recommended
3. **JSDoc standard**: Exact template showing `@param`, `@returns`, `@throws` with a real `sendEmail()` example. Defined exceptions: private methods, DI constructors don't need docs.
4. **Cross-references**: Markdown format and JSDoc format for linking between packages
5. **AGENTS.md structure**: 7 required sections — Table of contents, Quick reference, Code rules, Architecture diagram, Per-package sections with purpose+location+dependencies+doc status
6. **Status tags**: Table defining `complete`, `partial`, `critical` with their meanings
7. **Mermaid diagrams**: Requirement to use Mermaid for inline architecture diagrams
8. **Auto-sync triggers**: Table mapping code changes to required doc updates (new package → README+JSDoc+AGENTS.md, new env var → README+AGENTS.md, etc.)
9. **Commit template**: `docs(@common/<name>): <brief change>` format
10. **Pre-commit checklist**: 5 actionable items for AI agents before committing
11. **Cross-package index**: Mermaid diagram grouping 10 packages into 5 architectural layers (Core, Auth, Communication, Integration, Presentation)

**Key decision**: The convention was written in Spanish because the team is Spanish-speaking. The prompt's "write in {{HUMAN_LANGUAGE}}" rule correctly detected the team language from existing docs and code comments. However, all SECTION HEADINGS in the generated convention were kept in English (or bilingual) to ensure CI tools and non-Spanish-speaking agents could still parse the structure.

**Impact**: After this convention was applied, all 10 package READMEs were regenerated with consistent sections, status tags, and cross-references. The CI `doc-check.yml` job validates compliance automatically.
```
