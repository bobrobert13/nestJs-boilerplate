import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NewsletterSubscriberDocument =
  HydratedDocument<NewsletterSubscriber>;

/**
 * PR5 / H6 / REQ-email-1..3 — single collection with nullable hashed
 * confirmation token. `isActive` is the single source of truth for
 * `sendNewsletter` selection.
 */
@Schema({ collection: 'NewsletterSubscribers', timestamps: true })
export class NewsletterSubscriber {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, default: false, index: true })
  isActive!: boolean;

  /** SHA-256 hash of the raw token; null after confirm. */
  @Prop({
    required: false,
    type: String,
    default: null,
    index: { sparse: true },
  })
  confirmationToken?: string | null;

  /** Absolute expiry for the pending token (TTL). */
  @Prop({ required: false, type: Date, default: null })
  confirmationExpiresAt?: Date | null;

  @Prop({ required: false, type: Date, default: null })
  confirmedAt?: Date | null;
}

export const NewsletterSubscriberSchema =
  SchemaFactory.createForClass(NewsletterSubscriber);

// TTL: drop pending subscribers whose token has expired.
NewsletterSubscriberSchema.index(
  { confirmationExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isActive: false } },
);
