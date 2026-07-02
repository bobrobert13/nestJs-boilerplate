<!-- Template: doc-forge/templates/PACKAGE_README.template.md -->
<!-- {{PACKAGE_NAME}} — status: {{STATUS}} -->

# {{PACKAGE_NAME}}

{{PACKAGE_DESCRIPTION}}

## Installation

```bash
{{INSTALL_COMMAND}}
```

## Quick Start

```{{LANGUAGE}}
{{IMPORT_EXAMPLE}}

{{USAGE_EXAMPLE}}
```

## API Reference

### {{MAIN_SERVICE_CLASS}}

| Method | Signature | Description |
| ------ | --------- | ----------- |

{{METHOD_ROWS}}

### {{OTHER_EXPORTS_TITLE}}

{{OTHER_EXPORTS_LIST}}

## Configuration / Environment Variables

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |

{{ENV_VAR_ROWS}}

## Error Handling

{{ERROR_STRATEGY_DESCRIPTION}}

```{{LANGUAGE}}
{{ERROR_HANDLING_EXAMPLE}}
```

## Common Pitfalls

{{PITFALLS_LIST}}

## Dependencies

| Package | Version | Purpose |
| ------- | ------- | ------- |

{{DEPENDENCY_ROWS}}

## Related Packages

| Package | Relationship |
| ------- | ------------ |

{{RELATED_PACKAGES}}

---

## Example

> Rendered for the `@common/database` package in the `nestJs-boilerplate` project.

- **Status:** `<!-- @common/database — status: Full -->`
- **Description:** MongoDB connection with retry logic and transaction support
- **Installation:** Already part of the monorepo, imported as `@common/database`
- **Quick Start:** Import `DatabaseModule` in AppModule, inject `TransactionService` / `TransactionManager` / `TransactionalWrapper` where needed
- **API Reference:** `TransactionService.withTransaction()` wraps operations atomically, `@Transaction()` decorator for declarative style, `TransactionManager` for manual lifecycle, `TransactionalWrapper` for programmatic isolation control. Also exports `@TransactionParam()` decorator for injecting `ClientSession` into controller params.
- **Env Vars:** `MONGODB_URI=mongodb://localhost:27017/boilerplate_db`
- **Error Handling:** Throws NestJS native exceptions (`NotFoundException`, etc.) with auto-retry on transient errors. Always wrap calls in `try/catch`.
- **Common Pitfalls:** (1) Forgetting to pass `{ session }` to Mongoose operations inside `withTransaction()`, (2) Using `TransactionManager` without calling `end()` in `finally`, (3) Mixing decorated and manual transactions in the same call chain
- **Dependencies:** @nestjs/mongoose, mongoose, @nestjs/config
- **Related Packages:** @common/common (BaseAdapter interface used by repositories), apps/nominas/usuarios (CRUD module consuming transactions)
