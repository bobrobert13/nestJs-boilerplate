import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RegisterPasskeyDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Human-readable username to associate with the passkey',
  })
  @IsString()
  username: string;
}

export class VerifyPasskeyDto {
  @ApiProperty({
    example: 'credential-id-abc123',
    description: 'WebAuthn credential ID',
  })
  @IsString()
  credentialId: string;

  @ApiProperty({
    example: 'user-id-xyz789',
    description: 'ID of the user registering the passkey',
  })
  @IsString()
  userId: string;
}

export class LoginWithPasskeyDto {
  @ApiPropertyOptional({
    example: 'user-id-xyz789',
    description: 'Optional user ID to look up existing credentials (auto-discovery when omitted)',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}