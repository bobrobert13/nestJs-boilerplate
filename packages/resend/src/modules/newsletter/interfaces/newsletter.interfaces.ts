/** Represents a newsletter subscriber with activation and subscription tracking. */
export interface NewsletterSubscriber {
  email: string;
  name?: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  isActive: boolean;
}

/** DTO for subscribing an email address to the newsletter. */
export interface SubscribeDto {
  email: string;
  name?: string;
}

/** DTO for unsubscribing an email address from the newsletter. */
export interface UnsubscribeDto {
  email: string;
  reason?: string;
}