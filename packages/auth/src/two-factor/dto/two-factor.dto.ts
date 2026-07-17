import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class EnableTwoFactorDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit TOTP code from authenticator app to verify setup',
  })
  @IsString()
  code: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({
    example: '123456',
    description: 'Current 6-digit TOTP code to verify',
  })
  @IsString()
  code: string;
}

export class VerifyBackupCodeDto {
  @ApiProperty({
    example: 'ABCD-EFGH-IJKL',
    description: 'Single-use backup recovery code',
  })
  @IsString()
  backupCode: string;
}

/**
 * C2: the body MUST NOT carry a `userId` field. Identity is derived from the
 * JWT in the Authorization header (`req.user.id`).
 */
export type VerifyBackupCodeRequest = VerifyBackupCodeDto;

export class GenerateBackupCodesDto {
  @ApiPropertyOptional({
    example: '123456',
    description: 'Current valid TOTP code required to regenerate backup codes',
  })
  @IsOptional()
  @IsString()
  currentCode?: string;
}
