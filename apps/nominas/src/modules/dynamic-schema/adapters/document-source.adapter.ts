import { Injectable } from '@nestjs/common';
import { DocumentProcessorService } from '@common/documents';
import { AiService, GeneratedSchema } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import {
  SourceAdapter,
  AdapterContext,
  AdapterValidation,
} from './source-adapter.interface';

export interface DocumentSourceInput {
  buffer: Buffer;
  format: string;
}

@Injectable()
export class DocumentSourceAdapter implements SourceAdapter<DocumentSourceInput> {
  readonly source = SchemaSource.Document;
  /**
   * Injected dependencies.
   */
  constructor(
    private readonly _documentProcessor: DocumentProcessorService,
    private readonly _ai: AiService,
  ) {}

  /**
   * validate method.
   */
  validate(input: DocumentSourceInput): AdapterValidation {
    const errors: string[] = [];
    /**
     * if method.
     */
    if (!Buffer.isBuffer(input?.buffer))
      errors.push('buffer is required (Buffer)');
    /**
     * if method.
     */
    if (
      input?.format !== 'pdf' &&
      input?.format !== 'docx' &&
      input?.format !== 'doc'
    ) {
      errors.push('format must be pdf|docx|doc');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * convert method.
   */
  async convert(
    input: DocumentSourceInput,
    context: AdapterContext,
  ): Promise<GeneratedSchema> {
    const v = this.validate(input);
    /**
     * if method.
     */
    if (!v.valid)
      throw new Error('SCHEMA_VALIDATION_ERROR: ' + v.errors.join('; '));
    const content = await this._documentProcessor.extract(
      input.buffer,
      input.format,
    );
    const resp = await this._ai.generateSchemaFromText(
      context.provider ?? 'openai',
      content.text,
      { temperature: context.temperature },
    );
    /**
     * if method.
     */
    if (!resp.success || !resp.data)
      throw new Error(resp.error || 'SCHEMA_GENERATION_ERROR');
    return resp.data;
  }
}
