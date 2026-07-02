# Cross-Cutting Concerns Matrix Specification

> **Index Mode:** `cross-cutting`
> **Apply When:** Multi-service architectures, shared utilities, distributed systems, pipeline features.
> **Output:** A table in AGENTS.md warning the LLM about hidden dependencies between seemingly unrelated components.

---

## What It Is

A three-column table that answers the question: "If I change X, what else might break?" Unlike the feature-to-file index (which maps questions to files), this table maps components to OTHER components — the ones that depend on them indirectly.

This prevents the most common LLM failure mode: making a surgical change to one package and breaking a downstream consumer because the agent didn't know the dependency existed.

## Table Format

```
| If the request touches... | Also check... | Why |
|---|---|---|
| {{COMPONENT_A_1}} | {{COMPONENT_B_1}} | {{HIDDEN_DEPENDENCY_REASON_1}} |
| {{COMPONENT_A_2}} | {{COMPONENT_B_2}} | {{HIDDEN_DEPENDENCY_REASON_2}} |
...
{{CROSS_CUTTING_ROWS}}
```

### Column Definitions

| Column                        | Contents                                                                  | Example                           |
| ----------------------------- | ------------------------------------------------------------------------- | --------------------------------- |
| **If the request touches...** | A component, package, or feature area that the user or agent is modifying | `Auth (login/register)`           |
| **Also check...**             | A different component that may be affected by changes to the first        | `@common/resend`                  |
| **Why**                       | The hidden dependency — WHY changing the first might break the second     | `Email verification, magic links` |

## The "STOP and Ask" Rule

Below the table, a mandatory rule MUST appear:

> **Rule:** If the user asks for a change in any of the "If the request touches..." columns, STOP and ask: "This change could affect [related area]. Should I include that in scope?"

This is a safety valve. It prevents an agent from silently expanding scope beyond what the user asked for. The agent asks permission before touching cross-cutting areas.

## When to Use

| Condition                                                        | Decision                     |
| ---------------------------------------------------------------- | ---------------------------- |
| Multi-service architecture (3+ services)                         | Include cross-cutting matrix |
| Shared utility package used by 3+ consumers                      | Include cross-cutting matrix |
| Pipeline features (A → B → C)                                    | Include cross-cutting matrix |
| E2E features spanning 2+ packages (auth→email, scraping→storage) | Include cross-cutting matrix |
| Single app, no shared packages                                   | Skip                         |
| All packages isolated with zero inter-dependencies               | Skip (rare)                  |

## How the LLM Generates It

### Step 1: Trace Import Graph

For each package/module, build a dependency list:

```
{{PACKAGE_A}} imports: [{{PACKAGE_B}}, {{PACKAGE_C}}]
{{PACKAGE_B}} imports: [{{PACKAGE_D}}]
```

### Step 2: Identify "Hidden" Dependencies

A dependency is "cross-cutting" (not "direct") when:

1. **Transitive**: A depends on B, B depends on C — A implicitly depends on C
2. **Semantic coupling**: Two packages don't import each other but share a conceptual dependency (both use the same env var, both write to the same collection)
3. **Pipeline coupling**: The output of package A is the input of package B, but A doesn't import B
4. **Configuration coupling**: Env vars or config files affect both packages

### Step 3: Filter to Actionable Rows

A cross-cutting row is useful if changing component A might realistically break component B:

| Useful row                                                   | Useless row                                            |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| `Auth (login) → @common/resend` (real: email verification)   | `Auth → @common/common` (obvious: common is a utility) |
| `AI → documents` (real: schema gen uses document extraction) | `AI → database` (obvious: everything uses database)    |

Skip rows where the dependency is obvious from the import graph or where no realistic breakage could occur.

### Step 4: Write "Why" Columns in Plain Language

The "Why" column must explain the REASON in one short sentence. Use business/domain language, not code terms:

- Good: `Email verification, magic links`
- Good: `Schema gen often follows document extraction`
- Bad: `AiService depends on DocumentProcessorService`

### Step 5: Add the "STOP and Ask" Rule

Always append the safety valve rule below the table.

## Template

```markdown
### Cross-Cutting Concerns

When the user's request touches multiple features, ask before expanding scope:

| If the request touches... | Also check... | Why |
| ------------------------- | ------------- | --- |

{{CROSS_CUTTING_ROWS}}

> **Rule:** If the user asks for a change in any of the "If the request touches..." columns, STOP and ask:
> "This change could affect [related area]. Should I include that in scope?"
```

## Real Example from nestJs-boilerplate

From `AGENTS.md` of a NestJS 11 monorepo.

### Cross-Cutting Concerns

When the user's request touches multiple features, ask before expanding scope:

| If the request touches... | Also check...                              | Why                                          |
| ------------------------- | ------------------------------------------ | -------------------------------------------- |
| Auth (login/register)     | `@common/resend`                           | Email verification, magic links              |
| Auth (login/register)     | `@common/auth/two-factor/`                 | May affect 2FA flow                          |
| Auth (login/register)     | `@common/auth/passkeys/`                   | May affect WebAuthn flow                     |
| Database transactions     | `apps/nominas/src/modules/usuarios/`       | CRUD modules likely use transactions         |
| AI / schema generation    | `@common/documents`                        | Schema gen often follows document extraction |
| AI / schema generation    | `apps/nominas/src/modules/dynamic-schema/` | Pipeline depends on AI service               |
| HTTP / downloads          | `@common/playwright`                       | Downloaded files may need scraping           |
| Emails / newsletter       | `@common/resend`                           | Newsletter uses Resend under the hood        |
| Templates / EJS           | `@common/serve-static`                     | Template rendering uses EJS + TailwindCSS    |

> **Rule:** If the user asks for a change in any of the "If the request touches..." columns, STOP and ask: "This change could affect [related area]. Should I include that in scope?"

**Key observations from this example:**

1. **Same component appears multiple times**: `Auth (login/register)` has 3 rows — each one names a different hidden dependency. This is correct; don't try to merge them.
2. **Sub-modules are listed**: `@common/auth/two-factor/` and `@common/auth/passkeys/` are listed separately from the parent `@common/auth` because changes to the parent auth flow affect them differently.
3. **Pipeline dependencies**: `AI → documents` and `AI → dynamic-schema` capture a multi-stage pipeline. Changing the AI provider could break document extraction AND schema generation.
4. **"Uses X under the hood"**: The newsletter row warns that `Emails / newsletter` changes affect `@common/resend` because the newsletter is built on Resend — a non-obvious implementation detail.
5. **Not every import is cross-cutting**: `@common/database` is imported by nearly everything, but it doesn't appear in cross-cutting because "database is a dependency" is obvious from the import graph.
