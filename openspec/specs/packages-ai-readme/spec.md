# packages-ai-readme Specification

## Purpose

Verify that `packages/ai/README.md` documents `generateSchemaFromImage`, `generateSchemaFromText`, and `GeneratedSchema` types as required by the `ai-schema-generation` spec. This readme verification spec ensures agents find these entries.

## Requirements

### Requirement: Schema Generation Methods Present

The README MUST document `generateSchemaFromImage(providerName, imageData, options?)` and `generateSchemaFromText(providerName, text, options?)` under the `## API Reference` section, each with its signature, parameter descriptions, and return type `Promise<AIResponse<GeneratedSchema>>`.

#### Scenario: Agent locates generateSchemaFromImage in the AI README

- GIVEN an agent reads `packages/ai/README.md` searching for image-to-schema capabilities
- WHEN the agent scans the API Reference section
- THEN the heading `#### generateSchemaFromImage` SHALL be present
- AND the doc SHALL show a code example passing base64 image data
- AND the doc SHALL show `response.success` checking before accessing `response.data`

#### Scenario: Agent locates generateSchemaFromText in the AI README

- GIVEN an agent reads `packages/ai/README.md` searching for text-to-schema capabilities
- WHEN the agent scans the API Reference section
- THEN the heading `#### generateSchemaFromText` SHALL be present
- AND the doc SHALL show `collectionName` used for Mongoose model registration

### Requirement: GeneratedSchema Type Reference

The README MUST include the `GeneratedSchema` interface definition (`fields: SchemaFieldDefinition[]`, `collectionName: string`, `metadata?: object`) alongside `SchemaGenerationOptions` (`temperature?`, `model?`).

#### Scenario: Agent finds GeneratedSchema type definition

- GIVEN an agent needs the shape of a schema generation result
- WHEN the agent reads the Types section of `packages/ai/README.md`
- THEN `GeneratedSchema` and `SchemaFieldDefinition` interfaces SHALL be displayed
- AND `SchemaGenerationOptions` SHALL appear adjacent to both methods' documentation
