import { IsString, IsOptional } from 'class-validator';

export class EnableTwoFactorDto {
  @IsString()
  code: string;
}

export class VerifyTwoFactorDto {
  @IsString()
  code: string;
}

export class VerifyBackupCodeDto {
  @IsString()
  backupCode: string;
}

export class GenerateBackupCodesDto {
  @IsOptional()
  @IsString()
  currentCode?: string;
}
