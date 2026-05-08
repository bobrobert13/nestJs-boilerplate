export type DocumentFormat = 'pdf' | 'docx' | 'doc';

export interface DocumentContent {
  text: string;
  images?: string[];
  pageCount: number;
  format: DocumentFormat;
}

export interface DocumentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
