import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '@common/auth';
import { DynamicSchemaService } from './services/dynamic-schema.service';
import { SchemaRegistryService } from './services/schema-registry.service';
import {
  GenerateSchemaFromTextDto,
  GenerateSchemaFromImageDto,
  CompileSchemaDto,
  CompileDryRunDto,
  CompileFromJsonSchemaDto,
  CompileFromDslDto,
  InferFromCollectionDto,
  ExtractDocumentDto,
} from './dto/generate-schema.dto';
import { GeneratedSchema } from '@common/ai';

/**
 * PR5 / H2 / REQ-dynamic-schema-1 â€” class-level admin gate.
 * Non-admin callers receive HTTP 403 before any controller method runs.
 */
@ApiTags('dynamic-schema')
@ApiBearerAuth()
@Controller('dynamic-schema')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DynamicSchemaController {
  constructor(
    private readonly _dynamicSchemaService: DynamicSchemaService,
    private readonly _registry: SchemaRegistryService,
  ) {}

  @Post('extract')
  @ApiOperation({
    summary: 'Extract text content from a document (PDF/DOCX)',
    description:
      'Accepts a base64-encoded document and returns extracted plain-text content. Supports PDF and DOCX formats.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document content extracted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid document or format' })
  @HttpCode(HttpStatus.OK)
  async extractDocument(@Body() dto: ExtractDocumentDto) {
    const buffer = Buffer.from(dto.document, 'base64');
    const result = await this._dynamicSchemaService.extractDocument(
      buffer,
      dto.format,
    );
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return result;
  }

  @Post('generate-from-text')
  @ApiOperation({
    summary: 'Generate a Mongoose schema from plain-text description',
    description:
      'Takes arbitrary text (e.g. a document description or field list) and uses AI to infer a structured Mongoose schema definition.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to generate schema from text',
  })
  @HttpCode(HttpStatus.OK)
  async generateSchemaFromText(@Body() dto: GenerateSchemaFromTextDto) {
    const result = await this._dynamicSchemaService.generateSchemaFromText(
      dto.text,
      dto.provider,
      dto.temperature,
    );
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return {
      schema: result.generatedSchema,
      collectionName: result.collectionName,
    };
  }

  @Post('generate-from-image')
  @ApiOperation({
    summary: 'Generate a Mongoose schema from image data',
    description:
      'Accepts base64-encoded image data and uses vision-capable AI providers to extract structured schema definitions from visual layouts (forms, tables, diagrams).',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema generated successfully from image',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to generate schema from image',
  })
  @HttpCode(HttpStatus.OK)
  async generateSchemaFromImage(@Body() dto: GenerateSchemaFromImageDto) {
    const result = await this._dynamicSchemaService.generateSchemaFromImage(
      dto.imageData,
      dto.provider,
      dto.temperature,
    );
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return {
      schema: result.generatedSchema,
      collectionName: result.collectionName,
    };
  }

  @Post('compile')
  @ApiOperation({
    summary: 'Compile a GeneratedSchema and register the Mongoose model',
    description:
      'Validates the AI-generated schema structure, compiles it into a Mongoose model, and registers it in the schema registry for dynamic CRUD operations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema compiled and registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Schema compilation failed' })
  @HttpCode(HttpStatus.OK)
  async compileSchema(@Body() dto: CompileSchemaDto) {
    const result = await this._dynamicSchemaService.compileSchema(
      dto.schema as GeneratedSchema,
      dto.collectionName,
    );
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return {
      collectionName: result.collectionName,
      success: true,
    };
  }

  @Post('pipeline')
  @ApiOperation({
    summary:
      'Run the full pipeline: extract document, generate schema, and compile',
    description:
      'End-to-end pipeline that extracts text from a base64-encoded document (PDF/DOCX), feeds it to AI for schema generation, compiles the result, and registers the Mongoose model.',
  })
  @ApiConsumes('application/json')
  @ApiResponse({
    status: 200,
    description:
      'Pipeline completed: document extracted, schema generated, and model registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Pipeline failed at one or more stages',
  })
  @HttpCode(HttpStatus.OK)
  async fullPipeline(
    @Body()
    dto: ExtractDocumentDto & { provider?: string; temperature?: number },
  ) {
    const buffer = Buffer.from(dto.document, 'base64');
    const result = await this._dynamicSchemaService.fullPipeline(
      buffer,
      dto.format,
      dto.provider,
      dto.temperature,
    );
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return {
      documentContent: result.documentContent,
      schema: result.generatedSchema,
      collectionName: result.collectionName,
    };
  }

  // -------- Lifecycle endpoints --------

  @Get('schemas')
  @ApiOperation({
    summary: 'List all registered dynamic schemas',
    description:
      'Returns metadata for every schema currently registered in the dynamic schema registry, including collection names and field hashes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of registered schema metadata entries',
  })
  @HttpCode(HttpStatus.OK)
  async listSchemas() {
    const schemas = await this._registry.list();
    return { schemas };
  }

  @Delete('schemas/:collectionName')
  @ApiOperation({
    summary: 'Unregister a dynamic schema by collection name',
    description:
      'Removes a previously registered dynamic schema from the registry. Does not drop the underlying MongoDB collection.',
  })
  @ApiParam({
    name: 'collectionName',
    type: String,
    description: 'Collection name of the registered schema to unregister',
    example: 'my_collection',
  })
  @ApiResponse({ status: 200, description: 'Schema unregistered successfully' })
  @ApiResponse({ status: 404, description: 'Schema not found in registry' })
  @HttpCode(HttpStatus.OK)
  async unregisterSchema(@Param('collectionName') collectionName: string) {
    const result = await this._registry.unregister(collectionName);
    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
    return { success: true, collectionName };
  }

  @Post('compile/dry-run')
  @ApiOperation({
    summary: 'Validate a GeneratedSchema without registering it',
    description:
      'Dry-run schema compilation: checks the generated schema for structural validity and normalizes it, but does not register a Mongoose model.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema is valid; normalized schema returned',
  })
  @ApiResponse({ status: 400, description: 'Schema validation errors' })
  @HttpCode(HttpStatus.OK)
  async compileDryRun(@Body() dto: CompileDryRunDto) {
    const result = await this._dynamicSchemaService.compileSchema(
      dto.schema as GeneratedSchema,
      dto.collectionName,
      true,
    );
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return {
      valid: true,
      normalizedSchema: result.generatedSchema,
      collectionName: result.collectionName,
    };
  }

  @Post('compile-from-json-schema')
  @ApiOperation({
    summary: 'Compile from a JSON Schema draft-07 document',
    description:
      'Accepts a standard JSON Schema (draft-07) definition and converts it into a compiled Mongoose model registered in the dynamic schema registry.',
  })
  @ApiResponse({
    status: 200,
    description: 'JSON Schema compiled and model registered',
  })
  @ApiResponse({
    status: 400,
    description: 'JSON Schema invalid or compilation error',
  })
  @HttpCode(HttpStatus.OK)
  async compileFromJsonSchema(@Body() dto: CompileFromJsonSchemaDto) {
    const result = await this._dynamicSchemaService.compileFromJsonSchema({
      jsonSchema: dto.jsonSchema,
      collectionName: dto.collectionName,
    });
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return {
      schema: result.generatedSchema,
      collectionName: result.collectionName,
      fieldsHash: result.fieldsHash,
      idempotent: result.idempotent,
    };
  }

  @Post('compile-from-dsl')
  @ApiOperation({
    summary: 'Compile from a declarative DSL string',
    description:
      'Parses a lightweight DSL string describing field definitions and compiles it into a registered Mongoose model.',
  })
  @ApiResponse({
    status: 200,
    description: 'DSL compiled and model registered',
  })
  @ApiResponse({
    status: 400,
    description: 'DSL parse error or compilation error',
  })
  @HttpCode(HttpStatus.OK)
  async compileFromDsl(@Body() dto: CompileFromDslDto) {
    const result = await this._dynamicSchemaService.compileFromDsl({
      dsl: dto.dsl,
    });
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    return {
      schema: result.generatedSchema,
      collectionName: result.collectionName,
      fieldsHash: result.fieldsHash,
      idempotent: result.idempotent,
    };
  }

  @Post('infer-from-collection/:collectionName')
  @ApiOperation({
    summary: 'Infer a schema from an existing MongoDB collection',
    description:
      'Samples documents from the specified collection and uses AI to infer a Mongoose schema definition, which is then compiled and registered.',
  })
  @ApiParam({
    name: 'collectionName',
    type: String,
    description: 'Name of the existing MongoDB collection to infer schema from',
    example: 'users',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema inferred from collection and registered',
  })
  @ApiResponse({ status: 404, description: 'Collection not found in database' })
  @ApiResponse({ status: 400, description: 'Inference or compilation error' })
  @HttpCode(HttpStatus.OK)
  async inferFromCollection(
    @Param('collectionName') collectionName: string,
    @Body() dto: InferFromCollectionDto,
  ) {
    const result = await this._dynamicSchemaService.inferFromCollection({
      collectionName,
      sampleSize: dto.sampleSize,
    });
    if (!result.success) {
      const status = (result.error ?? '').startsWith('COLLECTION_NOT_FOUND')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      if (status === HttpStatus.NOT_FOUND) {
        throw new NotFoundException(result.error);
      }
      throw new BadRequestException(result.error);
    }
    return {
      schema: result.generatedSchema,
      collectionName: result.collectionName,
      fieldsHash: result.fieldsHash,
      idempotent: result.idempotent,
    };
  }
}
