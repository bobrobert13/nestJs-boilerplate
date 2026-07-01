import { Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { DocxService } from './services/docx.service';
import { DocumentProcessorService } from './services/document-processor.service';

/**
 * NestJS module providing document parsing capabilities.
 *
 * Exports services for extracting text from PDF and DOCX files:
 * - `PdfService` — PDF text extraction via pdf-parse
 * - `DocxService` — DOCX text extraction via mammoth
 * - `DocumentProcessorService` — Orchestrator that auto-selects the right parser
 */
@Module({
  providers: [PdfService, DocxService, DocumentProcessorService],
  exports: [PdfService, DocxService, DocumentProcessorService],
})
export class DocumentsModule {}
