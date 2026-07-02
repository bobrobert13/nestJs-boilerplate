# DocForge — IA-Friendly Documentation Framework

<!-- @common/doc-forge — status: complete -->

> **For the LLM reading this:** This README is meta — it's the documentation
> for the documentation framework. Read `DOCFORGE.md` first for the full
> workflow specification.

## What is DocForge?

DocForge is a **technology-agnostic, LLM-first documentation framework** that
produces project documentation consumable by both humans and AI agents.

It is NOT a tool, CLI, or npm package. It is a **specification and template
collection** that an LLM reads and executes. You copy it into any project and
the LLM follows the instructions to audit, blueprint, generate, validate, and
maintain documentation.

## Philosophy

1. **Audit First, Write Second** — never generate before understanding what exists
2. **Convention Over Configuration** — one `CONVENTION.md` drives all decisions
3. **Machine-Checkable** — every rule is verifiable by CI, not just human review
4. **Self-Contained** — zero external dependencies; works in any project
5. **Hydrate, Don't Hardcode** — paths are detected at runtime, never hardcoded
6. **Index Everything** — multiple navigation strategies for humans AND LLMs
7. **Auto-Sync or Die** — documentation without CI enforcement is wishful thinking

## Framework File Map

```
doc-forge/
├── DOCFORGE.md                      ← Start here. Complete workflow.
├── README.md                        ← You are here.
│
├── phases/
│   ├── 01-audit.md                  ← How to audit a project
│   ├── 02-blueprint.md              ← What docs a project needs
│   ├── 03-generate.md               ← How to generate each doc type
│   ├── 04-validate.md               ← Scoring rubric
│   └── 05-maintain.md               ← Auto-sync with CI/CD
│
├── templates/
│   ├── README.template.md           ← Root project README
│   ├── AGENTS.template.md           ← Master index for AI agents
│   ├── PACKAGE_README.template.md   ← Per-package/module README
│   ├── CHANGELOG.template.md        ← Keep a Changelog format
│   ├── CONTRIBUTING.template.md     ← Contribution guide
│   ├── CONVENTION.template.md       ← Documentation standard
│   ├── SECURITY.template.md         ← Vulnerability reporting
│   └── ARCHITECTURE.template.md     ← ADRs / design decisions
│
├── indices/
│   ├── feature-to-file.spec.md      ← "If you ask X, read files Y"
│   ├── capability-matrix.spec.md    ← Package → imports → exports
│   ├── cross-cutting.spec.md        ← "If you touch A, check B"
│   └── error-handling.spec.md       ← Error strategy per component
│
├── prompts/
│   ├── audit-project.prompt.md      ← Full project audit
│   ├── generate-readme.prompt.md    ← Root README
│   ├── generate-agents.prompt.md    ← AGENTS.md master index
│   ├── generate-package-readme.prompt.md ← Per-component README
│   ├── generate-changelog.prompt.md ← From git history
│   ├── generate-jsdoc.prompt.md     ← Bulk JSDoc/docstring generation
│   ├── generate-convention.prompt.md ← Doc convention standard
│   └── maintain-sync.prompt.md      ← Keep docs in sync with code
│
└── examples/
    └── nestjs-boilerplate/
        ├── audit-output.md           ← Real audit report
        ├── convention-applied.md     ← CONVENTION in action
        ├── indices-generated.md      ← All 4 index modes applied
        └── workflow-results.md       ← CI output example
```

## Quick Start (for LLMs)

```
1. Read DOCFORGE.md (the master document)
2. Run Phase 0: Hydration — detect project context
3. Run Phase 1: Audit — score current documentation health
4. Run Phase 2: Blueprint — determine what docs are needed
5. Run Phase 3: Generate — produce documentation using templates + prompts
6. Run Phase 4: Validate — score the result against the rubric
7. Run Phase 5: Maintain — wire auto-sync mechanisms (CI, hooks, checklists)
```

## When to Use DocForge

| Scenario                                     | Use DocForge?                                                         |
| -------------------------------------------- | --------------------------------------------------------------------- |
| New project with zero documentation          | Yes — run full 5-phase cycle                                          |
| Existing project with incomplete docs        | Yes — run audit, then targeted generation                             |
| Documentation has rotted (stale, inaccurate) | Yes — run audit to measure rot, then re-generate                      |
| Adding a new package/module to a monorepo    | Yes — run Phase 3 for the new package README, update Phase 5 triggers |
| Migrating from a different doc system        | Yes — audit existing, blueprint target state, generate                |
| Learning what good documentation looks like  | Yes — read the phases to understand the rubric                        |

## Project Types Supported

DocForge is technology-agnostic. It works with:

- **Monorepos** (Nx, Turborepo, Lerna, Go workspaces, Cargo workspaces)
- **Single Apps** (Express, FastAPI, Rails, Spring Boot, Gin)
- **Libraries** (npm packages, Python packages, Go modules, Rust crates)
- **CLI Tools** (Cobra, Click, Commander, Clap)
- **Static Sites** (Next.js, Astro, Hugo, Jekyll)
- **Mobile Apps** (React Native, Flutter, SwiftUI, Jetpack Compose)

## Contributing

DocForge is a living framework. The phase files in `phases/` are the
specification. To propose changes:

1. Read the relevant phase file(s)
2. Propose changes via PR with a clear rationale
3. Include a before/after example from a real project
4. Update the corresponding example in `examples/`
