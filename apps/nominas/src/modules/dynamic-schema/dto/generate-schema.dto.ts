import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSchemaFromTextDto {
  @ApiProperty({
    description: 'The text content to analyze and generate a schema from',
    example:
      'User registration form with fields: name (string), email (string), age (number), isActive (boolean)',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Provider name for AI schema generation',
    example: 'openai',
    default: 'openai',
  })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({
    description: 'Temperature for AI generation',
    minimum: 0,
    maximum: 1,
    default: 0.3,
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;
}

export class GenerateSchemaFromImageDto {
  @ApiProperty({
    description: 'Base64 encoded image data or image URL',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  })
  @IsString()
  @IsNotEmpty()
  imageData: string;

  @ApiPropertyOptional({
    description: 'Provider name for AI schema generation',
    example: 'openai',
    default: 'openai',
  })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({
    description: 'Temperature for AI generation',
    minimum: 0,
    maximum: 1,
    default: 0.3,
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;
}

export class CompileSchemaDto {
  @ApiProperty({
    description: 'The generated schema to compile',
    example: {
      fields: [
        { name: 'email', type: 'string', required: true },
        { name: 'age', type: 'number', required: false },
      ],
      collectionName: 'users',
      metadata: {},
    },
  })
  @IsNotEmpty()
  schema: any;

  @ApiProperty({
    description: 'Collection name for the schema',
    example: 'users',
  })
  @IsString()
  @IsNotEmpty()
  collectionName: string;
}

export class ExtractDocumentDto {
  @ApiProperty({
    description: 'Base64 encoded document',
  })
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    description: 'Document format',
    enum: ['pdf', 'docx', 'doc'],
    example: 'pdf',
  })
  @IsString()
  @IsNotEmpty()
  format: string;
}
