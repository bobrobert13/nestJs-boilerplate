import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import {
  IDocumentParser,
  ParsedDocument,
} from '../interfaces/parser.interface';
import { DOCUMENT_ERROR_CODES } from '../interfaces/parser.interface';

const MAX_PAGES = 20;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class PdfService implements IDocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new Error(
        JSON.stringify({
          code: DOCUMENT_ERROR_CODES.DOCUMENT_TOO_LARGE,
          message: `PDF exceeds maximum size of ${MAX_SIZE_BYTES / 1024 / 1024}MB`,
        }),
      );
    }

    try {
      const data = await pdfParse(buffer);
      const pageCount = data.numpages;

      if (pageCount > MAX_PAGES) {
        throw new Error(
          JSON.stringify({
            code: DOCUMENT_ERROR_CODES.DOCUMENT_TOO_LARGE,
            message: `PDF exceeds maximum page count of ${MAX_PAGES}`,
          }),
        );
      }

      if (!data.text || data.text.trim().length === 0) {
        throw new Error(
          JSON.stringify({
            code: DOCUMENT_ERROR_CODES.DOCUMENT_EMPTY,
            message: 'No text content found in PDF',
          }),
        );
      }

      return {
        text: data.text,
        pageCount: data.numpages,
        format: 'pdf',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        JSON.stringify({
          code: DOCUMENT_ERROR_CODES.DOCUMENT_PARSE_ERROR,
          message: 'Failed to parse PDF',
          details: { originalError: message },
        }),
      );
    }
  }

  supports(format: string): boolean {
    return format === 'pdf';
  }
}
