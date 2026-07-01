/**
 * Supported document formats for parsing.
 */
export type DocumentFormat = 'pdf' | 'docx' | 'doc';

/**
 * Structured content extracted from a parsed document.
 */
export interface DocumentContent {
  /** Extracted plain text */
  text: string;
  /** Base64-encoded embedded images (optional) */
  images?: string[];
  /** Total number of pages in the source document */
  pageCount: number;
  /** Original document format */
  format: DocumentFormat;
}

/**
 * Error shape for document processing failures.
 */
export interface DocumentError {
  /** Machine-readable error code (e.g. DOCUMENT_PARSE_ERROR) */
  code: string;
  /** Human-readable error description */
  message: string;
  /** Additional error context */
  details?: Record<string, unknown>;
}
