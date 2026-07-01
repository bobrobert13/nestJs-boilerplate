import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { IDocumentParser, ParsedDocument } from '../interfaces/parser.interface';
import { DOCUMENT_ERROR_CODES } from '../interfaces/parser.interface';

const MAX_PAGES = 20;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Parses PDF documents and extracts their text content.
 *
 * Enforces size (max 10MB) and page count (max 20 pages) limits.
 * Uses `pdf-parse` under the hood.
 */
@Injectable()
export class PdfService implements IDocumentParser {
  /**
   * Parses a PDF buffer and extracts text content.
   *
   * @param buffer - Raw PDF file bytes
   * @returns Parsed document with text, page count, and format
   * @throws Error with code `DOCUMENT_TOO_LARGE` if file exceeds 10MB or 20 pages
   * @throws Error with code `DOCUMENT_EMPTY` if no text is found
   * @throws Error with code `DOCUMENT_PARSE_ERROR` on general parse failure
   */
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

  /**
   * Checks whether this parser supports the given document format.
   *
   * @param format - Document format string
   * @returns `true` if format is 'pdf'
   */
  supports(format: string): boolean {
    return format === 'pdf';
  }
}
