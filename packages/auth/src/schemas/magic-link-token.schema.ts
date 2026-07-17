import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { createHash } from 'node:crypto';

export type MagicLinkTokenDocument = HydratedDocument<MagicLinkToken>;

/**
 * Persistent magic-link token record (L5 / hardening-medium-low).
 *
 * Replaces the previous in-memory `Map<string, MagicLinkData>` so tokens
 * survive restarts and expiry is enforced by a MongoDB TTL index on
 * `expiresAt` — no in-process sweep loop is required.
 *
 * Verification marks `consumedAt` and rejects consumed tokens; absence of
 * that field plus non-expired `expiresAt` is required.
 */
@Schema({
  collection: 'MagicLinkTokens',
  timestamps: { createdAt: true, updatedAt: false },
})
export class MagicLinkToken {
  /**
   * SHA-256 hash of the raw token. Raw tokens are NEVER persisted — only
   * hashed lookups are possible from MongoDB. (L5)
   */
  @Prop({ required: true, unique: true, index: true })
  tokenHash!: string;

  @Prop({ required: true, index: true })
  email!: string;

  /** Absolute expiry; TTL index drops the row when Date.now() > expiresAt. */
  @Prop({ required: true })
  expiresAt!: Date;

  /** Set when the token is verified. Used to single-use the link. */
  @Prop({ required: false, type: Date, default: null })
  consumedAt?: Date | null;

  /** Static helper — callers MUST persist only hashed tokens. */
  static hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}

export const MagicLinkTokenSchema =
  SchemaFactory.createForClass(MagicLinkToken);

// L5 / REQ-magic-2 — TTL index with expireAfterSeconds 0.
MagicLinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hot path for token lookup by hash (unique index already exists via @Prop).
MagicLinkTokenSchema.index({ email: 1, createdAt: -1 });
