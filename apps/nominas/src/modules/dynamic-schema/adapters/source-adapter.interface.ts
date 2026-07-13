import { GeneratedSchema } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';

export interface AdapterContext {
  provider?: string;
  temperature?: number;
  registeredBy?: string;
}

export interface AdapterValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Strategy interface for source adapters. Each adapter accepts its own
 * input type T and produces a GeneratedSchema (or throws a structured
 * error with one of the standardized codes). The SourceAdapter is a thin
 * shell — the heavy lifting (AI, parsing, etc) lives in injected services.
 */
export interface SourceAdapter<T = unknown> {
  readonly source: SchemaSource;
  validate(input: T): AdapterValidation;
  convert(input: T, context: AdapterContext): Promise<GeneratedSchema>;
}
