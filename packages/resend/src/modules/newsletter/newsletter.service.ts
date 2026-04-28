import { Injectable, Logger } from '@nestjs/common';
import { ResendService } from '../../services/resend.service';
import {
  NewsletterSubscriber,
  SubscribeDto,
  UnsubscribeDto,
} from './interfaces/newsletter.interfaces';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly subscribers: Map<string, NewsletterSubscriber> = new Map();

  constructor(private readonly resendService: ResendService) {}

  async subscribe(dto: SubscribeDto): Promise<NewsletterSubscriber> {
    const { email, name } = dto;

    const existing = this.subscribers.get(email);
    if (existing && existing.isActive) {
      this.logger.log(`Subscriber already exists: ${email}`);
      return existing;
    }

    const subscriber: NewsletterSubscriber = {
      email,
      name,
      subscribedAt: new Date(),
      isActive: true,
    };

    this.subscribers.set(email, subscriber);
    this.logger.log(`New subscriber: ${email}`);

    return subscriber;
  }

  async unsubscribe(dto: UnsubscribeDto): Promise<void> {
    const { email } = dto;
    const subscriber = this.subscribers.get(email);

    if (!subscriber) {
      this.logger.warn(`Subscriber not found: ${email}`);
      return;
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    this.logger.log(`Unsubscribed: ${email}`);
  }

  async sendNewsletter(
    subject: string,
    content: string,
    options: { onlyActive?: boolean } = { onlyActive: true },
  ): Promise<{ sent: number; failed: number }> {
    const { onlyActive } = options;

    const recipients = Array.from(this.subscribers.values()).filter((sub) =>
      onlyActive ? sub.isActive : true,
    );

    let sent = 0;
    let failed = 0;

    for (const subscriber of recipients) {
      try {
        await this.resendService.sendEmail({
          to: subscriber.email,
          subject,
          html: content,
        });
        sent++;
      } catch (error) {
        this.logger.error(
          `Failed to send to ${subscriber.email}: ${error instanceof Error ? error.message : String(error)}`,
        );
        failed++;
      }
    }

    this.logger.log(`Newsletter sent: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  getSubscribers(onlyActive = true): NewsletterSubscriber[] {
    return Array.from(this.subscribers.values()).filter((sub) =>
      onlyActive ? sub.isActive : true,
    );
  }

  getSubscriberCount(onlyActive = true): number {
    return this.getSubscribers(onlyActive).length;
  }
}
