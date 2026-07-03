import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UsuarioRole } from '../enums/usuario-role.enum';

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

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({
    type: [String],
    enum: UsuarioRole,
    example: [UsuarioRole.User],
    description:
      'Roles to assign. Defaults to ["user"] when omitted (the typical self-service registration case).',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(UsuarioRole, { each: true })
  roles?: UsuarioRole[];
}
