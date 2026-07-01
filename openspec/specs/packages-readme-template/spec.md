# packages-readme-template Specification

## Purpose

Define the canonical 7-section README template that ALL package READMEs (`packages/*/README.md`) MUST follow, enabling AI agents to find information predictably.

## Requirements

### Requirement: Seven-Section Order

Every package README MUST present sections in this order: Description, Installation, Quick Start, API Reference, Configuration/Env Vars, Error Handling, Common Pitfalls. Each section SHALL use a level-2 heading (`## Section Name`).

#### Scenario: Agent navigates to a specific section across packages

- GIVEN an agent reads `packages/ai/README.md` and `packages/database/README.md`
- WHEN the agent searches for error handling conventions
- THEN the heading `## Error Handling` SHALL appear in the same position (6th section) in both files
- AND the heading `## API Reference` SHALL precede `## Configuration/Env Vars`

### Requirement: Minimum Content Per Section

Each section MUST contain at least one non-empty paragraph or code block. Sections MUST NOT be empty placeholders. The `## Quick Start` section SHALL include an import-and-use code example.

#### Scenario: Agent finds usable code in Quick Start

- GIVEN an agent opens any package README
- WHEN the agent reads the Quick Start section
- THEN at least one complete TypeScript code block SHALL be present
- AND the block SHALL include the import path from `@common/*`

### Requirement: Section Merging on Existing Content

When a README already contains content matching a section's purpose under a different heading, that content SHALL be preserved and re-headed rather than duplicated.

#### Scenario: Existing "Best Practices" content maps to "Common Pitfalls"

- GIVEN `packages/ai/README.md` has a `## Best Practices` section with error handling advice
- WHEN the template is applied
- THEN the content SHALL move under `## Common Pitfalls` or `## Error Handling` as appropriate
- AND the original `## Best Practices` heading SHALL NOT remain
