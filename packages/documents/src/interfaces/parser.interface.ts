/**
 * Result of a successful document parse operation.
 */
export interface ParsedDocument {
  /** Extracted text content */
  text: string;
  /** Number of pages (if applicable, e.g. PDF) */
  pageCount?: number;
  /** Base64-encoded embedded images (optional) */
  images?: string[];
  /** Source document format */
  format: 'pdf' | 'docx' | 'doc';
}

/**
 * Contract for document parsers. Each parser handles one or more
 * document formats and exposes a capability check via `supports()`.
 */
export interface IDocumentParser {
  /**
   * Parses a document buffer and returns structured content.
   *
   * @param buffer - Raw document bytes
   * @returns Parsed document data
   */
  parse(buffer: Buffer): Promise<ParsedDocument>;
  /**
   * Indicates whether this parser can handle a given format.
   *
   * @param format - Document format string (e.g., 'pdf', 'docx')
   */
  supports(format: string): boolean;
}

/**
 * Standardized document error codes used across all parsers.
 */
export const DOCUMENT_ERROR_CODES = {
  DOCUMENT_PARSE_ERROR: 'DOCUMENT_PARSE_ERROR',
  DOCUMENT_EMPTY: 'DOCUMENT_EMPTY',
  DOCUMENT_TOO_LARGE: 'DOCUMENT_TOO_LARGE',
} as const;

/**
 * Union type of all recognized document error codes.
 */
export type DocumentErrorCode =
  | (typeof DOCUMENT_ERROR_CODES)[keyof typeof DOCUMENT_ERROR_CODES]
  | 'UNKNOWN_ERROR';
