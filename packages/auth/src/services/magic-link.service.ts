import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'node:crypto';
import {
  MagicLinkToken,
  MagicLinkTokenDocument,
} from '../schemas/magic-link-token.schema';

interface MagicLinkConfig {
  enabled: boolean;
  tokenTtl: number;
}

interface MagicLinkData {
  email: string;
  expiresAt: Date;
}

/**
 * L5 / hardening-medium-low — issues and validates single-use login links.
 *
 * Tokens are persisted to MongoDB (collection `MagicLinkTokens`) with a
 * TTL index on `expiresAt`. Verification marks `consumedAt` so the same
 * token cannot be replayed. Falls back to an in-memory `Map` only when
 * the Mongoose model is not injected (useful for unit tests).
 */
@Injectable()
export class MagicLinkService implements OnModuleInit {
  private readonly logger = new Logger(MagicLinkService.name);
  private readonly tokens: Map<string, MagicLinkData> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @InjectModel(MagicLinkToken.name)
    private readonly tokenModel?: Model<MagicLinkTokenDocument>,
  ) {}

  onModuleInit() {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>(
      'auth',
    );
    const isEnabled = config?.magicLink?.enabled || false;
    if (isEnabled) {
      this.logger.log(
        `✅ MagicLinkService initialized - ENABLED (storage: ${this.tokenModel ? 'mongo' : 'memory'})`,
      );
    } else {
      this.logger.warn(
        '⚠️ MagicLinkService initialized - Magic links DISABLED',
      );
    }
  }

  async generateMagicLink(email: string): Promise<string> {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>(
      'auth',
    );
    if (!config?.magicLink?.enabled) {
      this.logger.warn('Magic link is disabled');
      throw new Error('Magic link authentication is disabled');
    }

    const token = randomBytes(32).toString('hex');
    const ttl = config.magicLink.tokenTtl || 300;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    if (this.tokenModel) {
      await this.tokenModel.create({
        tokenHash: MagicLinkToken.hash(token),
        email,
        expiresAt,
        consumedAt: null,
      });
    } else {
      this.tokens.set(token, { email, expiresAt });
    }

    this.logger.log(`Magic link generated for: ${email}`);
    return token;
  }

  async verifyMagicLink(token: string): Promise<string> {
    if (this.tokenModel) {
      const hash = MagicLinkToken.hash(token);
      const doc = await this.tokenModel.findOne({ tokenHash: hash });
      if (!doc) throw new Error('Invalid magic link token');
      if (doc.consumedAt) throw new Error('Magic link token already used');
      if (new Date() > doc.expiresAt) {
        throw new Error('Magic link token expired');
      }
      doc.consumedAt = new Date();
      await doc.save();
      this.logger.log(`Magic link verified for: ${doc.email}`);
      return doc.email;
    }

    const data = this.tokens.get(token);
    if (!data) throw new Error('Invalid magic link token');
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
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>(
      'auth',
    );
    return config?.magicLink?.enabled || false;
  }

  getConfig(): MagicLinkConfig | null {
    const config = this.configService.get<{ magicLink: MagicLinkConfig }>(
      'auth',
    );
    return config?.magicLink ?? null;
  }

  async invalidateToken(token: string): Promise<void> {
    if (this.tokenModel) {
      await this.tokenModel.deleteOne({
        tokenHash: MagicLinkToken.hash(token),
      });
    } else {
      this.tokens.delete(token);
    }
  }
}
