# Prompt: Generate README.md

## Input Required

- `{{PROJECT_NAME}}` — Project name from package.json, go.mod, or Cargo.toml
- `{{PROJECT_DESCRIPTION}}` — One-sentence project description
- `{{PROJECT_TYPE}}` — monorepo-nestjs, single-app-fastapi, library-rust, cli-go, etc.
- `{{TECH_STACK}}` — Detected tech stack: Language, Framework, Database, Cache, Queue, etc.
- `{{AUDIT_RESULTS}}` — Phase 1 audit output (health score, gap analysis, existing doc quality)
- `{{BLUEPRINT}}` — Phase 2 blueprint: which sections are required vs optional
- `{{QUICK_START_COMMANDS}}` — Detected commands: install, build, test, lint, start
- `{{ENV_VARS}}` — All environment variables with defaults, required flag, and descriptions
- `{{ARCHITECTURE_DIAGRAM}}` — Mermaid diagram from hydration phase
- `{{REPO_URL}}` — Git remote URL (if public)
- `{{BADGES}}` — Detected badges: CI status, coverage, license, version, etc.

## Output Format

A complete README.md file following this structure:

```markdown
<!-- {{PROJECT_NAME}} — status: {{STATUS}} -->

{{BADGES_ROW}}

# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Table of Contents

## Quick Start

### Prerequisites

### Installation

### Development

### Production

## Architecture

### Diagram

### Tech Stack

### Project Structure

## Packages/Modules

(monorepo: list each package with link to its README)
(single app: list each module with brief description)

## API Reference

(if applicable)

## Environment Variables

| Variable | Default | Required | Description |
| -------- | ------- | -------- | ----------- |

## Commands Reference

| Task | Command |
| ---- | ------- |

## Development

### Setup

### Testing

### Code Quality

### Creating New Modules/Packages

## Deployment

### Docker

### Environment Configuration

### Health Checks

## Documentation

- AGENTS.md — Technical reference for AI agents
- CHANGELOG.md — Release history
- CONTRIBUTING.md — How to contribute
- SECURITY.md — Vulnerability reporting
  (links only — no duplicate content)

## License
```

## Prompt

````
You are generating the README.md for a {{PROJECT_TYPE}} project.

PROJECT CONTEXT:
- Name: {{PROJECT_NAME}}
- Description: {{PROJECT_DESCRIPTION}}
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Database: {{DATABASE}}
- Additional services: {{ADDITIONAL_SERVICES}}

AUDIT CONTEXT:
- Current documentation health: {{HEALTH_SCORE}}/10
- Existing README quality: {{README_QUALITY}}
- Key gaps identified: {{KEY_GAPS}}

BLUEPRINT CONTEXT:
- Required sections for {{PROJECT_TYPE}}: {{REQUIRED_SECTIONS}}
- Optional sections: {{OPTIONAL_SECTIONS}}

YOUR TASK:
Generate a complete README.md. Follow these rules:

1. PRESERVE existing content where quality is "Good" or "Excellent". Merge improvements;
   do NOT replace content that works.

2. ADD missing sections from the blueprint. For each section:

   a) Quick Start: Write commands that the user can copy-paste and run.
      - Use `{{PKG_MANAGER}}` commands, not generic ones
      - Test each command mentally: does it need a prerequisite step first?
      - Show actual output or expected result for key commands

   b) Architecture: Include {{ARCHITECTURE_DIAGRAM}} if available.
      - Label all components with their real names
      - Add a one-line description for each component
      - Keep the diagram focused — 8-15 nodes max

   c) Environment Variables: Build a complete table.
      - Scan ALL files in {{SRC_DIR}} for `process.env.`, `os.Getenv(`, `config(` patterns
      - Include: variable name, default value, required (yes/no), description
      - Group by component: Database, Auth, Email, etc.

   d) Commands Reference: Build from package.json scripts or Makefile.
      - Every script gets a row
      - Description explains what it does, not just the command
      - Note prerequisites (e.g., "requires Docker running")

   e) Packages/Modules: Link to each sub-README.
      - Use relative links: [@common/ai](./packages/ai/README.md)
      - Add a one-line description for each
      - If a package has no README, note it: "⚠️ Missing — see source at packages/ai/src/"

3. FORMAT consistently:
   - Use `<!-- name — status: X -->` status tag as first line
   - Use GitHub-flavored markdown tables (not HTML)
   - Use relative links for all internal references
   - Use shell code blocks with language tag: ```bash
   - Keep line length under 120 chars for readability

4. ADD {{BADGES}} row below the title if any CI/CD, coverage, or version badges are detected.

5. UPDATE the Table of Contents after all sections are written.
   - Use lowercase anchors matching heading text
   - Omit the ToC heading from itself

6. SELF-VALIDATE against the audit rubric:
   - All required sections present? (Structural Coverage)
   - Code examples are copy-paste runnable? (Content Quality)
   - Tables have all columns filled? (Content Quality)
   - Links are relative and valid? (Navigability)

7. OUTPUT only the complete README.md content. Do not wrap in markdown code fences unless
   it will be consumed by another tool that requires them.
````

## Usage Context

- **Phase**: Phase 3 (Generate) — step 4 of document generation order
- **Trigger**: After package/module READMEs are generated (root README references them)
- **Depends on**: Phase 1 audit, Phase 2 blueprint, Phase 3 package READMEs
- **Feeds into**: Phase 4 validation — scored against the rubric
- **Re-run frequency**: When new packages are added, when tech stack changes, before release

## Real Example from nestJs-boilerplate

This prompt was applied to the NestJS 11 monorepo README.md:

**What existed before**: A minimal README with ~30 lines — just the project name, a one-liner, and a link to BOILERPLATE.md. No Quick Start, no env vars, no architecture.

**What the prompt produced**: A 200+ line README with:

- Status tag: `<!-- nestJs-boilerplate — status: active -->`
- Full Quick Start: `npm install && cp .env.example .env && npm run start:dev`
- Architecture: Mermaid diagram showing apps → packages flow with all 10 packages labeled
- Environment Variables table: 25+ vars grouped by Auth, Resend, Playwright, Inngest, Database
- Commands Reference: 7 commands (dev, build, lint, test formats, e2e, format, prod)
- Packages section: Links to all 10 package READMEs with status indicators
- Preserved content: The BOILERPLATE.md link and Spanish language context were kept

**Key decision**: The prompt's "preserve existing" rule was critical — the old README linked to BOILERPLATE.md (a Spanish tutorial), which had high traffic and couldn't be removed. The generator merged the new sections AROUND the existing link instead of replacing it.
