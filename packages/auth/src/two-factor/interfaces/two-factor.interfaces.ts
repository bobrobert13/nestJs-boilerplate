export interface TwoFactorProvider {
  provideQrCode(otpauthUrl: string): Promise<string>;
}

export interface TwoFactorBackupCode {
  code: string;
  hashedCode: string;
  isUsed: boolean;
  usedAt?: Date;
}

export interface TwoFactorSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  requiresBackupCode?: boolean;
}

export interface TwoFactorBackupCodesConfig {
  count: number;
  length: number;
  prefix: string;
}

export interface TwoFactorConfig {
  issuer: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
  step: number;
  backupCodes: TwoFactorBackupCodesConfig;
}