import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

interface MagicLinkConfig {
  enabled: boolean;
  tokenTtl: number;
}

interface MagicLinkData {
  email: string;
  expiresAt: Date;
}

/**
 * Service for passwordless authentication via single-use magic link tokens.
 *
 * @description Generates cryptographically secure tokens that expire after
 * a configurable TTL. Tokens are verified once and then consumed.
 * Can be globally disabled via the `MAGIC_LINK_ENABLED` env variable.
 */
@Injectable()
export class MagicLinkService implements OnModuleInit {
  private readonly logger = new Logger(MagicLinkService.name);
  private readonly tokens: Map<string, MagicLinkData> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>('auth');
    const isEnabled = config?.magicLink?.enabled || false;
    
    if (isEnabled) {
      this.logger.log('✅ MagicLinkService initialized - Magic links ENABLED');
    } else {
      this.logger.warn('⚠️ MagicLinkService initialized - Magic links DISABLED');
    }
  }

  /**
   * Generates a single-use magic link token for the given email.
   *
   * @param email - Target email address for the magic link
   * @returns A hex-encoded token string
   * @throws Error if magic links are globally disabled
   */
  async generateMagicLink(email: string): Promise<string> {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>('auth');

    if (!config?.magicLink?.enabled) {
      this.logger.warn('Magic link is disabled');
      throw new Error('Magic link authentication is disabled');
    }

    const token = randomBytes(32).toString('hex');
    const ttl = config.magicLink.tokenTtl || 300;

    this.tokens.set(token, {
      email,
      expiresAt: new Date(Date.now() + ttl * 1000),
    });

    this.logger.log(`Magic link generated for: ${email}`);
    
    return token;
  }

  /**
   * Verifies a magic link token and returns the associated email.
   *
   * @description Tokens are single-use — once verified they are removed
   * from the store and cannot be reused.
   *
   * @param token - The magic link token to verify
   * @returns The email address associated with the token
   * @throws Error if the token is invalid or expired
   */
  async verifyMagicLink(token: string): Promise<string> {
    const data = this.tokens.get(token);

    if (!data) {
      throw new Error('Invalid magic link token');
    }

    if (new Date() > data.expiresAt) {
      this.tokens.delete(token);
      throw new Error('Magic link token expired');
    }

    const email = data.email;
    this.tokens.delete(token);

    this.logger.log(`Magic link verified for: ${email}`);
    return email;
  }

  /**
   * Resends a magic link by generating a fresh token for the given email.
   *
   * @param email - Target email address
   * @returns A new hex-encoded token string
   */
  async resendMagicLink(email: string): Promise<string> {
    return this.generateMagicLink(email);
  }

  /**
   * Checks whether magic link authentication is globally enabled.
   *
   * @returns `true` if magic links are enabled via configuration
   */
  isEnabled(): boolean {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>('auth');
    return config?.magicLink?.enabled || false;
  }
}