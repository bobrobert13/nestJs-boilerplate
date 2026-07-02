<!-- Template: doc-forge/templates/CONTRIBUTING.template.md -->
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

# Contributing to {{PROJECT_NAME}}

Thank you for considering contributing. This document outlines the process
for contributing code, reporting issues, and proposing changes.

## Development Setup

### Local Environment

```bash
{{CLONE_COMMAND}}
{{INSTALL_COMMAND}}
{{SETUP_COMMAND}}
{{DEV_SERVER_COMMAND}}
```

### Required Tools

{{REQUIRED_TOOLS_LIST}}

### Environment Variables

Copy the example environment file and fill in the required values:

```bash
cp {{ENV_EXAMPLE_FILE}} .env
```

### Running Tests

```bash
{{TEST_COMMANDS}}
```

---

## Branch Strategy

| Branch                               | Purpose                         |
| ------------------------------------ | ------------------------------- |
| `{{MAIN_BRANCH}}`                    | Production-ready code           |
| `{{DEV_BRANCH}}`                     | Integration branch for features |
| `feature/{{FEATURE_BRANCH_PATTERN}}` | New features                    |
| `fix/{{FIX_BRANCH_PATTERN}}`         | Bug fixes                       |
| `docs/{{DOCS_BRANCH_PATTERN}}`       | Documentation changes           |
| `chore/{{CHORE_BRANCH_PATTERN}}`     | Maintenance tasks               |

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]
[optional footer with BREAKING CHANGE or issue references]
```

### Types

| Type       | Use When                             |
| ---------- | ------------------------------------ |
| `feat`     | New feature                          |
| `fix`      | Bug fix                              |
| `docs`     | Documentation only                   |
| `style`    | Formatting, no code change           |
| `refactor` | Code restructure, no behavior change |
| `perf`     | Performance improvement              |
| `test`     | Adding or fixing tests               |
| `chore`    | Build, CI, tooling                   |
| `ci`       | CI/CD pipeline changes               |

### Scopes

Valid scopes for this project:

{{SCOPE_LIST}}

### Examples

```
feat({{EXAMPLE_SCOPE}}): {{EXAMPLE_FEAT_MESSAGE}}
fix({{EXAMPLE_SCOPE}}): {{EXAMPLE_FIX_MESSAGE}}
docs({{EXAMPLE_SCOPE}}): {{EXAMPLE_DOCS_MESSAGE}}
```

---

## PR Process

### Before Submitting

{{PR_PRECHECKLIST}}

### PR Title Convention

PR titles MUST follow the same conventional commit format as commits. The merge commit
will use the PR title as its message.

### PR Body Template

```markdown
## What

<!-- Describe what this PR does -->

## Why

<!-- Why is this change needed? -->

## How

<!-- Technical approach and key decisions -->

## Testing

<!-- How was this tested? -->

## Screenshots

<!-- If applicable -->
```

### Review Requirements

| Requirement | Description |
| ----------- | ----------- |

{{REVIEW_REQUIREMENT_ROWS}}

---

## Code Review Rules

### For Authors

{{AUTHOR_RULES}}

### For Reviewers

{{REVIEWER_RULES}}

### Review Checklist

- [ ] Code follows project conventions (imports, naming, patterns)
- [ ] Public API has JSDoc/docstrings
- [ ] Tests cover new behavior and edge cases
- [ ] No secrets or hardcoded credentials
- [ ] Documentation updated (README, AGENTS.md, CHANGELOG.md)
- [ ] Breaking changes documented with migration guide
- [ ] No commented-out code or debug logs
- [ ] Error handling uses the correct strategy for the component

---

## Testing Requirements

### Coverage Thresholds

| Metric | Minimum |
| ------ | ------- |

{{COVERAGE_THRESHOLDS}}

### Test Structure

```
{{TEST_STRUCTURE_TREE}}
```

### Writing Tests

```{{LANGUAGE}}
{{TEST_EXAMPLE}}
```

---

## Documentation Requirements

> Per our [Documentation Convention]({{CONVENTION_LINK}}), every change that affects the
> public API, behavior, configuration, or architecture MUST include documentation updates.

### Trigger Mapping

| Code Change | Doc Update Required |
| ----------- | ------------------- |

{{DOC_TRIGGER_ROWS}}

---

## Issue Reporting

### Bug Report Template

```markdown
## Description

<!-- Clear description of the bug -->

## Steps to Reproduce

1.
2.
3.

## Expected Behavior

<!-- What should happen -->

## Actual Behavior

<!-- What actually happens -->

## Environment

- OS: {{EXAMPLE_OS}}
- {{LANGUAGE}} version: {{EXAMPLE_VERSION}}
- {{FRAMEWORK}} version: {{EXAMPLE_FRAMEWORK_VERSION}}
```

### Feature Request Template

```markdown
## Problem

<!-- What problem are you trying to solve? -->

## Proposed Solution

<!-- How should it work? -->

## Alternatives Considered

<!-- What else did you consider? -->

## Impact

<!-- Which components/packages are affected? -->
```

---

## Example

> Rendered for the `nestJs-boilerplate` project.

- **Status:** `<!-- api-nominas — status: Published -->`
- **Development Setup:** Node.js 20+, MongoDB, `npm install`, `npm run start:dev`
- **Branch Strategy:** `main` (prod), `develop` (integration), `feature/*`, `fix/*`, `docs/*`, `chore/*`
- **Commit Convention:** Conventional Commits with scopes: auth, database, ai, http, playwright, inngest, resend, documents, serve-static, common, usuarios, dynamic-schema, docs, ci, deps
- **PR Process:** Linear history (rebase, no merge commits), squash on merge. PR title follows conventional commit. Required checks: lint, test, build, docs-check
- **Code Review:** Authors must self-review, run tests locally, update docs. Reviewers verify convention compliance, JSDoc coverage, test quality, security
- **Testing:** Jest, coverage minimum 70% branches / 80% functions / 90% lines. E2E tests in `apps/nominas/test/`. Package unit tests co-located in `src/__tests__/` or `*.spec.ts`
- **Documentation Requirements:** Adding a new package → README.md + JSDoc + AGENTS.md index. New env var → README.md + .env.example. New endpoint → Swagger decorators + README API table. Breaking change → CHANGELOG.md + migration guide
- **Issue Reporting:** GitHub Issues with bug and feature templates. Include OS, Node version, NestJS version, MongoDB version
