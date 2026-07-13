# Capability: ai-field-ui-metadata

## Purpose

Specifies the optional `ui` field on `SchemaFieldDefinition` that lets the LLM hint at how a field should be rendered in the frontend form. The field is optional: the LLM may include it or omit it. When absent, the frontend falls back to type-based widget defaults. The capability covers the TypeScript shape, the AI prompt guidance, and the documented fallback table.

## Requirements

### Requirement: TypeScript Shape

`packages/ai/src/types/ai.types.ts` MUST extend `SchemaFieldDefinition` with an optional property `ui?: { widget?: string; options?: unknown[]; min?: number; max?: number; placeholder?: string; helpText?: string }`. Every property of `ui` is itself optional. A `SchemaFieldDefinition` without a `ui` key is valid; a `SchemaFieldDefinition` with an empty `ui` object (`ui: {}`) is also valid (and equivalent to "no hints — use fallback"). The Zod schema used to parse LLM output MUST reflect the same shape.

#### Scenario: Agent reads the new field on the type

- GIVEN an agent reads `packages/ai/src/types/ai.types.ts`
- WHEN the agent searches for the `SchemaFieldDefinition` interface
- THEN the `ui?: { ... }` field SHALL be present
- AND every property of `ui` SHALL be marked optional with `?`

#### Scenario: Agent reads a schema without `ui`

- GIVEN a `GeneratedSchema` whose `fields` array has no `ui` keys
- WHEN the agent type-checks the result
- THEN the type SHALL be assignable to `SchemaFieldDefinition[]` without errors
- AND every `field.ui` SHALL be `undefined` at runtime

#### Scenario: Agent reads a schema with partial `ui`

- GIVEN a field with `ui: { widget: 'datepicker' }` and no other ui keys
- WHEN the agent accesses the field
- THEN `field.ui.widget === 'datepicker'` and `field.ui.placeholder === undefined`

### Requirement: LLM May Include or Omit

The LLM prompt for `generateSchemaAndData` MUST explicitly tell the model that `ui` is optional. The prompt SHOULD describe each `ui` property and give examples (e.g., `widget: 'datepicker'`, `min: 0`, `placeholder: 'Enter amount'`). The model MUST NOT be required to include `ui` on every field — the absence of `ui` is a valid signal that the frontend should use the type-based fallback.

#### Scenario: Agent reads the prompt instructions

- GIVEN a unit test that captures the prompt sent to the LLM
- WHEN the agent inspects the prompt text
- THEN the prompt SHALL contain a sentence stating that `ui` is optional
- AND SHALL list the `ui` sub-properties with one-line descriptions

#### Scenario: Agent tests the LLM omitting `ui`

- GIVEN the LLM returns fields with no `ui` keys
- WHEN `generateSchemaAndData` parses the response
- THEN the response SHALL be `{ success: true, data: { schema, data } }` with `ui: undefined` on every field

#### Scenario: Agent tests the LLM including partial `ui`

- GIVEN the LLM returns one field with `ui: { widget: 'datepicker' }` and others without
- WHEN `generateSchemaAndData` parses the response
- THEN the field with `ui` SHALL have `ui.widget === 'datepicker'`
- AND the other fields SHALL have `ui === undefined`

### Requirement: Documented Frontend Fallback Table

`packages/ai/README.md` (or AGENTS.md §8) MUST include a fallback widget table that the frontend implements when `ui` is absent. The table MUST be:

| Field type | Default widget |
|------------|----------------|
| `string`   | `text` input   |
| `number`   | `number` input |
| `boolean`  | `checkbox`     |
| `date`     | `datepicker`   |
| `array`    | `repeater`     |
| `object`   | `fieldset`     |

The frontend MAY override the inferred widget by reading `ui.widget` when present.

#### Scenario: Agent reads the fallback table

- GIVEN an agent reads the ai-field-ui-metadata documentation
- WHEN the agent searches for "fallback" or "default widget"
- THEN the table above SHALL be present
- AND the table SHALL be marked as the implementation contract for the frontend

#### Scenario: Frontend developer reads the precedence rule

- GIVEN a field has both `type: 'date'` and `ui: { widget: 'datetime' }`
- WHEN the frontend renders the field
- THEN the frontend SHALL use `'datetime'` (the explicit hint), not `'datepicker'` (the type fallback)

#### Scenario: Frontend developer uses the type fallback

- GIVEN a field has `type: 'number'` and no `ui`
- WHEN the frontend renders the field
- THEN the frontend SHALL use `'number'` input (the type fallback)

### Requirement: Cross-Reference to Pipeline and Corrections

The documentation MUST cross-reference the `dynamic-schema-module` and `dynamic-schema-corrections` capabilities: the `ui` metadata is stored on the `GeneratedSchema` JSON that is persisted in the `dynamic_schemas` collection. The corrections flow does NOT modify `ui` (PATCH is for data values, not for schema metadata). To change a field's `ui`, the agent MUST re-run `POST /dynamic-schema/pipeline` with the updated artifact.

#### Scenario: Agent traces `ui` through the pipeline

- GIVEN an agent reads the dynamic-schema, ai-schema-and-data, and ai-field-ui-metadata sections
- WHEN the agent wants to understand where `ui` lives at runtime
- THEN the cross-references SHALL show: `LLM` → `GeneratedSchema.fields[].ui` → `dynamic_schemas.schemaDefinition` (persisted) → frontend form rendering
- AND SHALL state that PATCH on a document does NOT touch `ui`; PATCH only changes data values
