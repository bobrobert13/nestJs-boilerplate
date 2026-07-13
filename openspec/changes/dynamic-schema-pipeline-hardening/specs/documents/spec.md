# Documents Specification (delta)

## Purpose

Extiende la spec documents original con validacion previa de `DocumentFormat`
y soporte para chain con el modulo `dynamic-schema`.

## Requirements

### Format Enum Validation

The system MUST validate the `format` parameter against the `DocumentFormat` union before dispatching to the parser chain.

#### Scenario: Valid format dispatches to parser

- GIVEN `format = 'pdf'` or `format = 'docx'`
- WHEN `DocumentProcessorService.extract(buffer, format)` is called
- THEN the processor finds a matching parser and delegates to it.

#### Scenario: Invalid format returns structured error

- GIVEN `format = 'xlsx'` (no parser registered)
- WHEN `extract()` is called
- THEN the processor throws an Error with JSON message `{code: 'DOCUMENT_PARSE_ERROR', message: 'Unsupported document format: xlsx'}` BEFORE attempting to parse the buffer.

### Chained AI Pipeline

The system SHOULD be safe to call as the first step of the `dynamic-schema` pipeline.

#### Scenario: extract then generate then compile

- GIVEN a PDF document
- WHEN `/api/dynamic-schema/pipeline` is called
- THEN the document processor returns `DocumentContent` with non-empty text
  - AND the schema generation proceeds on that text
  - AND compilation + registration happens on the resulting schema.

## Affected Documentation

- `packages/documents/README.md`
- `openspec/specs/documents/spec.md` (additive only)
