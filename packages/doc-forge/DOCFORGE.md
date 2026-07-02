# DocForge — IA-Friendly Documentation Framework

> **For the LLM reading this:** You are about to document a project. Read this file
> top-to-bottom ONCE. It contains the complete workflow, decision framework, and
> references to all templates and prompts you need. Do NOT skip Phase 0.

---

## Quick Start (for LLMs)

```
1. Read this file (you are here)
2. Run Phase 0: Hydration — detect project context
3. Run Phase 1: Audit — score current documentation health
4. Run Phase 2: Blueprint — determine what docs are needed
5. Run Phase 3: Generate — produce documentation using templates + prompts
6. Run Phase 4: Validate — score the result against the rubric
7. Run Phase 5: Maintain — wire auto-sync mechanisms (CI, hooks, checklists)
```

---

## Phase 0: Hydration (MANDATORY — do NOT skip)

When placed in a new project, you MUST detect the environment before doing ANYTHING else.
DocForge has no hardcoded paths — all references are derived from the project you are IN.

### Step 0.1: Detect Project Type

Scan the root directory and answer:

| Question        | How to detect                                            | Example                                            |
| --------------- | -------------------------------------------------------- | -------------------------------------------------- |
| Language        | File extensions in `src/` or root                        | `.ts`, `.py`, `.go`, `.rs`                         |
| Framework       | `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml` | NestJS, FastAPI, Gin, Actix                        |
| Package manager | Lock files                                               | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
| Monorepo?       | Workspaces config, multiple `packages/` dirs             | Yes/No                                             |
| Test framework  | Config files                                             | Jest, pytest, Go testing                           |
| CI/CD           | `.github/workflows/`, `.gitlab-ci.yml`                   | Yes/No                                             |
| Git remote      | `git remote -v`                                          | GitHub, GitLab, none                               |

### Step 0.2: Detect Existing Documentation

Find ALL documentation files:

```
Search for: README.md, CONTRIBUTING.md, CHANGELOG.md, CODE_OF_CONDUCT.md,
            SECURITY.md, LICENSE, docs/**, *.md in root, package READMEs
```

### Step 0.3: Build the Hydration Map

Create a mental (or written) map:

```
PROJECT_TYPE   = monorepo-nestjs
SRC_DIR        = packages/
APP_DIR        = apps/
PKG_MANAGER    = npm
LINT_CMD       = npm run lint
TEST_CMD       = npm run test
BUILD_CMD      = npm run build
CI_SYSTEM      = github-actions
GIT_REMOTE     = github.com/user/repo
LANGUAGE       = typescript
FRAMEWORK      = nestjs
```

**CRITICAL**: Every time a template or prompt uses `{{PLACEHOLDER}}`, replace it
with the detected value from THIS map. Never hardcode paths from the example project.

---

## Phase 1: Audit

> **File:** `phases/01-audit.md`
>
> **Prompt:** `prompts/audit-project.prompt.md`

### What it does

Performs a complete documentation health check of the project:

1. Enumerates every documentation file with line count and quality assessment
2. Scores 5 dimensions (weighted): Coverage 25%, Content Quality 25%, JSDoc/Docstrings 20%, Governance 15%, Navigability 15%
3. Flags missing critical documents (LICENSE, SECURITY, CONTRIBUTING)
4. Detects stale/outdated docs
5. Produces a 0-10 health score with detailed reasoning

### Output

A structured report containing:

- File inventory table (path, lines, quality rating, issues)
- Dimension scores with evidence
- Critical/High/Medium/Low prioritized gap list
- Overall health score (0-10)

### Decision Gate

| Score | Action                                                     |
| ----- | ---------------------------------------------------------- |
| 0-3   | Full rebuild — start from blueprint                        |
| 4-6   | Targeted improvement — fix critical gaps, enhance existing |
| 7-8   | Polish — add missing governance, improve indexes           |
| 9-10  | Maintain — wire auto-sync only                             |

---

## Phase 2: Blueprint

> **File:** `phases/02-blueprint.md`

### What it does

Given the audit results AND the detected project type, determines exactly what
documentation should exist.

### Decision Matrix

| Document                    | Monorepo           | Single App        | Library           | CLI Tool    |
| --------------------------- | ------------------ | ----------------- | ----------------- | ----------- |
| README.md                   | Required           | Required          | Required          | Required    |
| AGENTS.md                   | Required           | Recommended       | Optional          | Optional    |
| CHANGELOG.md                | Required           | Required          | Required          | Required    |
| CONTRIBUTING.md             | Required           | Recommended       | Required          | Recommended |
| DOCUMENTATION-CONVENTION.md | Recommended        | Recommended       | Optional          | Optional    |
| Package READMEs             | Required (per pkg) | N/A               | N/A               | N/A         |
| Module READMEs              | N/A                | Recommended       | N/A               | Optional    |
| SECURITY.md                 | Required (public)  | Required (public) | Required (public) | Optional    |
| CODE_OF_CONDUCT.md          | Required (public)  | Required (public) | Required (public) | Optional    |
| LICENSE                     | Required           | Required          | Required          | Required    |
| ADRs (docs/adr/)            | Recommended        | Optional          | Recommended       | Optional    |
| API Docs (Swagger/OpenAPI)  | Required (API)     | Required (API)    | Required          | N/A         |
| .env.example                | Required           | Required          | Required          | Required    |

### Output

A blueprint document specifying:

- Which documents to create/modify/delete
- Priority order
- Template to use for each
- Expected sections for each document

---

## Phase 3: Generate

> **File:** `phases/03-generate.md`
>
> **Templates:** `templates/`
>
> **Prompts:** `prompts/`

### Generation Rules

1. **NEVER generate from scratch** — always audit first, then adapt templates
2. **Use placeholders** — every template uses `{{DETECTED_VALUE}}` from Phase 0
3. **Preserve existing content** — if a document exists, merge improvements, don't replace
4. **Index modes** — apply appropriate index strategies (see `indices/`)
5. **Status tags** — every generated README gets `<!-- name — status: X -->`

### Document Generation Order

1. `CONVENTION.md` — establish the standard FIRST
2. `AGENTS.md` — master index (depends on convention)
3. Package/Module READMEs — per component
4. `README.md` — root overview (last, after all sub-docs exist)
5. `CHANGELOG.md` — from git history
6. Governance: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`

### Index Mode Selection

| Index Mode        | File                                | Apply When                                |
| ----------------- | ----------------------------------- | ----------------------------------------- |
| Feature-to-File   | `indices/feature-to-file.spec.md`   | Large monorepo, legacy code, multi-module |
| Capability Matrix | `indices/capability-matrix.spec.md` | Monorepo with extractable packages        |
| Cross-Cutting     | `indices/cross-cutting.spec.md`     | Hidden dependencies, multi-service        |
| Error Handling    | `indices/error-handling.spec.md`    | Multiple error strategies per component   |

---

## Phase 4: Validate

> **File:** `phases/04-validate.md`

### Rubric (0-10 Scale)

| Dimension           | Weight | Max Score | Check                                             |
| ------------------- | ------ | --------- | ------------------------------------------------- |
| Structural Coverage | 25%    | 2.5       | All expected docs exist                           |
| Content Quality     | 25%    | 2.5       | API tables, examples, env vars in READMEs         |
| JSDoc/Docstrings    | 20%    | 2.0       | All public exports documented                     |
| Governance          | 15%    | 1.5       | LICENSE, SECURITY, CODE_OF_CONDUCT, CONTRIBUTING  |
| Navigability        | 15%    | 1.5       | Feature-to-file index, cross-references, diagrams |

### Pass Threshold

- **≥ 7.0**: Ready for production
- **≥ 5.0**: Adequate for internal use
- **< 5.0**: Needs work — re-run generation

---

## Phase 5: Maintain

> **File:** `phases/05-maintain.md`

### The Auto-Sync Problem

Documentation rots because nothing forces it to stay current. DocForge solves this with:

1. **CI/CD validation** — GitHub Actions (or equivalent) that block merges if docs are stale
2. **Pre-commit hooks** — husky/lint-staged validate docs before commit
3. **PR reminders** — automated comments when source changes lack doc updates
4. **Status tags** — machine-checkable `<!-- status: -->` markers
5. **Trigger mapping** — what code change requires what doc update

### Auto-Sync Triggers

| Code Change            | Doc Update Required                           |
| ---------------------- | --------------------------------------------- |
| New package/module     | README.md + JSDoc + AGENTS.md index           |
| New public method      | JSDoc on method                               |
| New env var            | README.md + .env.example                      |
| New endpoint           | Swagger/OpenAPI decorators + README API table |
| Breaking change        | CHANGELOG.md                                  |
| New dependency         | README.md dependencies section                |
| Removed/renamed export | Update all cross-references                   |

### CI Templates Included

This framework ships with GitHub Actions templates (adaptable to GitLab CI, CircleCI, etc.):

- `.github/workflows/doc-check.yml` — 6-job validation pipeline
- `.github/workflows/changelog-reminder.yml` — PR comment bot

**To use**: copy the template from `phases/05-maintain.md` into `.github/workflows/`,
replace `{{PROJECT_PATHS}}` with detected paths from Phase 0.

---

## Framework File Map

```
doc-forge/
├── DOCFORGE.md                      ← YOU ARE HERE. Start here.
│
├── phases/
│   ├── 01-audit.md                  ← How to audit a project
│   ├── 02-blueprint.md              ← What docs a project needs
│   ├── 03-generate.md               ← How to generate each doc type
│   ├── 04-validate.md               ← Scoring rubric
│   └── 05-maintain.md               ← Auto-sync with CI/CD
│
├── templates/
│   ├── README.template.md           ← Root project README
│   ├── AGENTS.template.md           ← Master index for AI agents
│   ├── PACKAGE_README.template.md   ← Per-package/module README
│   ├── CHANGELOG.template.md        ← Keep a Changelog format
│   ├── CONTRIBUTING.template.md     ← Contribution guide
│   ├── CONVENTION.template.md       ← Documentation standard
│   ├── SECURITY.template.md         ← Vulnerability reporting
│   └── ARCHITECTURE.template.md     ← ADRs / design decisions
│
├── indices/
│   ├── feature-to-file.spec.md      ← "If you ask X, read files Y"
│   ├── capability-matrix.spec.md    ← Package → imports → exports
│   ├── cross-cutting.spec.md        ← "If you touch A, check B"
│   └── error-handling.spec.md       ← Error strategy per component
│
├── prompts/
│   ├── audit-project.prompt.md      ← Full project audit
│   ├── generate-readme.prompt.md    ← Root README
│   ├── generate-agents.prompt.md    ← AGENTS.md master index
│   ├── generate-package-readme.prompt.md ← Per-component README
│   ├── generate-changelog.prompt.md ← From git history
│   ├── generate-jsdoc.prompt.md     ← Bulk JSDoc/docstring generation
│   ├── generate-convention.prompt.md ← Doc convention standard
│   └── maintain-sync.prompt.md      ← Keep docs in sync with code
│
└── examples/
    └── nestjs-boilerplate/
        ├── audit-output.md           ← Real audit report
        ├── convention-applied.md     ← DOCUMENTATION-CONVENTION in action
        ├── indices-generated.md      ← All 4 index modes applied
        └── workflow-results.md       ← CI output example
```

---

## Core Principles

1. **Audit First, Write Second** — never generate before understanding the current state
2. **Convention Over Configuration** — one `CONVENTION.md` drives all decisions
3. **Machine-Checkable** — every rule is verifiable by CI, not just human review
4. **Self-Contained** — zero external dependencies; works in any project when copied in
5. **Hydrate, Don't Hardcode** — detect paths at runtime, never reference example projects
6. **Index Everything** — multiple navigation strategies for humans AND LLMs
7. **Auto-Sync or Die** — documentation without CI enforcement is wishful thinking

---

## Real-World Example

> **Source project:** `nestJs-boilerplate` — NestJS 11 monorepo with 10 packages,
> MongoDB, Inngest, Playwright. TypeScript, npm, GitHub Actions.
>
> See `examples/nestjs-boilerplate/` for the audit output, convention application,
> and index generation applied to this real project. These are illustrations —
> your project will have different paths, different languages, different needs.
>
> Use them to understand the PATTERN, not to copy paths.
