export interface ParsedDocument {
  text: string;
  pageCount?: number;
  images?: string[];
  format: 'pdf' | 'docx' | 'doc';
}

export interface IDocumentParser {
  parse(buffer: Buffer): Promise<ParsedDocument>;
  supports(format: string): boolean;
}

export const DOCUMENT_ERROR_CODES = {
  DOCUMENT_PARSE_ERROR: 'DOCUMENT_PARSE_ERROR',
  DOCUMENT_EMPTY: 'DOCUMENT_EMPTY',
  DOCUMENT_TOO_LARGE: 'DOCUMENT_TOO_LARGE',
} as const;

export type DocumentErrorCode =
  | typeof DOCUMENT_ERROR_CODES[keyof typeof DOCUMENT_ERROR_CODES]
  | 'UNKNOWN_ERROR';
