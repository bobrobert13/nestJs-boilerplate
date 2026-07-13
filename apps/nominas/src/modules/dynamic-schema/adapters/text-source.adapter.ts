import { Injectable } from '@nestjs/common';
import { AiService, GeneratedSchema } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import {
  SourceAdapter,
  AdapterContext,
  AdapterValidation,
} from './source-adapter.interface';

export interface TextSourceInput {
  text: string;
}

@Injectable()
export class TextSourceAdapter implements SourceAdapter<TextSourceInput> {
  readonly source = SchemaSource.Text;
  /**
   * Injected dependencies.
   */
  constructor(private readonly _ai: AiService) {}

  /**
   * validate method.
   */
  validate(input: TextSourceInput): AdapterValidation {
    const errors: string[] = [];
    /**
     * if method.
     */
    if (typeof input?.text !== 'string' || input.text.trim() === '') {
      errors.push('text is required');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * convert method.
   */
  async convert(
    input: TextSourceInput,
    context: AdapterContext,
  ): Promise<GeneratedSchema> {
    const v = this.validate(input);
    /**
     * if method.
     */
    if (!v.valid)
      throw new Error('SCHEMA_VALIDATION_ERROR: ' + v.errors.join('; '));
    const resp = await this._ai.generateSchemaFromText(
      context.provider ?? 'openai',
      input.text,
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
