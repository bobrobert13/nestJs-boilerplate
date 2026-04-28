# Package Setup Wizard

Interactive setup wizard for selecting packages in the NestJS Boilerplate project.

## Overview

This setup system allows you to:
- **Select packages** to include in your project
- **Configure environment variables** for each package
- **Generate `.env`** file automatically
- **Update `nest-cli.json`** to include only selected packages
- **Update `package.json`** with only required dependencies

## Quick Start

### Linux / macOS / Git Bash / WSL

```bash
# Make script executable
chmod +x setup/setup.sh

# Run setup wizard
./setup/setup.sh

# List available packages
./setup/setup.sh --list

# Reset previous selection
./setup/setup.sh --reset
```

### Windows (cmd.exe or PowerShell)

```cmd
# Run setup wizard
setup\setup.bat

# List available packages
setup\setup.bat --list

# Reset previous selection
setup\setup.bat --reset
```

## Directory Structure

```
setup/
├── setup.js              # Main interactive setup script
├── setup.sh             # Linux/macOS launcher
├── setup.bat            # Windows launcher
├── package-config.json  # Package definitions and metadata
├── selection.json       # Saved selections (generated)
└── templates/
    └── .env.template    # Environment variables template
```

## Available Packages

| Package | Description | Dependencies |
|---------|-------------|--------------|
| `@common/ai` | AI Providers wrapper (OpenAI, Anthropic, Gemini, etc.) | axios |
| `@common/auth` | Authentication with JWT, Magic Links, OAuth, 2FA, Passkeys | @nestjs/jwt, passport, argon2, otplib, qrcode |
| `@common/common` | Common utilities | (none) |
| `@common/database` | MongoDB connection with transactions | mongoose |
| `@common/http` | HTTP client with axios and sharp | axios, sharp |
| `@common/inngest` | Event-driven task queue | inngest |
| `@common/playwright` | Browser automation | playwright |
| `@common/resend` | Email service via Resend API | resend |
| `@common/serve-static` | Static file serving with EJS templates | ejs |

## How It Works

### 1. Package Selection

The wizard displays all available packages with checkboxes. Default selections are pre-configured based on typical use cases.

### 2. Environment Variables

For each selected package, the wizard prompts for environment variables:
- Required variables (marked with `*`) must have a value
- Optional variables have default values that can be accepted with Enter

### 3. Configuration Updates

After selection, the wizard:

1. **Updates `nest-cli.json`**: Removes unselected packages from the monorepo
2. **Updates `package.json`**: Adds required dependencies
3. **Creates `.env`**: Generates environment file with all variables
4. **Saves `selection.json`**: Preserves selection for future runs

## Package Configuration

Each package is defined in `package-config.json` with:

```json
{
  "id": "unique-id",
  "name": "@common/package-name",
  "description": "Package description",
  "path": "path/to/package",
  "selected": true,
  "dependencies": {
    "npm-package": "^1.0.0"
  },
  "peerDependencies": {
    "@nestjs/common": "^10.0.0 || ^11.0.0"
  },
  "envVars": [
    {
      "name": "VAR_NAME",
      "description": "Variable description",
      "required": false,
      "default": "default-value"
    }
  ]
}
```

## Adding New Packages

To add a new package to the selection system:

1. Add the package definition to `setup/package-config.json`
2. Ensure the package has a `package.json` in `packages/<package-name>/`
3. Add the project entry to `nest-cli.json`
4. Run the setup wizard

## Environment Variables

### Required Variables

| Variable | Description | Package |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `@common/database` |
| `JWT_SECRET` | JWT secret key (min 32 chars) | `@common/auth` |

### Optional Variables

Each package has its own set of optional environment variables documented in `templates/.env.template`.

## Troubleshooting

### "Node.js is not installed"

Install Node.js 20+ from https://nodejs.org/

### "permission denied: setup.sh"

```bash
chmod +x setup/setup.sh
```

### Selection not updating

```bash
# Reset and start fresh
./setup/setup.sh --reset
```

### Missing dependencies after selection

```bash
npm install
npm run build
```

## Future Enhancements

- [ ] Add `--non-interactive` mode for CI/CD
- [ ] Add package dependency resolution
- [ ] Add validation for environment variables
- [ ] Add support for multiple `.env` files (dev, staging, prod)
- [ ] Add package-specific setup options
- [ ] Add rollback capability
- [ ] Add test to verify setup works correctly

## Architecture Decisions

### Why Node.js for setup?

- **Cross-platform**: Works on Windows, Linux, macOS consistently
- **JSON parsing**: Easy to read/write package config
- **No external dependencies**: Uses only Node.js standard library

### Why interactive CLI?

- **User-friendly**: Guided experience for new users
- **Validation**: Can validate inputs before writing files
- **Clear feedback**: Shows exactly what will be configured

### Why JSON config?

- **Extensible**: Easy to add new packages
- **Versionable**: Can track changes in git
- **Parseable**: Both humans and machines can read it

## License

MIT
