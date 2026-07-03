# Capability: npm-scripts

## Purpose

The `package.json` `scripts` block is the single source of truth for
developer-facing commands (`build`, `lint`, `test`, `format`, etc.). The glob
patterns that drive the `lint` and `format` scripts MUST match the real
project layout (`apps/` and `packages/`), so a developer running them on a
clean checkout gets real output instead of a silent no-op.

## Requirements

### Requirement: Lint Script Operates On Real Project Files

The `npm run lint` script MUST invoke ESLint against the actual TypeScript
source files in this project (`apps/**/*.ts` and `packages/**/*.ts`). The
script MUST NOT exit with "all files matching the glob pattern are
ignored" when the working tree is clean.

#### Scenario: Lint Script Matches Real Source Files

- **GIVEN** the project TypeScript sources under `apps/` and `packages/`
- **WHEN** `npm run lint` is executed
- **THEN** ESLint runs against files in those directories and exits with a meaningful status (0 on a clean tree, or a non-zero status with a list of real lint errors that need separate fixes)

### Requirement: Format Script Covers Apps And Packages

The `npm run format` script MUST run Prettier against TypeScript source
files in BOTH `apps/` and `packages/` so a single invocation formats the
entire project. The script MUST NOT silently skip the `packages/` tree.

#### Scenario: Format Script Touches Both Apps And Packages

- **GIVEN** TypeScript files exist under both `apps/` and `packages/`
- **WHEN** `npm run format` is executed
- **THEN** Prettier processes files from BOTH directories (the previous broken glob only covered `apps/`)
