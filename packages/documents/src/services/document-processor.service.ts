import { Injectable } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { DocxService } from './docx.service';
import { DocumentContent } from '../types/document.types';
import { IDocumentParser } from '../interfaces/parser.interface';
import { DOCUMENT_ERROR_CODES } from '../interfaces/parser.interface';

/**
 * Orchestrates document text extraction by auto-selecting the appropriate
 * parser (PDF or DOCX) based on the format parameter.
 *
 * Aggregates all available `IDocumentParser` implementations and delegates
 * to the first one that supports the requested format.
 */
@Injectable()
export class DocumentProcessorService {
  private readonly parsers: IDocumentParser[];

  constructor(
    private readonly pdfService: PdfService,
    private readonly docxService: DocxService,
  ) {
    this.parsers = [this.pdfService, this.docxService];
  }

  /**
   * Extracts text content from a document buffer.
   *
   * @param buffer - Raw document bytes (PDF or DOCX)
   * @param format - Document format identifier ('pdf', 'docx', or 'doc')
   * @returns Structured document content with text and metadata
   * @throws Error with code `DOCUMENT_PARSE_ERROR` if the format is unsupported or parsing fails
   */
  async extract(buffer: Buffer, format: string): Promise<DocumentContent> {
    const parser = this.parsers.find((p) => p.supports(format));

    if (!parser) {
      throw new Error(
        JSON.stringify({
          code: DOCUMENT_ERROR_CODES.DOCUMENT_PARSE_ERROR,
          message: `Unsupported document format: ${format}`,
        }),
      );
    }

    try {
      const result = await parser.parse(buffer);
      return {
        text: result.text,
        pageCount: result.pageCount ?? 1,
        images: result.images,
        format: result.format as DocumentContent['format'],
      };
    } catch (error) {
      if (error instanceof Error) {
        try {
          const parsedError = JSON.parse(error.message);
          throw error;
        } catch {
          throw new Error(
            JSON.stringify({
              code: DOCUMENT_ERROR_CODES.DOCUMENT_PARSE_ERROR,
              message: error.message,
            }),
          );
        }
      }
      throw error;
    }
  }
}
