import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { createHash } from 'node:crypto';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

/**
 * Persistent refresh-token record (H3 / REQ-auth-persistence-1..3).
 *
 * The `token` field stores the SHA-256 hash of the raw token; raw tokens
 * are NEVER persisted. Rotation chains use `replacedBy`; family revocation
 * sets `revokedAt` on every member.
 */
@Schema({
  collection: 'RefreshTokens',
  timestamps: { createdAt: true, updatedAt: false },
})
export class RefreshToken {
  /** SHA-256 hash of the raw refresh token. */
  @Prop({ required: true, unique: true, index: true })
  token!: string;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId!: Types.ObjectId;

  /** uuid v4 minted on first login. All rotated tokens share one family. */
  @Prop({ required: true, index: true })
  familyId!: string;

  /** Snapshot of the user's email at issue time — needed for token rotation. */
  @Prop({ required: false, default: '' })
  email?: string;

  /** Snapshot of the user's roles at issue time. */
  @Prop({ required: false, type: [String], default: [] })
  roles?: string[];

  /** SHA-256 hash of the successor token (rotation chain). */
  @Prop({ required: false })
  replacedBy?: string;

  /** Absolute expiry — TTL index drops the row when Date.now() > expiresAt. */
  @Prop({ required: true })
  expiresAt!: Date;

  /** null until reuse / logout. */
  @Prop({ required: false, type: Date, default: null })
  revokedAt?: Date | null;

  @Prop({ required: true })
  createdByIp!: string;

  @Prop({ required: false })
  userAgent?: string;

  /** Static helper — callers MUST persist only hashed tokens. */
  static hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// H3 / REQ-auth-persistence-1: TTL index with expireAfterSeconds 0.
// MongoDB removes the row when Date.now() > expiresAt.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// H3 / REQ-auth-persistence-3: hot path for reuse detection.
RefreshTokenSchema.index({ familyId: 1, revokedAt: 1 });