import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'John', description: 'First name', required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Doe', description: 'Last name', required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** Plain-text password. Will be hashed with argon2id before storage. */
  @ApiProperty({
    example: 'securePass123',
    description: 'Password (min 8 chars)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  /** Initial roles. Defaults to ['user'] in the schema. Only provide ['admin'] for admin accounts. */
  @ApiProperty({
    example: ['user'],
    description: 'User roles for RBAC',
    required: false,
  })
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
}
