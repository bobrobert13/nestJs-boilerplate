import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { IDocumentParser, ParsedDocument } from '../interfaces/parser.interface';
import { DOCUMENT_ERROR_CODES } from '../interfaces/parser.interface';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Parses DOCX documents and extracts their text content.
 *
 * Enforces a maximum file size of 10MB. Uses `mammoth` under the hood.
 * Supports both `.docx` and legacy `.doc` formats.
 */
@Injectable()
export class DocxService implements IDocumentParser {
  /**
   * Parses a DOCX buffer and extracts text content.
   *
   * @param buffer - Raw DOCX/DOC file bytes
   * @returns Parsed document with text and format
   * @throws Error with code `DOCUMENT_TOO_LARGE` if file exceeds 10MB
   * @throws Error with code `DOCUMENT_EMPTY` if no text is found
   * @throws Error with code `DOCUMENT_PARSE_ERROR` on general parse failure
   */
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

  /**
   * Checks whether this parser supports the given document format.
   *
   * @param format - Document format string
   * @returns `true` if format is 'docx' or 'doc'
   */
  supports(format: string): boolean {
    return format === 'docx' || format === 'doc';
  }
}
