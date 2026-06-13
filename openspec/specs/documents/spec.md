# Documents Specification

## Purpose

Extracción de texto desde documentos PDF y DOCX. Interfaz extensible para agregar más formatos.

Documentación asociada: `packages/documents/README.md`

## Requirements

### PDF Text Extraction

The system MUST extract text content from PDF files.

#### Scenario: Extract text from PDF

- GIVEN a valid PDF file with text content
- WHEN `PdfService.extractText(buffer)` is called
- THEN the system returns the extracted text as a string

### DOCX Text Extraction

The system MUST extract text content from DOCX files.

#### Scenario: Extract text from DOCX

- GIVEN a valid DOCX file
- WHEN `DocxService.extractText(buffer)` is called
- THEN the system returns the extracted text as a string

### Document Processor

The system SHOULD auto-detect and route to the correct parser based on file type.

#### Scenario: Auto-detect format

- GIVEN a file buffer with known extension (.pdf or .docx)
- WHEN `DocumentProcessorService.process(buffer, extension)` is called
- THEN the system selects and runs the appropriate parser

### Extensible Parser Interface

The system SHOULD allow adding new parser implementations via `ParserInterface`.

#### Scenario: Register custom parser

- GIVEN a parser implementing `ParserInterface`
- WHEN the parser is registered with the DocumentProcessorService
- THEN the system can process that format

## Affected Documentation

- `packages/documents/README.md`
- `AGENTS.md` — section 3 (Packages Index)
