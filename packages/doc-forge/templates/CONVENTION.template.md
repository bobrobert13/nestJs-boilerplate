<!-- Template: doc-forge/templates/CONVENTION.template.md -->
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

# Documentation Convention — {{PROJECT_NAME}}

This document defines the documentation standard for `{{PROJECT_NAME}}`.
All contributors and AI agents MUST follow these rules. Every rule is
machine-checkable by CI.

## 1. Documentation Standard Definition

### Core Principles

1. **Audit First, Write Second** — never generate docs before understanding the current state
2. **Convention Over Configuration** — this document drives ALL documentation decisions
3. **Machine-Checkable** — every rule is verifiable by `{{DOC_CHECK_CMD}}`, not just human review
4. **Audience-Specific** — documents are written for their PRIMARY audience (human devs, AI agents, users)
5. **Single Source of Truth** — information lives in ONE place; cross-references, never duplication
6. **Auto-Sync or Die** — documentation without CI enforcement is wishful thinking

### Documentation Tier System

| Tier           | Audience         | Documents                             | Language               | Update Trigger         |
| -------------- | ---------------- | ------------------------------------- | ---------------------- | ---------------------- |
| **Reference**  | AI Agents        | AGENTS.md, Package READMEs            | English                | Every source change    |
| **Tutorial**   | Human developers | README.md, BOILERPLATE.md, docs/      | {{HUMAN_DOC_LANGUAGE}} | Major feature/release  |
| **Governance** | Community        | CONTRIBUTING.md, SECURITY.md, LICENSE | English                | Policy changes         |
| **Decision**   | Team             | ADRs (docs/adr/)                      | English                | Architecture decisions |
| **API**        | Consumers        | Swagger/OpenAPI                       | English                | Every endpoint change  |

---

## 2. Status Tags

Every generated document MUST start with an HTML status comment:

```html
<!-- {{DOCUMENT_SCOPE}} — status: {{STATUS_VALUE}} -->
```

### Status Values

| Status                   | Meaning                                        | Validation                               |
| ------------------------ | ---------------------------------------------- | ---------------------------------------- |
| `Draft`                  | Work in progress, not reviewed                 | Exists check only                        |
| `Published`              | Reviewed and approved                          | All sections present                     |
| `Stale`                  | Not updated for {{STALE_THRESHOLD_DAYS}}+ days | Flagged by CI cron                       |
| `Auto-Synced`            | Maintained by CI automation                    | Verified by CI pipeline                  |
| `Validated {{SCORE}}/10` | Passed doc-forge Phase 4 audit                 | Contains score from `{{VALIDATION_CMD}}` |
| `Minimal`                | Bare minimum, intentional                      | Critical sections only                   |
| `Full`                   | Complete reference documentation               | All applicable sections                  |

### Scope Values

| Scope                            | Applies To                                              |
| -------------------------------- | ------------------------------------------------------- |
| `{{PROJECT_NAME}}`               | Project root (`README.md`, `AGENTS.md`, `CHANGELOG.md`) |
| `{{PACKAGE_NAME_PREFIX}}/<name>` | Individual packages/modules                             |
| `docs/`                          | Documentation directory files                           |

---

## 3. JSDoc / Docstring Requirements

### What MUST Have JSDoc

| Element             | Required             | Format                        |
| ------------------- | -------------------- | ----------------------------- |
| Public classes      | Yes                  | `{{JSDOC_CLASS_EXAMPLE}}`     |
| Public methods      | Yes                  | `{{JSDOC_METHOD_EXAMPLE}}`    |
| Public functions    | Yes                  | `{{JSDOC_FUNCTION_EXAMPLE}}`  |
| Exported interfaces | Yes                  | `{{JSDOC_INTERFACE_EXAMPLE}}` |
| Exported types      | Yes                  | `{{JSDOC_TYPE_EXAMPLE}}`      |
| Exported constants  | Yes (if non-trivial) | `{{JSDOC_CONST_EXAMPLE}}`     |
| Parameters          | When non-obvious     | `@param` tag                  |
| Return values       | Always               | `@returns` tag                |
| Thrown errors       | Yes                  | `@throws` tag                 |

### JSDoc Template

````{{LANGUAGE}}
/**
 * {{BRIEF_DESCRIPTION}}
 *
 * {{DETAILED_DESCRIPTION_WITH_CONTEXT}}
 *
 * @param {{PARAM_NAME}} - {{PARAM_DESCRIPTION}}
 * @returns {{RETURN_DESCRIPTION}}
 * @throws {{ERROR_CLASS}} - {{ERROR_CONDITION}}
 *
 * @example
 * ```{{LANGUAGE}}
 * {{USAGE_EXAMPLE}}
 * ```
 */
````

### Exceptions

The following are exempt from JSDoc requirements:

{{JSDOC_EXEMPTIONS}}

---

## 4. Cross-Reference Rules

### Internal Cross-References

- Use relative paths: `[text](./path/to/file.md#anchor)`
- Use section numbers in AGENTS.md: `[text](#8-external-services)`
- Never use absolute paths or hardcoded repo URLs

### Reference Format by Document Type

| From            | To             | Format                                                               |
| --------------- | -------------- | -------------------------------------------------------------------- |
| AGENTS.md       | Package README | `See [@common/database](./packages/database/README.md#transactions)` |
| Package README  | AGENTS.md      | `See [AGENTS.md §8](../AGENTS.md#8-external-services)`               |
| README.md       | CHANGELOG.md   | `See [Changelog](./CHANGELOG.md)`                                    |
| CONTRIBUTING.md | CONVENTION.md  | `Per our [Documentation Convention](./CONVENTION.md)`                |
| Any             | ADR            | `See [ADR {{ADR_NUMBER}}](./docs/adr/{{ADR_PATTERN}})`               |

### Cross-Reference Map

```
{{CROSS_REFERENCE_MAP}}
```

---

## 5. Diagram Convention

All architecture diagrams use [Mermaid](https://mermaid.js.org/).

### Dependency Graph

```mermaid
{{DEPENDENCY_GRAPH_EXAMPLE}}
```

### Sequence Diagram

```mermaid
{{SEQUENCE_DIAGRAM_EXAMPLE}}
```

### Entity Relationship

```mermaid
{{ER_DIAGRAM_EXAMPLE}}
```

### Rules

- Use `LR` (left-to-right) direction for dependency graphs
- Use `TB` (top-to-bottom) direction for data flow and sequence diagrams
- Include a legend when graph has 10+ nodes
- Use consistent naming: class names match the codebase

---

## 6. Triggers for Documentation

When code changes, documentation MUST follow. These triggers define what
documentation updates are required for each type of code change.

### Mandatory Triggers

| Code Change                 | Doc Update Required                           | Validation Rule              |
| --------------------------- | --------------------------------------------- | ---------------------------- |
| New package/module          | README.md + JSDoc + AGENTS.md index           | `{{CHECK_PACKAGE_DOCS_CMD}}` |
| New public method           | JSDoc on method + method signature table      | `{{CHECK_JSDOC_CMD}}`        |
| New env var                 | README.md `.env` section + `.env.example`     | `{{CHECK_ENV_CMD}}`          |
| New endpoint                | Swagger/OpenAPI decorators + README API table | `{{CHECK_API_CMD}}`          |
| Breaking change             | CHANGELOG.md + migration guide                | `{{CHECK_CHANGELOG_CMD}}`    |
| New dependency              | README.md dependencies section                | `{{CHECK_DEPS_CMD}}`         |
| Removed/renamed export      | Update ALL cross-references                   | `{{CHECK_REFS_CMD}}`         |
| Config change               | README.md config section + `.env.example`     | `{{CHECK_CONFIG_CMD}}`       |
| New error handling strategy | AGENTS.md Error Handling table                | `{{CHECK_ERROR_TABLE_CMD}}`  |
| Architecture decision       | New ADR in `docs/adr/`                        | `{{CHECK_ADR_CMD}}`          |

### PR Gate

A PR that contains source changes without corresponding doc updates will:

1. Fail CI validation (`{{DOC_CHECK_JOB}}`)
2. Receive an automated comment listing missing docs
3. Be blocked from merge until resolved

---

## 7. Pre-Commit Checklist

Before committing documentation changes, verify:

- [ ] Status tag is correct and reflects current state
- [ ] All `{{PLACEHOLDER}}` values are replaced with actual data (no template syntax left)
- [ ] Cross-references resolve to valid targets (no broken links)
- [ ] Code examples are syntactically valid
- [ ] Environment variables table matches `.env.example`
- [ ] Mermaid diagrams render correctly
- [ ] No hardcoded paths from other projects or template examples
- [ ] JSDoc/docstrings are present on all new/modified public exports
- [ ] CHANGELOG.md updated for all user-facing changes

### Verification Commands

```bash
{{DOC_CHECK_CMD}}       # Full documentation validation
{{LINK_CHECK_CMD}}      # Check for broken links
{{JSDOC_CHECK_CMD}}    # Check JSDoc coverage
{{DIAGRAM_CHECK_CMD}}  # Validate Mermaid syntax
```

---

## 8. Package README Minimum Content

Every `packages/<name>/README.md` or equivalent MUST contain:

| Section          | Required?                  | Minimum Content                       |
| ---------------- | -------------------------- | ------------------------------------- |
| Status tag       | Required                   | `<!-- @common/<name> — status: X -->` |
| Description      | Required                   | What it does, when to use it          |
| Installation     | Required                   | Import path or install command        |
| Quick Start      | Required                   | Minimum working code example          |
| API Reference    | Required (if 3+ exports)   | Method table or interface list        |
| Configuration    | Required (if has env vars) | Env var table                         |
| Error Handling   | Required                   | Strategy description + example        |
| Common Pitfalls  | Recommended                | Gotchas, edge cases                   |
| Dependencies     | Required                   | Package dependencies                  |
| Related Packages | Recommended                | Cross-references                      |

---

## Example

> Applied to the `nestJs-boilerplate` project.

- **Status:** `<!-- api-nominas — status: Published -->`
- **Documentation Standard:** Audit-first, machine-checkable, audience-specific. AI agents get English technical reference (AGENTS.md), human developers get Spanish tutorial guide (BOILERPLATE.md)
- **Status Tags:** `Draft`, `Published`, `Stale` (30 days), `Auto-Synced`, `Validated 8.5/10`, `Minimal`, `Full`. Used on all generated docs.
- **JSDoc Requirements:** All public classes, methods, functions, interfaces, types, and non-trivial constants. Template includes `@param`, `@returns`, `@throws`, `@example`. Exemptions: private/internal helpers, test files, config objects.
- **Cross-References:** Relative paths. `[AGENTS.md §8](../AGENTS.md#8-external-services)`, `[ADR 001](./docs/adr/001-auth-strategy.md)`
- **Diagram Convention:** Mermaid with LR for dependencies, TB for data flow. Legend for 10+ node graphs.
- **Triggers:** 10 mandatory trigger rules, each with a CI validation command. PRs blocked without doc updates.
- **Pre-Commit Checklist:** 9 item checklist. Verification via `npm run docs:check` (full validation), `npm run lint` (JSDoc), manual link/Mermaid review.
- **Package README Minimum:** 10 section requirement table with Required/Recommended classification.
