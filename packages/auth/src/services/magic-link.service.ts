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

  async resendMagicLink(email: string): Promise<string> {
    return this.generateMagicLink(email);
  }

  isEnabled(): boolean {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>('auth');
    return config?.magicLink?.enabled || false;
  }

  /**
   * Return the magic-link config block. Used by callers that need the TTL
   * without exposing the entire auth config.
   */
  getConfig(): MagicLinkConfig | null {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>('auth');
    return config?.magicLink ?? null;
  }

  /**
   * Remove a previously-issued token. Used when delivery fails so a failed
   * Resend call cannot leak a valid token via the email channel.
   */
  async invalidateToken(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}