import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { IDocumentParser, ParsedDocument } from '../interfaces/parser.interface';
import { DOCUMENT_ERROR_CODES } from '../interfaces/parser.interface';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class DocxService implements IDocumentParser {
  async parse(buffer: Buffer): Promise<ParsedDocument> {
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new Error(
        JSON.stringify({
          code: DOCUMENT_ERROR_CODES.DOCUMENT_TOO_LARGE,
          message: `DOCX exceeds maximum size of ${MAX_SIZE_BYTES / 1024 / 1024}MB`,
        }),
      );
    }

    try {
      const result = await mammoth.extractRawText({ buffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error(
          JSON.stringify({
            code: DOCUMENT_ERROR_CODES.DOCUMENT_EMPTY,
            message: 'No text content found in DOCX',
          }),
        );
      }

      return {
        text: result.value,
        format: 'docx',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        JSON.stringify({
          code: DOCUMENT_ERROR_CODES.DOCUMENT_PARSE_ERROR,
          message: 'Failed to parse DOCX',
          details: { originalError: message },
        }),
      );
    }
  }

  supports(format: string): boolean {
    return format === 'docx' || format === 'doc';
  }
}
