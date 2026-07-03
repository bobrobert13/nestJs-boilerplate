# Capability: testing-infrastructure

## Purpose

The system MUST provide a Jest configuration that resolves the workspace path aliases (`@common/*`) and discovers spec files in both `apps/` and `packages/` so that every test in the RBAC test suite loads without module-resolution errors and `npm run test` runs to completion.

## Requirements

### Requirement: Jest Config Resolves Workspace Path Aliases

The system MUST map every `@common/<name>` import to `<rootDir>/packages/<name>/src/index.ts` in the Jest config. The system MUST include `<rootDir>/packages/` in Jest's `roots` so spec files under `packages/` are discovered. The system MUST set `moduleDirectories` to `["node_modules", "<rootDir>"]` so that `moduleResolution: "nodenext"` resolves correctly. When `npm run test` is executed, the system MUST load every existing and new spec file without `Cannot find module '@common/*'` errors.

#### Scenario: All spec files load under npm run test

- **GIVEN** the jest config in `package.json` declares the `moduleNameMapper`, `roots`, and `moduleDirectories` keys
- **WHEN** the developer runs `npm run test` from the repository root
- **THEN** every spec file under `apps/` and `packages/` is discovered and loaded
- **AND** zero suites fail with `Cannot find module '@common/...'` errors

#### Scenario: Framework specs in packages are picked up

- **GIVEN** a new spec file at `packages/auth/src/rbac/__tests__/role-hierarchy.spec.ts`
- **WHEN** the developer runs `npm run test`
- **THEN** the suite is discovered (because `<rootDir>/packages/` is in `roots`)
- **AND** the suite is executed (because the `@common/auth` import resolves)

#### Scenario: Stale spec files stop failing to load

- **GIVEN** the 3 pre-existing spec files in `apps/nominas/src/modules/usuarios/__tests__/` import from `@common/auth`
- **WHEN** the developer runs `npm run test` after the config change
- **THEN** all 3 suites load successfully
- **AND** the suites report `Test Suites: 3 passed` (or more, after new specs are added) instead of `2 failed, 1 passed`
