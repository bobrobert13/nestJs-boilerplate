import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUsuarioDto {
  @ApiProperty({ example: 'John', description: 'First name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  apellido?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  /** New plain-text password. Will be hashed with argon2id before storage. */
  @ApiProperty({
    example: 'newSecurePass456',
    description: 'New password (min 8 chars)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  /** Update roles. Overwrites the entire array. */
  @ApiProperty({
    example: ['user', 'admin'],
    description: 'User roles for RBAC',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({
    example: true,
    description: 'Whether user is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
