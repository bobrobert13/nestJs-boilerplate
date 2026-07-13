import { Injectable } from '@nestjs/common';
import { AiService, GeneratedSchema } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import { SourceAdapter, AdapterContext, AdapterValidation } from './source-adapter.interface';

export interface ImageSourceInput {
  imageData: string;
}

@Injectable()
export class ImageSourceAdapter implements SourceAdapter<ImageSourceInput> {
  readonly source = SchemaSource.Image;
  constructor(private readonly ai: AiService) {}

  validate(input: ImageSourceInput): AdapterValidation {
    const errors: string[] = [];
    if (typeof input?.imageData !== "string" || input.imageData.length === 0) {
      errors.push("imageData is required (base64 string or URL)");
    }
    return { valid: errors.length === 0, errors };
  }

  async convert(input: ImageSourceInput, context: AdapterContext): Promise<GeneratedSchema> {
    const v = this.validate(input);
    if (!v.valid) throw new Error("SCHEMA_VALIDATION_ERROR: " + v.errors.join("; "));
    const resp = await this.ai.generateSchemaFromImage(context.provider ?? "openai", input.imageData, { temperature: context.temperature });
    if (!resp.success || !resp.data) throw new Error(resp.error || "SCHEMA_GENERATION_ERROR");
    return resp.data;
  }
}