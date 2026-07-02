# Prompt: Generate AGENTS.md

## Input Required

- `{{PROJECT_NAME}}` — Project name
- `{{PROJECT_TYPE}}` — monorepo-nestjs, single-app-fastapi, library-rust, etc.
- `{{LANGUAGE}}` — Primary language
- `{{FRAMEWORK}}` — Primary framework
- `{{SRC_DIR}}` — Source directory from hydration (e.g., `packages/`)
- `{{APP_DIR}}` — Application directory (e.g., `apps/`) — optional, for monorepos
- `{{PKG_MANAGER}}` — npm, yarn, pnpm, pip, cargo, go
- `{{TEST_CMD}}` — Test command
- `{{LINT_CMD}}` — Lint command
- `{{BUILD_CMD}}` — Build command
- `{{FORMAT_CMD}}` — Format command (optional)
- `{{DEV_CMD}}` — Dev server command
- `{{AUDIT_RESULTS}}` — Phase 1 audit (for knowing what's missing)
- `{{BLUEPRINT}}` — Phase 2 blueprint (which sections are required)
- `{{INDICES}}` — Generated index content from Phase 3:
  - Feature-to-file rows (`{{FEATURE_ROWS}}`)
  - Capability matrix rows (`{{PACKAGE_ROWS}}`)
  - Cross-cutting rows (`{{CROSS_CUTTING_ROWS}}`)
  - Error handling rows (`{{ERROR_ROWS}}`)
- `{{PACKAGE_READMES}}` — All generated package/module README content for the API reference sections
- `{{CONVENTION}}` — Generated DOCUMENTATION-CONVENTION.md content
- `{{ENV_VARS}}` — All environment variables
- `{{ARCHITECTURE_DIAGRAM}}` — Mermaid diagram

## Output Format

A complete AGENTS.md file with these mandatory sections (order matters):

```markdown
# AGENTS.md — {{PROJECT_NAME}}

> **Purpose:** Technical reference for AI agents and developers working on this {{PROJECT_TYPE}}.

---

## Quick Reference

| Task | Command |
| ---- | ------- |

---

## Feature-to-File Index

> **Context budget rule:** ...
> | If the user asks about... | Read these files | May also need |

### Cross-Cutting Concerns

| If the request touches... | Also check... | Why |

---

## Package Capability Matrix

| Package | Import Path | Key Exports | Documented |

---

## Project Overview

### Architecture

### Structure (directory tree)

## Architecture & Data Flow

### Dependency Graph

## Using Shared Packages (if monorepo)

## Development Setup

### Environment Variables

### Prerequisites

## Commands Reference

### Build & Run

### Testing

### Code Quality

## Code Style Guidelines

### Imports Order

### Naming Conventions

### Dependency Injection (if applicable)

## Module Patterns (if applicable)

## Error Handling Patterns

| Component | Strategy | Check Pattern | Throw Pattern |

## External Services

(one subsection per service: database, http, queue, email, ai, browser, etc.)

## Creating New Modules/Packages

(step-by-step with code examples)

## Extracting Packages (if monorepo)

## Package Setup Wizard (if exists)

## Troubleshooting

## Deployment Checklist

## Key Files

| File | Purpose |
| ---- | ------- |
```

## Prompt

````
You are generating the AGENTS.md master index for a {{PROJECT_TYPE}} project.
AGENTS.md is the single most important documentation file for AI agents. It
must be comprehensive, well-indexed, and surgically navigable.

PROJECT CONTEXT:
- Name: {{PROJECT_NAME}}
- Type: {{PROJECT_TYPE}}
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Source directory: {{SRC_DIR}}
- Application directory: {{APP_DIR}}

AUDIT CONTEXT:
- Health score: {{HEALTH_SCORE}}/10
- Existing AGENTS.md quality: {{AGENTS_QUALITY}}
- Missing indices: {{MISSING_INDICES}}

GENERATED CONTENT (from Phase 3 sub-steps):
- Feature-to-file rows: {{FEATURE_ROWS}}
- Capability matrix rows: {{PACKAGE_ROWS}}
- Cross-cutting rows: {{CROSS_CUTTING_ROWS}}
- Error handling rows: {{ERROR_ROWS}}
- Package README summaries: {{PACKAGE_SUMMARIES}}

YOUR TASK:
Build a complete AGENTS.md. This is the most complex generation in DocForge.
Follow these rules in EXACT order:

---

## SECTION 1: Header + Quick Reference

- Title: `# AGENTS.md — {{PROJECT_NAME}}`
- Purpose line: one sentence explaining this is for AI agents and developers
- Quick Reference table: build from package.json scripts / Makefile
  - Dev server, build, lint, test (unit), test (single file), test (e2e), format, prod start
  - If a setup wizard exists, add its command(s)
  - Use the ACTUAL commands from {{PKG_MANAGER}}

---

## SECTION 2: Feature-to-File Index

- Insert the context budget rule FIRST (from feature-to-file.spec.md) — the LLM
  must see this before scrolling into rows
- Insert {{FEATURE_ROWS}} into the table
- Add the "Crear un NUEVO módulo" row if the project has module patterns
- Sort rows by likelihood of being asked (auth/top-level features first)

### Sub-section 2a: Cross-Cutting Concerns

- Insert the "STOP and ask" warning FIRST
- Insert {{CROSS_CUTTING_ROWS}} into the table
- Add the mandatory Rule block below the table

---

## SECTION 3: Package Capability Matrix

- Insert {{PACKAGE_ROWS}} into the table
- Add a Tip below: "Use Ctrl+F with the import path to jump to §N API reference"
- Sort rows alphabetically or by architectural layer

---

## SECTION 4: Project Overview

- Architecture summary: framework, database, task queue, browser, API docs
- Directory tree: show top 3 levels of {{SRC_DIR}} and {{APP_DIR}}
- Use ASCII tree format (```text code block), not Mermaid

---

## SECTION 5: Architecture & Data Flow

- Dependency graph: show which packages depend on which
- Use a simple indented tree format:
````

apps/{{APP_NAME}}
├── @common/database —— description
├── @common/queue —— description
└── modules/
├── feature-a/ —— description
└── feature-b/ —— description

````
- Identify "Standalone Packages" — packages with no internal dependencies
that can be extracted independently. List them.

---

## SECTION 6: Using Shared Packages

- Show import examples using the ACTUAL import paths from capability matrix
- Use ```typescript (or language-appropriate) code blocks
- One import per line for clarity

---

## SECTION 7: Development Setup

### Environment Variables
- Build a COMPLETE .env table with every variable
- Group by component: Database, Auth, Email, Queue, Browser, AI, etc.
- Include: variable name, example/default value, description
- Format as code block with comments, not a markdown table (env vars are long)

### Prerequisites
- Runtime version (Node.js 20+, Python 3.10+, etc.)
- Database running or connection string
- Any other service prerequisites

---

## SECTION 8: Commands Reference

Three sub-sections:
### Build & Run — build, start, start:dev, start:prod
### Testing — test, test:watch, test:cov, test:e2e, single file
### Code Quality — lint, format, typecheck

Each command gets a one-line description using backtick code formatting.

---

## SECTION 9: Code Style Guidelines

Write actual rules the LLM should follow when generating code:

### Imports Order — show the convention with categories
### Naming Conventions — table: what | convention | example
### Dependency Injection — show CORRECT constructor injection pattern
(or language-appropriate DI pattern)
### Module Organization — show CORRECT @Module() decorator structure
(or language-appropriate module pattern)

---

## SECTION 10: Module Patterns (if applicable)

Document the module directory structures used in this project:
- Pattern A: Flat (single-service CRUD) — show tree + when to use
- Pattern B: Services/ (multi-service pipeline) — show tree + when to use

Include cross-references to Error Handling and Creating New Modules.

---

## SECTION 11: Error Handling Patterns

- Insert the heading: "Each {{COMPONENT_TYPE}} uses a different error strategy. Know which to catch."
- Insert {{ERROR_ROWS}} into the table
- Add the Rule of Thumb below
- Add cross-references to Architecture and External Services

---

## SECTION 12: External Services

One subsection per detected external service. For EACH service:
- Brief description (1-2 lines)
- Basic usage code example (import + minimal use)
- API methods table (if service has multiple public methods)
- Environment variables table (if applicable)
- Error patterns specific to this service
- Add `> **Related:**` cross-reference block at the end

If a service has SUB-MODULES (e.g., auth has two-factor, passkeys), document
them as sub-subsections with their own endpoints, services, and env vars.

---

## SECTION 13: Creating New Modules/Packages

Step-by-step guide (5 steps minimum) with CODE EXAMPLES:
1. Create directory structure (show tree)
2. Define Schema/Model (show {{LANGUAGE}} code)
3. Create Repository, Service, Controller (show each)
4. Register in Module (show {{FRAMEWORK}} code)
5. Import in AppModule (show {{FRAMEWORK}} code)

---

## SECTION 14: Extracting Packages (if monorepo)

Explain how to extract a package for reuse:
1. Copy folder
2. Configure paths
3. Install dependencies
4. Import in new project

---

## SECTION 15: Package Setup Wizard (if exists)

Document the setup wizard commands and options. Link to setup/ directory.

---

## SECTION 16: Troubleshooting

3-5 common issues with solutions:
- Port already in use → command to kill process
- Database connection failed → test command
- Browser/webdriver not found → install command
- Permission denied → chmod command

---

## SECTION 17: Deployment Checklist

Checklist of things to verify before deploying:
- [ ] Environment variables configured
- [ ] Database connection string set
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Tests pass
- [ ] API docs accessible
- [ ] Health check endpoint works
- [ ] Docker image builds

---

## SECTION 18: Key Files

Table mapping important files to their purpose:
| File | Purpose |
|------|---------|

Include: main config files, entry points, AGENTS.md, README.md, BOILERPLATE.md (if exists)

---

## GLOBAL RULES:

1. CROSS-REFERENCES: After every major section (before the `---` separator),
 add a `> **Related:**` block with links to other sections. Use anchor links
 with the exact heading text (lowercase, dashes for spaces).

2. CONSISTENCY: Use backtick code formatting for ALL class names, function names,
 file paths, env var names, and commands. Use ```language blocks for multi-line code.

3. PRESERVE: If an AGENTS.md already exists, preserve any content rated "Good" or
 "Excellent" in the audit. Merge new sections around preserved content.

4. LANGUAGE: If the project team communicates in a non-English language, mix keywords
 in the feature-to-file index (e.g., "Login / registro / JWT" for a Spanish team).
 Keep ALL structural headings and explanations in English.

5. NO DUPLICATION: The AGENTS.md references package READMEs for details. It does NOT
 duplicate their full API documentation. Each service section in AGENTS.md is a
 summary with a pointer to the full README.

6. SELF-VALIDATE: After writing, verify:
 - All 18 sections present (or marked N/A for {{PROJECT_TYPE}})
 - Feature-to-file index has 10+ rows (monorepo) or 5+ rows (single app)
 - Capability matrix has all packages
 - Error handling table covers every package with a non-standard strategy
 - Cross-references use correct anchor links
 - No broken links to files that don't exist

OUTPUT the complete AGENTS.md. Do NOT wrap in markdown code fences.
````

## Usage Context

- **Phase**: Phase 3 (Generate) — step 2 of document generation order
- **Trigger**: After CONVENTION.md is generated, before package READMEs
- **Depends on**: Phase 1 audit, Phase 2 blueprint, Phase 0 hydration, all 4 index specs, CONVENTION.md
- **Feeds into**: Phase 4 validation — AGENTS.md is the heaviest-weighted file in the rubric
- **Re-run frequency**: When packages are added/removed, when error strategies change, when cross-cutting dependencies change

## Real Example from nestJs-boilerplate

This prompt was applied to the NestJS 11 monorepo AGENTS.md:

**What existed before**: A ~400 line AGENTS.md with Quick Reference, Code Style Guidelines, External Services per package, and a Module Creation guide. No indices, no error handling table, no cross-cutting concerns, no module patterns.

**What the prompt produced**: A 1393-line AGENTS.md — the largest single doc in the project.

Key transformations:

1. **Feature-to-File Index (19 rows)**: Mapped Spanish+English keywords to exact file paths. Auth was split into 5 rows (login, magic links, 2FA, passkeys, JWT) instead of one. The "Crear un NUEVO módulo" row pointed to AGENTS.md sections, not code files — a meta-reference pattern.

2. **Cross-Cutting Concerns (9 rows)**: Captured hidden dependencies like `AI → documents → dynamic-schema` pipeline coupling. Auth had 3 rows for resend, two-factor, and passkeys.

3. **Capability Matrix (12 rows)**: Mixed `@common/*` scoped packages with app-local modules (`dynamic-schema`, `usuarios`). Used `...` truncation for large APIs.

4. **Error Handling Table (6 rows)**: Documented 6 different error strategies — AI returns success booleans, documents throw JSON-encoded codes, HTTP uses OOP hierarchy, database auto-retries, auth throws framework exceptions, dynamic-schema returns error code strings.

5. **Module Patterns (2 patterns)**: Pattern A (flat CRUD) and Pattern B (services/ pipeline) with directory trees and use-case descriptions — this came from analyzing the existing `usuarios/` and `dynamic-schema/` directories.

6. **Cross-references everywhere**: Every major section ended with a `> **Related:** [§N Section Name](#n-section-name)` block. The cross-references form a navigable web — the error handling table links to architecture and external services; the capability matrix links to the API reference sections.

7. **Package Setup Wizard (Section 11)**: Documented the `setup/setup.sh` wizard with available packages table — preserving a tool that was already built.

The AGENTS.md generation took 4 iterations: (1) rough structure, (2) index tables filled, (3) cross-references added, (4) renumbering after new sections shifted heading levels. The result passed validation at 8.4/10 in Phase 4.
