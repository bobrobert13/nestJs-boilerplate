# Phase 2: Documentation Blueprint

> **Purpose:** Given the audit results AND the detected project type, determine exactly
> what documentation should exist, in what order, and using which templates.

---

## Project Type Detection

Before the blueprint can be drawn, you must classify the project. Run these
detection heuristics in order — the first match wins.

### Detection Algorithm

```
1. Check for monorepo configuration → MONOREPO
2. Check for framework markers → classify app type
3. Check for library markers → LIBRARY
4. Check for CLI markers → CLI
5. Check for static site markers → STATIC_SITE
6. Check for mobile markers → MOBILE
7. Fallback → SINGLE_APP
```

### Detection Heuristics

| Type            | Markers                                                                                                                                             | Examples                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Monorepo**    | Workspaces in `{{ROOT}}/package.json`, `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json`, multiple `{{PKG_DIR}}/` directories, `go.work` | Nx, Turborepo, Lerna, Go workspaces |
| **Single App**  | Single `{{APP_DIR}}/` or `src/` dir, no workspace config, one entry point                                                                           | Express, Flask, Rails, Spring Boot  |
| **Library**     | Exports API surface in `index.ts`/`__init__.py`/`lib.go`, no server entry point, has `exports` field in `package.json`                              | Lodash, Requests, Axios             |
| **CLI Tool**    | `bin` field in `package.json`, `console_scripts` in `setup.py`, `main.go` with `cobra.Command` or `click`                                           | ESLint, `gh` CLI, Cargo             |
| **Static Site** | `next.config.js`, `astro.config.mjs`, `gatsby-config.js`, `_config.yml` (Jekyll), `hugo.toml`                                                       | Next.js, Astro, Hugo                |
| **Mobile**      | `app.json` (React Native), `ios/` + `android/` dirs, Flutter `pubspec.yaml` with `flutter:` key                                                     | React Native, Flutter               |

### Monorepo Sub-classification

If the project is a monorepo, detect the monorepo tooling:

| Tool            | Detection                               |
| --------------- | --------------------------------------- |
| Nx              | `nx.json` present                       |
| Turborepo       | `turbo.json` present                    |
| Lerna           | `lerna.json` present                    |
| Go Workspace    | `go.work` present                       |
| Cargo Workspace | `Cargo.toml` with `[workspace]`         |
| Yarn Workspaces | `package.json` with `workspaces` field  |
| pnpm Workspaces | `pnpm-workspace.yaml`                   |
| NestJS Monorepo | `nest-cli.json` with `"monorepo": true` |

---

## Document Decision Matrix

This matrix maps every documentation artifact to every project type with a
Required / Recommended / Optional / N/A judgment.

| Document                    | Monorepo     | Single App   | Library     | CLI         | Static Site | Mobile       |
| --------------------------- | ------------ | ------------ | ----------- | ----------- | ----------- | ------------ |
| Root `README.md`            | Required     | Required     | Required    | Required    | Required    | Required     |
| `AGENTS.md` (AI index)      | Required     | Recommended  | Optional    | Optional    | Optional    | Optional     |
| `CONVENTION.md`             | Recommended  | Recommended  | Optional    | Optional    | Optional    | Optional     |
| `CHANGELOG.md`              | Required     | Required     | Required    | Required    | Required    | Required     |
| `CONTRIBUTING.md`           | Required     | Recommended  | Required    | Recommended | Recommended | Recommended  |
| `SECURITY.md`               | Required\*   | Required\*   | Required\*  | Optional    | Optional    | Optional     |
| `CODE_OF_CONDUCT.md`        | Required\*   | Required\*   | Required\*  | Optional    | Optional    | Optional     |
| `LICENSE`                   | Required     | Required     | Required    | Required    | Required    | Required     |
| Package READMEs             | Required     | N/A          | N/A         | N/A         | N/A         | N/A          |
| Module READMEs              | N/A          | Recommended  | N/A         | N/A         | Optional    | Recommended  |
| `.env.example`              | Required     | Required     | N/A         | Required    | Required    | Required     |
| API Docs (Swagger/OpenAPI)  | Required\*\* | Required\*\* | Required    | N/A         | N/A         | Required\*\* |
| Architecture docs (ADRs)    | Recommended  | Optional     | Recommended | Optional    | Optional    | Optional     |
| Changelog (per package)     | Recommended  | N/A          | Recommended | N/A         | N/A         | N/A          |
| Package capability matrix   | Recommended  | N/A          | N/A         | N/A         | N/A         | N/A          |
| Feature-to-file index       | Recommended  | Optional     | N/A         | Optional    | Optional    | Optional     |
| Error handling strategy doc | Recommended  | Optional     | Optional    | Optional    | Optional    | Optional     |
| Deployment guide            | Recommended  | Recommended  | N/A         | Recommended | Recommended | Recommended  |

> **\* Required\*:** Required only if the repository is public/open-source.
> For private/internal repos, these become Optional.
>
> **\*\* Required\*\*:** Required only if the project has an API (REST, GraphQL, gRPC).

### Legend

| Tag             | Meaning                                |
| --------------- | -------------------------------------- |
| **Required**    | Must exist. CI should fail if missing. |
| **Recommended** | Should exist. CI warns if missing.     |
| **Optional**    | Nice to have. No CI enforcement.       |
| **N/A**         | Doesn't apply to this project type.    |

---

## Priority Ordering

Create documents in this order. The first document (CONVENTION.md) establishes
the standard that ALL subsequent documents must follow. Skipping it means
inconsistent docs that must be reworked later.

### Phase 2a: Convention First

```
1. CONVENTION.md           ← Establishes the standard. Write this FIRST.
   (or DOCUMENTATION-CONVENTION.md)
```

### Phase 2b: Master Index

```
2. AGENTS.md               ← Master index for AI agents (depends on convention).
   (or CLAUDE.md, COPILOT.md)
```

### Phase 2c: Component Documentation

```
3. Package/Module READMEs  ← Per-package or per-module. One per component.
   (under {{PKG_DIR}}/*/README.md)
```

### Phase 2d: Root Documentation

```
4. Root README.md          ← Overview. Written LAST because it references sub-docs.
5. CHANGELOG.md            ← From git history (or build from scratch).
```

### Phase 2e: Governance

```
6. CONTRIBUTING.md         ← How to contribute.
7. SECURITY.md             ← Vulnerability reporting.
8. CODE_OF_CONDUCT.md      ← Community standards.
9. LICENSE                 ← Legal.
```

### Phase 2f: Optional Enhancements

```
10. Architecture docs (docs/architecture.md or ADRs)  ← Design decisions.
11. Deployment guide                                   ← If not in README.
12. .env.example                                       ← If not yet created.
```

### Rationale

The ordering is NOT arbitrary. It reflects real dependencies:

- CONVENTION first because every other doc must follow it. If a convention says
  "all READMEs must have an API table," the generator can enforce that rule for
  every subsequent README.
- AGENTS second because it's the master index that points to everything else.
  Once AGENTS exists, it acts as the "source of truth" for what documentation
  exists where.
- Package READMEs before root README because the root README should summarize
  what's in each package README.
- Governance last because it's formulaic (most projects copy-paste from templates)
  and doesn't depend on project-specific knowledge.

---

## Section Requirements per Document

This table defines the minimum sections each document type MUST contain.
Use it as a checklist during Phase 3 (Generate). Each cell is YES (required),
NO (not required), or IF-NEEDED (contextual).

### Root README.md

| Section                                 | Monorepo  | Single App | Library | CLI       | Static Site | Mobile    |
| --------------------------------------- | --------- | ---------- | ------- | --------- | ----------- | --------- |
| Title + one-liner                       | YES       | YES        | YES     | YES       | YES         | YES       |
| Quick Start (install + run)             | YES       | YES        | YES     | YES       | YES         | YES       |
| Stack / Dependencies table              | YES       | YES        | YES     | YES       | YES         | YES       |
| Documentation index (links to all docs) | YES       | YES        | YES     | IF-NEEDED | IF-NEEDED   | YES       |
| Package / Module overview table         | YES       | NO         | NO      | NO        | NO          | NO        |
| Environment variables                   | YES       | YES        | NO      | YES       | YES         | YES       |
| API / Demo link                         | YES       | YES        | NO      | NO        | YES         | YES       |
| Deployment                              | IF-NEEDED | IF-NEEDED  | NO      | IF-NEEDED | YES         | IF-NEEDED |
| Contributing link                       | YES       | YES        | YES     | IF-NEEDED | IF-NEEDED   | YES       |
| License                                 | YES       | YES        | YES     | YES       | YES         | YES       |

### AGENTS.md (or equivalent)

| Section                                          | Monorepo | Single App | Library   | CLI       |
| ------------------------------------------------ | -------- | ---------- | --------- | --------- |
| Quick Reference table (commands → scripts)       | YES      | YES        | YES       | YES       |
| Feature-to-File index                            | YES      | YES        | NO        | IF-NEEDED |
| Capability Matrix (packages → imports → exports) | YES      | NO         | NO        | NO        |
| Cross-Cutting Concern warnings                   | YES      | IF-NEEDED  | NO        | NO        |
| Architecture / Data Flow diagram                 | YES      | YES        | IF-NEEDED | IF-NEEDED |
| Error Handling strategy table                    | YES      | YES        | IF-NEEDED | IF-NEEDED |
| External Services table                          | YES      | YES        | NO        | NO        |
| Creating New Modules guide                       | YES      | YES        | NO        | NO        |
| Code Style / Conventions                         | YES      | YES        | YES       | YES       |
| Testing commands                                 | YES      | YES        | YES       | YES       |

### Package/Module README.md

| Section                                  | Package (monorepo) | Module (single app) |
| ---------------------------------------- | ------------------ | ------------------- |
| Status tag (`<!-- name — status: X -->`) | YES                | YES                 |
| Title + one-liner                        | YES                | YES                 |
| Quick API Index / TOC table              | YES                | YES                 |
| Installation (import path)               | YES                | NO                  |
| Quick Start (minimal code)               | YES                | YES                 |
| Main API (methods table with signatures) | YES                | YES                 |
| Environment Variables table              | YES                | IF-NEEDED           |
| Configuration options                    | IF-NEEDED          | NO                  |
| Error Handling table                     | YES                | IF-NEEDED           |
| Cross-Cutting warnings                   | YES                | IF-NEEDED           |
| Common Issues / Troubleshooting          | YES                | IF-NEEDED           |
| Dependencies                             | YES                | NO                  |

### CHANGELOG.md

| Section                                                            | All Types |
| ------------------------------------------------------------------ | --------- |
| Keep a Changelog format (`## [version] - date`)                    | YES       |
| Added / Changed / Deprecated / Removed / Fixed / Security sections | YES       |
| Version links (GitHub compare URLs)                                | YES       |
| Unreleased section at top                                          | YES       |

### CONTRIBUTING.md

| Section                                  | All Types |
| ---------------------------------------- | --------- |
| Setup instructions (clone, install, run) | YES       |
| Branch naming convention                 | YES       |
| Commit message convention                | YES       |
| PR process (template, checks, review)    | YES       |
| Code style reference                     | YES       |
| Testing requirements                     | YES       |
| Documentation requirements               | YES       |

### SECURITY.md

| Section                            | All Types |
| ---------------------------------- | --------- |
| Supported versions table           | YES       |
| Reporting process (email, PGP key) | YES       |
| Disclosure policy (timeline)       | YES       |

---

## Template Mapping

When Phase 3 (Generate) runs, it uses these templates. If a template doesn't
exist, the LLM generates from the spec in `03-generate.md`.

| Document          | Template File                          | Fallback                                |
| ----------------- | -------------------------------------- | --------------------------------------- |
| Root `README.md`  | `templates/README.template.md`         | Spec in 03-generate.md § Root README    |
| `AGENTS.md`       | `templates/AGENTS.template.md`         | Spec in 03-generate.md § AGENTS.md      |
| Package README    | `templates/PACKAGE_README.template.md` | Spec in 03-generate.md § Package README |
| `CHANGELOG.md`    | `templates/CHANGELOG.template.md`      | Spec in 03-generate.md § CHANGELOG      |
| `CONTRIBUTING.md` | `templates/CONTRIBUTING.template.md`   | Spec in 03-generate.md § CONTRIBUTING   |
| `CONVENTION.md`   | `templates/CONVENTION.template.md`     | Spec in 03-generate.md § CONVENTION     |
| `SECURITY.md`     | `templates/SECURITY.template.md`       | Spec in 03-generate.md § SECURITY       |
| Architecture docs | `templates/ARCHITECTURE.template.md`   | Spec in 03-generate.md § Architecture   |

---

## Example from nestJs-boilerplate

> **Context:** NestJS 11 monorepo, `packages/` with 10 packages, `apps/nominas/` main app.

> ### Project Classification
>
> ```
> Detection chain:
> 1. MONOREPO → YES (nest-cli.json has "monorepo": true, 10 packages/ dirs)
>    Monorepo tool → NestJS (nest-cli.json)
>    Type → BACKEND_MONOREPO
> ```

> ### Blueprint Output (excerpt)
>
> | #   | Document                       | Status      | Priority | Template                      | Notes                                                           |
> | --- | ------------------------------ | ----------- | -------- | ----------------------------- | --------------------------------------------------------------- |
> | 1   | `DOCUMENTATION-CONVENTION.md`  | Exists ✅   | P0       | Will enhance                  | Already has IA-friendly convention; minor updates needed        |
> | 2   | `AGENTS.md`                    | Exists ✅   | P0       | Already applied               | 4 index modes, cross-cutting, error handling — excellent        |
> | 3   | `packages/*/README.md`         | 10/10 exist | P1       | `PACKAGE_README.template.md`  | `@common/auth` and `@common/inngest` need API table enhancement |
> | 4   | `BOILERPLATE.md` (human guide) | Exists ✅   | P1       | N/A                           | Spanish-language equivalent of AGENTS + tutorial                |
> | 5   | Root `README.md`               | Exists ✅   | P2       | Already applied               | Clean, has doc index and package table                          |
> | 6   | `CHANGELOG.md`                 | Exists ⚠️   | P2       | `CHANGELOG.template.md`       | Needs latest entries; format is correct                         |
> | 7   | `CONTRIBUTING.md`              | Exists ⚠️   | P3       | `CONTRIBUTING.template.md`    | Bare; needs PR process, commit convention                       |
> | 8   | `LICENSE`                      | Missing ❌  | P3       | Create                        | Critical gap for public repo                                    |
> | 9   | `SECURITY.md`                  | Missing ❌  | P3       | `SECURITY.template.md`        | Critical gap for public repo                                    |
> | 10  | `CODE_OF_CONDUCT.md`           | Missing ❌  | P3       | `CODE_OF_CONDUCT.template.md` | Required for open-source                                        |
> | 11  | Architecture ADRs              | Missing ❌  | P4       | `ARCHITECTURE.template.md`    | Not urgent; AGENTS.md has architecture section                  |

> ### Template Mapping Applied
>
> The nestJs-boilerplate's `DOCUMENTATION-CONVENTION.md` served as the CONVENTION template.
> The `AGENTS.md` became the master template for all package READMEs — every package README
> follows the same pattern: status tag, Quick API Index, sections, cross-cutting, error handling.
>
> The blueprint showed that 7 of 10 packages had Excellent READMEs using this pattern,
> so the generation phase only needed to enhance the remaining 3 (`auth`, `inngest`, `common`).
