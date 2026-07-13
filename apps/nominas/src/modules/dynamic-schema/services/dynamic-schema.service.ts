import { Injectable, Logger } from '@nestjs/common';
import { DocumentContent, DocumentProcessorService } from '@common/documents';
import { GeneratedSchema } from '@common/ai';
import { SchemaCompilerService } from './schema-compiler.service';
import { SchemaRegistryService } from './schema-registry.service';
import { TextSourceAdapter } from '../adapters/text-source.adapter';
import { ImageSourceAdapter } from '../adapters/image-source.adapter';
import { DocumentSourceAdapter } from '../adapters/document-source.adapter';
import { JsonSchemaSourceAdapter, JsonSchemaInput } from '../adapters/json-schema-source.adapter';
import { DslSourceAdapter, DslInput } from '../adapters/dsl-source.adapter';
import { MongoInferenceSourceAdapter, MongoInferenceInput } from '../adapters/mongo-inference-source.adapter';
import { SchemaSource } from '../interfaces/schema-source.enum';

export interface PipelineResult {
  success: boolean;
  documentContent?: DocumentContent;
  generatedSchema?: GeneratedSchema;
  collectionName?: string;
  fieldsHash?: string;
  idempotent?: boolean;
  error?: string;
}

/**
 * Orchestrates the dynamic-schema pipeline. Source adapters implement
 * Strategy pattern via SourceAdapter<T>. SchemaCompilerService handles
 * validation + Mongoose model registration. SchemaRegistryService handles
 * persistence + rehydration.
 */
@Injectable()
export class DynamicSchemaService {
  private readonly logger = new Logger(DynamicSchemaService.name);

  constructor(
    private readonly textAdapter: TextSourceAdapter,
    private readonly imageAdapter: ImageSourceAdapter,
    private readonly documentAdapter: DocumentSourceAdapter,
    private readonly jsonSchemaAdapter: JsonSchemaSourceAdapter,
    private readonly dslAdapter: DslSourceAdapter,
    private readonly inferenceAdapter: MongoInferenceSourceAdapter,
    private readonly compiler: SchemaCompilerService,
    private readonly registry: SchemaRegistryService,
    private readonly documentProcessor: DocumentProcessorService,
  ) {}
  // ───────── Source → Schema (no compile, no persist) ─────────

  async generateSchemaFromText(text: string, provider?: string, temperature?: number): Promise<PipelineResult> {
    try {
      const schema = await this.textAdapter.convert({ text }, { provider, temperature });
      return { success: true, generatedSchema: schema, collectionName: schema.collectionName };
    } catch (err) {
      return this.toErrorResult(err, "SCHEMA_GENERATION_ERROR");
    }
  }

  async generateSchemaFromImage(imageData: string, provider?: string, temperature?: number): Promise<PipelineResult> {
    try {
      const schema = await this.imageAdapter.convert({ imageData }, { provider, temperature });
      return { success: true, generatedSchema: schema, collectionName: schema.collectionName };
    } catch (err) {
      return this.toErrorResult(err, "SCHEMA_GENERATION_ERROR");
    }
  }

  async extractDocument(buffer: Buffer, format: string): Promise<PipelineResult> {
    try {
      const content = await this.documentProcessor.extract(buffer, format);
      return { success: true, documentContent: content };
    } catch (err) {
      let code = "DOCUMENT_PARSE_ERROR";
      if (err instanceof Error) {
        try { const p = JSON.parse(err.message); code = p.code || code; } catch { /* not JSON */ }
      }
      return { success: false, error: code };
    }
  }

  // ───────── Compile paths (persist + register) ─────────

  async compileSchema(schema: GeneratedSchema, collectionName: string, dryRun = false): Promise<PipelineResult> {
    const result = this.compiler.compileAndRegister(schema, collectionName, { dryRun });
    if (!result.success) return { success: false, error: (result.errors || []).join("; ") };
    if (dryRun) return { success: true, generatedSchema: result.normalizedSchema, collectionName: result.collectionName };
    const persisted = await this.registry.register(result.normalizedSchema ?? schema, { source: SchemaSource.Manual });
    if (!persisted.ok) return { success: false, error: persisted.errors.join("; ") };
    return {
      success: true,
      generatedSchema: result.normalizedSchema,
      collectionName: result.collectionName,
      fieldsHash: persisted.fieldsHash,
      idempotent: persisted.idempotent,
    };
  }

  async compileFromJsonSchema(input: JsonSchemaInput): Promise<PipelineResult> {
    try {
      const schema = await this.jsonSchemaAdapter.convert(input, {});
      return await this.compileSchema(schema, schema.collectionName);
    } catch (err) {
      return this.toErrorResult(err, "SCHEMA_GENERATION_ERROR");
    }
  }

  async compileFromDsl(input: DslInput): Promise<PipelineResult> {
    try {
      const schema = await this.dslAdapter.convert(input, {});
      return await this.compileSchema(schema, schema.collectionName);
    } catch (err) {
      return this.toErrorResult(err, "DSL_PARSE_ERROR");
    }
  }

  async inferFromCollection(input: MongoInferenceInput): Promise<PipelineResult> {
    try {
      const schema = await this.inferenceAdapter.convert(input, {});
      return await this.compileSchema(schema, schema.collectionName);
    } catch (err) {
      return this.toErrorResult(err, "INFERENCE_ERROR");
    }
  }

  // ───────── Pipeline (document → schema) ─────────

  async fullPipeline(buffer: Buffer, format: string, provider?: string, temperature?: number): Promise<PipelineResult> {
    try {
      const extractResult = await this.extractDocument(buffer, format);
      if (!extractResult.success) return extractResult;
      const generated = await this.generateSchemaFromText(extractResult.documentContent!.text, provider, temperature);
      if (!generated.success) return generated;
      return await this.compileSchema(generated.generatedSchema!, generated.collectionName!);
    } catch (err) {
      return this.toErrorResult(err, "Pipeline error");
    }
  }

  private toErrorResult(err: unknown, defaultCode: string): PipelineResult {
    if (err instanceof Error) {
      this.logger.error(defaultCode + ": " + err.message);
      return { success: false, error: err.message || defaultCode };
    }
    return { success: false, error: defaultCode };
  }
}