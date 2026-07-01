# Contributing

## Development Setup

1. Clone the repo
2. Run `./setup/setup.sh` (Linux/Mac) or `setup\setup.bat` (Windows)
3. `npm install`
4. Create `.env` from `AGENTS.md` §3 environment variables
5. `npm run start:dev`

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code restructuring
- `test:` — Tests
- `chore:` — Build, CI, dependencies

## Pull Request Process

1. Create a branch from `main`
2. Make your changes following existing patterns (see AGENTS.md §5)
3. Run `npm run lint && npm run build && npm run test` before pushing
4. Open a PR with a clear description
5. Automated checks must pass before review

## Code Review

- PRs over 400 changed lines should be split into chained PRs
- Keep tests with the code they verify
- Follow module patterns documented in AGENTS.md

## Documentation

- **AGENTS.md**: Technical reference for AI agents and developers
- **BOILERPLATE.md**: Extended guide in Spanish (estructura, paquetes, patrones)
- Each package has its own README.md with API reference

## Questions?

Open an issue or start a discussion.
