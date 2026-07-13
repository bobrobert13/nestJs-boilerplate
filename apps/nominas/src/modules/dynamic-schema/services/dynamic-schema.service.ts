import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '@common/ai';
import { DocumentProcessorService, DocumentContent } from '@common/documents';
import { GeneratedSchema } from '@common/ai';
import { SchemaCompilerService } from './schema-compiler.service';

export interface PipelineResult {
  success: boolean;
  documentContent?: DocumentContent;
  generatedSchema?: GeneratedSchema;
  collectionName?: string;
  error?: string;
}

@Injectable()
export class DynamicSchemaService {
  private readonly logger = new Logger(DynamicSchemaService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly documentProcessor: DocumentProcessorService,
    private readonly schemaCompiler: SchemaCompilerService,
  ) {}

  async generateSchemaFromText(
    text: string,
    provider?: string,
    temperature?: number,
  ): Promise<PipelineResult> {
    try {
      this.logger.log('Generating schema from text...');

      const result = await this.aiService.generateSchemaFromText(
        provider || 'openai',
        text,
        { temperature },
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'SCHEMA_GENERATION_ERROR',
        };
      }

      const schema = result.data as GeneratedSchema;

      if (!schema.fields || !Array.isArray(schema.fields)) {
        return {
          success: false,
          error: 'SCHEMA_GENERATION_ERROR: Invalid schema format returned',
        };
      }

      return {
        success: true,
        generatedSchema: schema,
        collectionName: schema.collectionName,
      };
    } catch (error) {
      this.logger.error('Error generating schema from text', error);
      return {
        success: false,
        error: `SCHEMA_GENERATION_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async generateSchemaFromImage(
    imageData: string,
    provider?: string,
    temperature?: number,
  ): Promise<PipelineResult> {
    try {
      this.logger.log('Generating schema from image...');

      const result = await this.aiService.generateSchemaFromImage(
        provider || 'openai',
        imageData,
        { temperature },
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'SCHEMA_GENERATION_ERROR',
        };
      }

      const schema = result.data as GeneratedSchema;

      if (!schema.fields || !Array.isArray(schema.fields)) {
        return {
          success: false,
          error: 'SCHEMA_GENERATION_ERROR: Invalid schema format returned',
        };
      }

      return {
        success: true,
        generatedSchema: schema,
        collectionName: schema.collectionName,
      };
    } catch (error) {
      this.logger.error('Error generating schema from image', error);
      return {
        success: false,
        error: `SCHEMA_GENERATION_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async extractDocument(
    documentBuffer: Buffer,
    format: string,
  ): Promise<PipelineResult> {
    try {
      this.logger.log(`Extracting document content (format: ${format})...`);

      const content = await this.documentProcessor.extract(documentBuffer, format);

      return {
        success: true,
        documentContent: content,
      };
    } catch (error) {
      this.logger.error('Error extracting document', error);
      let errorCode = 'DOCUMENT_PARSE_ERROR';
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          errorCode = parsed.code || errorCode;
        } catch {
          // Not JSON error
        }
      }
      return {
        success: false,
        error: errorCode,
      };
    }
  }

  async compileSchema(
    schema: GeneratedSchema,
    collectionName: string,
  ): Promise<PipelineResult> {
    try {
      this.logger.log(`Compiling schema for collection: ${collectionName}...`);

      const result = this.schemaCompiler.compileAndRegister(schema, collectionName);
      if (!result.success) {
        return { success: false, error: (result.errors || []).join('; ') };
      }
      return {
        success: true,
        generatedSchema: schema,
        collectionName: result.collectionName,
      };
    } catch (error) {
      this.logger.error('Error compiling schema', error);
      return {
        success: false,
        error: `SCHEMA_COMPILATION_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async fullPipeline(
    documentBuffer: Buffer,
    format: string,
    provider?: string,
    temperature?: number,
  ): Promise<PipelineResult> {
    try {
      // Step 1: Extract document
      const extractResult = await this.extractDocument(documentBuffer, format);
      if (!extractResult.success) {
        return extractResult;
      }

      const documentContent = extractResult.documentContent!;

      // Step 2: Generate schema from text
      const schemaResult = await this.generateSchemaFromText(
        documentContent.text,
        provider,
        temperature,
      );

      if (!schemaResult.success) {
        return schemaResult;
      }

      const schema = schemaResult.generatedSchema!;

      // Step 3: Compile schema
      const compileResult = await this.compileSchema(schema, schema.collectionName);
      if (!compileResult.success) {
        return compileResult;
      }

      return {
        success: true,
        documentContent,
        generatedSchema: schema,
        collectionName: schema.collectionName,
      };
    } catch (error) {
      this.logger.error('Error in full pipeline', error);
      return {
        success: false,
        error: `Pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
