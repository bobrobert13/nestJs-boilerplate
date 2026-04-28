export interface NewsletterSubscriber {
  email: string;
  name?: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  isActive: boolean;
}

export interface SubscribeDto {
  email: string;
  name?: string;
}

export interface UnsubscribeDto {
  email: string;
  reason?: string;
}
