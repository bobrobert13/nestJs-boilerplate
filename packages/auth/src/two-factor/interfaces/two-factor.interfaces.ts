/**
 * Provider interface for generating QR codes from otpauth URLs.
 */
export interface TwoFactorProvider {
  /**
   * Converts an otpauth URL into a renderable image or data URL.
   * @param otpauthUrl - The `otpauth://` URI from the authenticator
   */
  provideQrCode(otpauthUrl: string): Promise<string>;
}

/**
 * Internal representation of a single-use backup code.
 *
 * @description Stores the hashed code for verification alongside
 * its usage state. Plaintext codes are never persisted.
 */
export interface TwoFactorBackupCode {
  /** Original plaintext code (returned once, then discarded) */
  code: string;
  /** SHA-256 hash of the code for verification */
  hashedCode: string;
  /** Whether this code has already been consumed */
  isUsed: boolean;
  /** Timestamp when the code was used (set on consumption) */
  usedAt?: Date;
}

/**
 * Result returned when generating a new 2FA setup.
 */
export interface TwoFactorSetupResult {
  /** TOTP secret key */
  secret: string;
  /** Full otpauth URI for QR code generation */
  otpauthUrl: string;
  /** QR code as a base64 data URL */
  qrCode: string;
  /** Plaintext backup codes (show once, never store) */
  backupCodes: string[];
}

/**
 * Result of a TOTP code or backup code verification attempt.
 */
export interface TwoFactorVerifyResult {
  /** Whether the code was valid */
  valid: boolean;
  /** Set to true if the user should fall back to a backup code */
  requiresBackupCode?: boolean;
}

/**
 * Configuration for backup code generation parameters.
 */
export interface TwoFactorBackupCodesConfig {
  /** Number of backup codes to generate */
  count: number;
  /** Length of each backup code in characters */
  length: number;
  /** Optional prefix prepended to each code */
  prefix: string;
}

/**
 * Full 2FA configuration section from the auth config namespace.
 */
export interface TwoFactorConfig {
  /** Issuer name displayed in authenticator apps */
  issuer: string;
  /** Hashing algorithm for TOTP */
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  /** Number of digits in the generated code (6 or 8) */
  digits: 6 | 8;
  /** TOTP time window in seconds */
  period: number;
  /** Time step in seconds (synonym for period) */
  step: number;
  /** Backup code generation settings */
  backupCodes: TwoFactorBackupCodesConfig;
}