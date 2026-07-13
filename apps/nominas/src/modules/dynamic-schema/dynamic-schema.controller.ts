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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { DynamicSchemaService } from './services/dynamic-schema.service';
import { SchemaRegistryService } from './services/schema-registry.service';
import {
  GenerateSchemaFromTextDto,
  GenerateSchemaFromImageDto,
  CompileSchemaDto,
  ExtractDocumentDto,
} from './dto/generate-schema.dto';
import { GeneratedSchema } from '@common/ai';
import { DocumentContent } from '@common/documents';

@ApiTags('dynamic-schema')
@Controller('dynamic-schema')
export class DynamicSchemaController {
  constructor(
    private readonly dynamicSchemaService: DynamicSchemaService,
    private readonly registry: SchemaRegistryService,
  ) {}

  @Post('extract')
  @ApiOperation({ summary: 'Extract text content from a document (PDF/DOCX)' })
  @ApiResponse({
    status: 200,
    description: 'Document content extracted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid document or format' })
  @HttpCode(HttpStatus.OK)
  async extractDocument(@Body() dto: ExtractDocumentDto) {
    const buffer = Buffer.from(dto.document, 'base64');
    const result = await this.dynamicSchemaService.extractDocument(
      buffer,
      dto.format,
    );

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return result;
  }

  @Post('generate-from-text')
  @ApiOperation({ summary: 'Generate schema from text content' })
  @ApiResponse({
    status: 200,
    description: 'Schema generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to generate schema' })
  @HttpCode(HttpStatus.OK)
  async generateSchemaFromText(@Body() dto: GenerateSchemaFromTextDto) {
    const result = await this.dynamicSchemaService.generateSchemaFromText(
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
  @ApiOperation({ summary: 'Generate schema from image data' })
  @ApiResponse({
    status: 200,
    description: 'Schema generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to generate schema' })
  @HttpCode(HttpStatus.OK)
  async generateSchemaFromImage(@Body() dto: GenerateSchemaFromImageDto) {
    const result = await this.dynamicSchemaService.generateSchemaFromImage(
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
  @ApiOperation({ summary: 'Compile a schema and register it' })
  @ApiResponse({
    status: 200,
    description: 'Schema compiled successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to compile schema' })
  @HttpCode(HttpStatus.OK)
  async compileSchema(@Body() dto: CompileSchemaDto) {
    const result = await this.dynamicSchemaService.compileSchema(
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
    summary: 'Run full pipeline: extract document → generate schema → compile',
  })
  @ApiConsumes('application/json')
  @ApiResponse({
    status: 200,
    description: 'Pipeline completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Pipeline failed' })
  @HttpCode(HttpStatus.OK)
  async fullPipeline(
    @Body()
    dto: ExtractDocumentDto & { provider?: string; temperature?: number },
  ) {
    const buffer = Buffer.from(dto.document, 'base64');
    const result = await this.dynamicSchemaService.fullPipeline(
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

  // ───────── Lifecycle endpoints (added in dynamic-schema-pipeline-hardening) ─────────

  @Get('schemas')
  @ApiOperation({ summary: 'List all registered dynamic schemas' })
  @ApiResponse({
    status: 200,
    description: 'Returns metadata of all registered schemas',
  })
  @HttpCode(HttpStatus.OK)
  async listSchemas() {
    const schemas = await this.registry.list();
    return { schemas };
  }

  @Delete('schemas/:collectionName')
  @ApiOperation({ summary: 'Unregister a dynamic schema' })
  @ApiResponse({ status: 200, description: 'Schema unregistered' })
  @ApiResponse({ status: 404, description: 'Schema not found' })
  @HttpCode(HttpStatus.OK)
  async unregisterSchema(@Param('collectionName') collectionName: string) {
    const result = await this.registry.unregister(collectionName);
    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
    return { success: true, collectionName };
  }
}
