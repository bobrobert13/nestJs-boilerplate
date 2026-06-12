# @common/documents

Document text extraction module for NestJS — parses PDF and DOCX files into structured text content.

## Features

- **Multi-format support** — PDF and DOCX via dedicated parsers
- **Unified interface** — Single `DocumentProcessorService` handles all formats
- **Extraction metadata** — Returns page count and detected images
- **Format detection** — Auto-detects format from file extension or magic bytes

## Installation

```bash
npm install @common/documents pdf-parse mammoth
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { DocumentsModule } from '@common/documents';

@Module({
  imports: [DocumentsModule],
})
export class AppModule {}
```

### 2. Extract text from any document

```typescript
import { DocumentProcessorService } from '@common/documents';

@Injectable()
export class DocumentService {
  constructor(private readonly docs: DocumentProcessorService) {}

  async extractText(file: Express.Multer.File) {
    const content = await this.docs.extract(file.buffer, file.mimetype);
    return {
      text: content.text,
      pages: content.pageCount,
    };
  }
}
```

---

## DocumentProcessorService

Main entry point for document extraction.

```typescript
interface DocumentContent {
  text: string;           // Extracted text content
  pageCount: number;      // Number of pages (PDF) or sections (DOCX)
  images: string[];        // Base64 encoded images found in document
  format: 'pdf' | 'docx'; // Detected format
}

await docs.extract(buffer, format): Promise<DocumentContent>
```

**Supported formats:**
| Format | MIME Types | Notes |
|--------|-----------|-------|
| PDF | `application/pdf` | Up to 20 pages, 10MB max |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | No page limit |

---

## Direct Service Usage

### PdfService

```typescript
import { PdfService } from '@common/documents';

@Injectable()
export class MyService {
  constructor(private readonly pdf: PdfService) {}

  async extractPDF(buffer: Buffer) {
    const result = await this.pdf.parse(buffer);
    return result.text;
  }
}
```

### DocxService

```typescript
import { DocxService } from '@common/documents';

@Injectable()
export class MyService {
  constructor(private readonly docx: DocxService) {}

  async extractDOCX(buffer: Buffer) {
    const result = await this.docx.parse(buffer);
    return result.text;
  }
}
```

---

## Error Handling

### Error Codes

```typescript
import { DOCUMENT_ERROR_CODES } from '@common/documents';

// DOCUMENT_PARSE_ERROR — Failed to parse document (corrupt or password-protected)
// DOCUMENT_FORMAT_UNSUPPORTED — Format not supported
// DOCUMENT_TOO_LARGE — Exceeds size limit (10MB)
// DOCUMENT_TOO_MANY_PAGES — Exceeds page limit (20 pages)
```

### Handling Errors

```typescript
async extractDocument(file: Express.Multer.File) {
  try {
    return await this.docs.extract(file.buffer, file.mimetype);
  } catch (error) {
    if (error instanceof Error) {
      const parsed = JSON.parse(error.message);
      switch (parsed.code) {
        case DOCUMENT_ERROR_CODES.DOCUMENT_FORMAT_UNSUPPORTED:
          return { error: 'Please upload a PDF or DOCX file' };
        case DOCUMENT_ERROR_CODES.DOCUMENT_TOO_LARGE:
          return { error: 'File must be under 10MB' };
      }
    }
    throw error;
  }
}
```

---

## Limits and Constraints

| Limit | Value | Reason |
|-------|-------|--------|
| Max file size | 10 MB | Memory constraints |
| Max pages (PDF) | 20 pages | Processing time |
| Max images | 50 per page | Output size |

Exceeding limits throws `Error` with appropriate `DOCUMENT_ERROR_CODES`.

---

## When to Use

- **YES:** Extracting text from user-uploaded contracts, invoices, resumes
- **YES:** Parsing generated reports from external systems
- **YES:** Indexing documents for search
- **NO:** Processing scanned images (use OCR first)
- **NO:** Password-protected documents
- **NO:** Complex layouts with heavy formatting (extraction is plain text)