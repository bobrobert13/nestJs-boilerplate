# Documents Specification

## Purpose

Extraccion de texto desde documentos PDF y DOCX. Interfaz extensible via `IDocumentParser` para agregar nuevos formatos. Provee `DocumentProcessorService` con auto-deteccion del parser segun formato.

Documentacion asociada: `packages/documents/README.md`, `AGENTS.md` (seccion 4).

## Requirements

### PDF Text Extraction

The system MUST extract text content from PDF files using `pdf-parse`.

#### Scenario: Extract text from PDF

- GIVEN a valid PDF buffer
- WHEN `PdfService.parse(buffer)` is called
- THEN the system returns `{ text: string, pageCount?: number, images?: string[], format: "pdf" }`

### DOCX Text Extraction

The system MUST extract text content from DOCX files using `mammoth`.

#### Scenario: Extract text from DOCX

- GIVEN a valid DOCX buffer
- WHEN `DocxService.parse(buffer)` is called
- THEN the system returns `{ text: string, pageCount?: number, images?: string[], format: "docx" }`

### Document Processor Routing

The system MUST auto-detect and route to the correct parser based on format string via the parsers array.

#### Scenario: PDF routing

- GIVEN a PDF buffer and format = "pdf"
- WHEN `DocumentProcessorService.extract(buffer, "pdf")` is called
- THEN the system finds the parser whose `supports("pdf")` returns true
  - AND calls `parser.parse(buffer)`

#### Scenario: DOCX routing

- GIVEN a DOCX buffer and format = "docx"
- WHEN `extract(buffer, "docx")` is called
- THEN the system routes to `DocxService`

### Unsupported Format Error

The system MUST throw a structured error when no parser supports the requested format.

#### Scenario: Unknown format throws DOCUMENT_PARSE_ERROR

- GIVEN format = "xlsx" (no parser supports it)
- WHEN `extract(buffer, "xlsx")` is called
- THEN the system throws `Error` with message JSON:
  ```json
  { "code": "DOCUMENT_PARSE_ERROR", "message": "Unsupported document format: xlsx" }
  ```

### Default Page Count Fallback

The system MUST default `pageCount` to 1 when parser does not provide it.

#### Scenario: Missing pageCount from parser

- GIVEN a parser returns `{ text, images, format }` (no pageCount)
- WHEN `extract()` processes the result
- THEN `result.pageCount` is 1

### Parse Error Wrapping

The system MUST wrap raw parser errors into structured `DOCUMENT_PARSE_ERROR`.

#### Scenario: Underlying parser throws

- GIVEN `parser.parse()` throws `Error("corrupt PDF")`
- WHEN `extract()` catches
- THEN the system throws a new `Error` with JSON message `{ code: "DOCUMENT_PARSE_ERROR", message: "corrupt PDF" }`

### Extensible Parser Interface

The system MUST allow adding new parser implementations via `IDocumentParser`.

#### Scenario: Register custom parser

- GIVEN a parser implementing `IDocumentParser`
- WHEN registered with `DocumentProcessorService` via DI
- THEN the system can process that format alongside PDF and DOCX

## Affected Documentation

- `packages/documents/README.md`
- `AGENTS.md` — section 4 (Packages Index)


---

## Chained AI Pipeline (delta)

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
