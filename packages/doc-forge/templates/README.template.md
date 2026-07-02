<!-- Template: doc-forge/templates/README.template.md -->
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Badges

{{BADGES}}

## Quick Start

### Prerequisites

{{PREREQUISITES}}

### Installation

```bash
{{INSTALL_COMMAND}}
```

### Build

```bash
{{BUILD_COMMAND}}
```

### Run

```bash
{{RUN_COMMAND}}
```

### Verify

```bash
{{VERIFY_COMMAND}}
```

## Documentation Index

| Document | Description |
| -------- | ----------- |

{{DOCS_TABLE_ROWS}}

## Project Structure

> **Note for LLM:** Include this section only for monorepos or projects with 3+ packages/modules. Omit for single-app, single-package projects.

```
{{PROJECT_TREE}}
```

## Tech Stack

| Technology | Version | Purpose |
| ---------- | ------- | ------- |

{{TECH_STACK_ROWS}}

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |

{{ENV_VAR_ROWS}}

## License

{{LICENSE_INFO}}

---

## Example

> Rendered for the `nestJs-boilerplate` project (NestJS 11 monorepo, TypeScript, MongoDB):

- **Status:** `<!-- api-nominas — status: Validated 8.5/10 -->`
- **Badges:** `[![Build](https://github.com/TreborJs/manga/actions/workflows/ci.yml/badge.svg)](...) [![Coverage](https://codecov.io/...)](...) [![License: UNLICENSED](...)](...)`
- **Quick Start:** `git clone`, `npm install`, `npm run start:dev`, `open http://localhost:3000/api`
- **Documentation Index:** links to `AGENTS.md` (AI agent reference), `BOILERPLATE.md` (human tutorial, Spanish), `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/`
- **Project Structure:** Monorepo tree with `packages/` (10 shared packages: auth, database, ai, http, playwright, inngest, resend, documents, serve-static, common) and `apps/nominas/` (main app)
- **Tech Stack:** NestJS 11.x, TypeScript 5.7.x, MongoDB/Mongoose 9.4.x, Inngest 4.2.x, Playwright 1.59.x, Swagger 11.3.x, Argon2, Resend, Sharp, EJS + TailwindCSS
- **License:** UNLICENSED (private)
