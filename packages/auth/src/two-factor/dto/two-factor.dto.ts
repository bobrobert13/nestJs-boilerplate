import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for enabling 2FA with a TOTP verification code.
 */
export class EnableTwoFactorDto {
  @IsString()
  code: string;
}

/**
 * DTO for verifying a TOTP code.
 */
export class VerifyTwoFactorDto {
  @IsString()
  code: string;
}

/**
 * DTO for verifying a single-use backup code.
 */
export class VerifyBackupCodeDto {
  @IsString()
  backupCode: string;
}

/**
 * DTO for regenerating backup codes (requires current TOTP code).
 */
export class GenerateBackupCodesDto {
  @IsOptional()
  @IsString()
  currentCode?: string;
}