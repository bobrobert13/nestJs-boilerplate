import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TwoFactorSecretDocument = HydratedDocument<TwoFactorSecret>;

/**
 * PR3 / C4 / REQ-auth-crypto-1 — per-user TOTP secret persistence.
 *
 * The `secret` field is base32-encoded and stored `select: false` so reads
 * MUST explicitly opt-in via `.select('+secret')`. Plaintext secrets are
 * NEVER logged.
 */
@Schema({
  collection: 'TwoFactorSecrets',
  timestamps: { createdAt: true, updatedAt: false },
})
export class TwoFactorSecret {
  @Prop({ required: true, unique: true, type: Types.ObjectId })
  userId!: Types.ObjectId;

  @Prop({ required: true, select: false })
  secret!: string;

  @Prop({ required: false, type: Date, default: null })
  lastUsedAt?: Date | null;
}

export const TwoFactorSecretSchema =
  SchemaFactory.createForClass(TwoFactorSecret);
