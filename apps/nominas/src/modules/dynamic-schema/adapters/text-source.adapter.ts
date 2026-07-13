import { Injectable } from '@nestjs/common';
import { AiService, GeneratedSchema } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import { SourceAdapter, AdapterContext, AdapterValidation } from './source-adapter.interface';

export interface TextSourceInput {
  text: string;
}

@Injectable()
export class TextSourceAdapter implements SourceAdapter<TextSourceInput> {
  readonly source = SchemaSource.Text;
  constructor(private readonly ai: AiService) {}

  validate(input: TextSourceInput): AdapterValidation {
    const errors: string[] = [];
    if (typeof input?.text !== "string" || input.text.trim() === "") {
      errors.push("text is required");
    }
    return { valid: errors.length === 0, errors };
  }

  async convert(input: TextSourceInput, context: AdapterContext): Promise<GeneratedSchema> {
    const v = this.validate(input);
    if (!v.valid) throw new Error("SCHEMA_VALIDATION_ERROR: " + v.errors.join("; "));
    const resp = await this.ai.generateSchemaFromText(context.provider ?? "openai", input.text, { temperature: context.temperature });
    if (!resp.success || !resp.data) throw new Error(resp.error || "SCHEMA_GENERATION_ERROR");
    return resp.data;
  }
}