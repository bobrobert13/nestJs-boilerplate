import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TwoFactorBackupCodeDocument = HydratedDocument<TwoFactorBackupCode>;

/**
 * PR2 / M11 partial / REQ-auth-persistence-4 — durable backup-code record.
 *
 * Stores ONLY `{ hashedCode, isUsed, usedAt }` plus ownership. Plaintext
 * backup codes are NEVER persisted.
 */
@Schema({
  collection: 'TwoFactorBackupCodes',
  timestamps: { createdAt: true, updatedAt: false },
})
export class TwoFactorBackupCode {
  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId!: Types.ObjectId;

  /** Argon2/SHA-256 hash of the plaintext backup code. */
  @Prop({ required: true })
  hashedCode!: string;

  @Prop({ required: true, default: false })
  isUsed!: boolean;

  @Prop({ required: false, type: Date, default: null })
  usedAt?: Date | null;
}

export const TwoFactorBackupCodeSchema =
  SchemaFactory.createForClass(TwoFactorBackupCode);

TwoFactorBackupCodeSchema.index({ userId: 1, isUsed: 1 });