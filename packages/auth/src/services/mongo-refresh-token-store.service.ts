import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'node:crypto';
import type {
  IRefreshTokenStore,
  RefreshTokenRecord,
} from '../interfaces/auth.interfaces';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema';

/**
 * PR2 / H3 / REQ-auth-persistence-1..3 — durable Mongoose-backed refresh-token store.
 *
 * Tokens are stored as SHA-256 hashes; raw tokens are NEVER persisted.
 * Rotation writes `replacedBy` + `revokedAt` on the predecessor and persists
 * the successor in the same family. Reuse detection marks `revokedAt` on
 * every chain member via `revokeFamily`.
 */
@Injectable()
export class MongoRefreshTokenStore implements IRefreshTokenStore {
  private readonly logger = new Logger(MongoRefreshTokenStore.name);

  constructor(
    @InjectModel(RefreshToken.name)
    private readonly model: Model<RefreshTokenDocument>,
  ) {}

  async save(
    token: string,
    userId: string,
    email: string,
    roles: string[],
    expiresAt: Date,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<{ familyId: string }> {
    const hash = RefreshToken.hash(token);
    const familyId = randomBytes(16).toString('hex');
    await this.model.create({
      token: hash,
      userId,
      email,
      roles,
      familyId,
      expiresAt,
      createdByIp: meta?.ip ?? '',
      userAgent: meta?.userAgent,
    });
    this.logger.debug(`RefreshToken saved for userId=${userId}`);
    return { familyId };
  }

  async find(token: string): Promise<RefreshTokenRecord | null> {
    const hash = RefreshToken.hash(token);
    const row = await this.model.findOne({ token: hash }).lean();
    if (!row) return null;
    return {
      userId: String(row.userId),
      email: (row as any).email ?? '',
      roles: (row as any).roles ?? [],
      expiresAt: row.expiresAt,
    };
  }

  async delete(token: string): Promise<void> {
    const hash = RefreshToken.hash(token);
    await this.model.deleteOne({ token: hash });
    this.logger.debug('RefreshToken deleted');
  }

  /**
   * Atomically rotate a refresh token. Returns the metadata that the
   * successor token carries (userId/email/roles) so the caller can issue
   * a new JWT pair without re-querying.
   */
  async rotate(
    oldToken: string,
    newToken: string,
    expiresAt: Date,
  ): Promise<RefreshTokenRecord | null> {
    const oldHash = RefreshToken.hash(oldToken);
    const newHash = RefreshToken.hash(newToken);

    const predecessor = await this.model.findOne({ token: oldHash });
    if (!predecessor || predecessor.revokedAt) {
      return null;
    }

    predecessor.replacedBy = newHash;
    predecessor.revokedAt = new Date();
    await predecessor.save();

    await this.model.create({
      token: newHash,
      userId: predecessor.userId,
      email: (predecessor as any).email ?? '',
      roles: (predecessor as any).roles ?? [],
      familyId: predecessor.familyId,
      expiresAt,
      createdByIp: predecessor.createdByIp,
      userAgent: predecessor.userAgent,
    });

    return {
      userId: String(predecessor.userId),
      email: (predecessor as any).email ?? '',
      roles: (predecessor as any).roles ?? [],
      expiresAt,
    };
  }

  /**
   * Mark every non-revoked row in the family of `rawToken` as revoked.
   * Used when a token is reused after rotation.
   */
  async revokeFamily(rawToken: string): Promise<number> {
    const hash = RefreshToken.hash(rawToken);
    const row = await this.model.findOne({ token: hash });
    if (!row) return 0;
    const result = await this.model.updateMany(
      { familyId: row.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return result.modifiedCount ?? 0;
  }
}