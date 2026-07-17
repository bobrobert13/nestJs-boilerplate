import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Plain-text password (min 8 characters)',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Display name for the user',
  })
  @IsString()
  @IsOptional()
  name?: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'demo@example.com',
    description: 'Registered email address',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'demo123',
    description: 'Account password',
    format: 'password',
  })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'Valid refresh token JWT',
  })
  @IsString()
  refreshToken: string;
}

export class MagicLinkRequestDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email to send the magic link to',
    format: 'email',
  })
  @IsEmail()
  email: string;
}

export class MagicLinkVerifyDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Magic link token received via email',
  })
  @IsString()
  token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address to send password reset link',
    format: 'email',
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'newSecurePass456',
    description: 'New password (min 8 characters)',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
