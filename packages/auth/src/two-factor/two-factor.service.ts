import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { randomBytes, createHash } from 'crypto';
import { toDataURL } from 'qrcode';
import {
  TwoFactorSetupResult,
  TwoFactorVerifyResult,
  TwoFactorBackupCode,
  TwoFactorConfig,
} from './interfaces/two-factor.interfaces';

@Injectable()
export class TwoFactorService implements OnModuleInit {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly backupCodes: Map<string, TwoFactorBackupCode[]> = new Map();
  private issuer: string = 'MyApp';
  private algorithm: 'SHA1' | 'SHA256' | 'SHA512' = 'SHA1';
  private digits: 6 | 8 = 6;
  private period: number = 30;
  private backupCodesCount: number = 10;
  private backupCodesLength: number = 10;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.loadConfig();
    this.logger.log(`✅ TwoFactorService initialized - Issuer: ${this.issuer}`);
  }

  private loadConfig() {
    const config = this.configService.get<{ twoFactor: TwoFactorConfig }>(
      'auth',
    );
    if (config?.twoFactor) {
      this.issuer = config.twoFactor.issuer || 'MyApp';
      this.algorithm = config.twoFactor.algorithm || 'SHA1';
      this.digits = config.twoFactor.digits || 6;
      this.period = config.twoFactor.period || 30;
      this.backupCodesCount = config.twoFactor.backupCodes?.count || 10;
      this.backupCodesLength = config.twoFactor.backupCodes?.length || 10;
    }
  }

  async generateSecret(userId: string): Promise<TwoFactorSetupResult> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(userId, this.issuer, secret);
    const qrCode = await this.provideQrCode(otpauthUrl);
    const backupCodes = this.generateBackupCodes(userId);

    this.logger.log(`2FA secret generated for user: ${userId}`);

    return {
      secret,
      otpauthUrl,
      qrCode,
      backupCodes,
    };
  }

  async provideQrCode(otpauthUrl: string): Promise<string> {
    try {
      return await toDataURL(otpauthUrl);
    } catch (error) {
      this.logger.error(
        `Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`,
      );
      return '';
    }
  }

  async verifyCode(
    userId: string,
    code: string,
  ): Promise<TwoFactorVerifyResult> {
    const backupCodes = this.backupCodes.get(userId) || [];

    if (
      backupCodes.some(
        (bc) => !bc.isUsed && this.verifyBackupCode(code, bc.hashedCode),
      )
    ) {
      return { valid: true };
    }

    const isValid = authenticator.verify({
      token: code,
      secret: this.getUserSecret(userId),
    });

    return { valid: isValid };
  }

  async enableTwoFactor(
    userId: string,
    code: string,
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    const isValid = authenticator.verify({
      token: code,
      secret: this.getUserSecret(userId),
    });

    if (!isValid) {
      this.logger.warn(`Invalid 2FA code for user: ${userId}`);
      return { success: false };
    }

    const backupCodes = this.generateBackupCodes(userId);
    this.logger.log(`2FA enabled for user: ${userId}`);

    return { success: true, backupCodes };
  }

  async disableTwoFactor(userId: string): Promise<void> {
    this.backupCodes.delete(userId);
    this.logger.log(`2FA disabled for user: ${userId}`);
  }

  generateBackupCodes(userId: string): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.backupCodesCount; i++) {
      const code = this.generateBackupCode();
      const hashedCode = this.hashBackupCode(code);

      const existing = this.backupCodes.get(userId) || [];
      existing.push({ code, hashedCode, isUsed: false });
      this.backupCodes.set(userId, existing);

      codes.push(code);
    }

    this.logger.log(
      `Generated ${codes.length} backup codes for user: ${userId}`,
    );

    return codes;
  }

  async verifyBackupCodeWithUser(
    userId: string,
    backupCode: string,
  ): Promise<boolean> {
    const userBackupCodes = this.backupCodes.get(userId) || [];

    const found = userBackupCodes.find(
      (bc) => !bc.isUsed && this.verifyBackupCode(backupCode, bc.hashedCode),
    );

    if (found) {
      found.isUsed = true;
      found.usedAt = new Date();
      this.logger.log(`Backup code used for user: ${userId}`);
      return true;
    }

    return false;
  }

  async regenerateBackupCodes(
    userId: string,
    currentCode: string,
  ): Promise<string[]> {
    const isValid = authenticator.verify({
      token: currentCode,
      secret: this.getUserSecret(userId),
    });

    if (!isValid) {
      throw new Error('Invalid 2FA code');
    }

    this.backupCodes.delete(userId);
    const newCodes = this.generateBackupCodes(userId);

    this.logger.log(`Regenerated backup codes for user: ${userId}`);

    return newCodes;
  }

  isTwoFactorEnabled(userId: string): boolean {
    return (
      this.backupCodes.has(userId) && this.backupCodes.get(userId)!.length > 0
    );
  }

  private generateBackupCode(): string {
    return randomBytes(this.backupCodesLength)
      .toString('base64')
      .replace(/\+/g, '0')
      .replace(/\//g, '1')
      .replace(/=/g, '')
      .substring(0, this.backupCodesLength)
      .toUpperCase();
  }

  private hashBackupCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private verifyBackupCode(input: string, hashed: string): boolean {
    const inputHashed = this.hashBackupCode(input);
    return inputHashed === hashed;
  }

  private getUserSecret(userId: string): string {
    return `secret_for_${userId}`;
  }

  getTimeRemaining(): number {
    const epoch = Math.floor(Date.now() / 1000);
    return this.period - (epoch % this.period);
  }
}
