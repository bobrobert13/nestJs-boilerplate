import { Injectable } from '@nestjs/common';
import { DocumentProcessorService } from '@common/documents';
import { AiService, GeneratedSchema } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import { SourceAdapter, AdapterContext, AdapterValidation } from './source-adapter.interface';

export interface DocumentSourceInput {
  buffer: Buffer;
  format: string;
}

@Injectable()
export class DocumentSourceAdapter implements SourceAdapter<DocumentSourceInput> {
  readonly source = SchemaSource.Document;
  constructor(
    private readonly documentProcessor: DocumentProcessorService,
    private readonly ai: AiService,
  ) {}

  validate(input: DocumentSourceInput): AdapterValidation {
    const errors: string[] = [];
    if (!Buffer.isBuffer(input?.buffer)) errors.push("buffer is required (Buffer)");
    if (input?.format !== "pdf" && input?.format !== "docx" && input?.format !== "doc") {
      errors.push("format must be pdf|docx|doc");
    }
    return { valid: errors.length === 0, errors };
  }

  async convert(input: DocumentSourceInput, context: AdapterContext): Promise<GeneratedSchema> {
    const v = this.validate(input);
    if (!v.valid) throw new Error("SCHEMA_VALIDATION_ERROR: " + v.errors.join("; "));
    const content = await this.documentProcessor.extract(input.buffer, input.format);
    const resp = await this.ai.generateSchemaFromText(context.provider ?? "openai", content.text, { temperature: context.temperature });
    if (!resp.success || !resp.data) throw new Error(resp.error || "SCHEMA_GENERATION_ERROR");
    return resp.data;
  }
}