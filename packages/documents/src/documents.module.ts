import { Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { DocxService } from './services/docx.service';
import { DocumentProcessorService } from './services/document-processor.service';

@Module({
  providers: [PdfService, DocxService, DocumentProcessorService],
  exports: [PdfService, DocxService, DocumentProcessorService],
})
export class DocumentsModule {}
