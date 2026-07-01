import { Injectable, Logger } from '@nestjs/common';
import { ResendService } from '../../services/resend.service';
import { NewsletterSubscriber, SubscribeDto, UnsubscribeDto } from './interfaces/newsletter.interfaces';

/**
 * Service for managing newsletter subscribers and sending bulk emails.
 * Subscribers are stored in-memory (Map) and emails are dispatched via ResendService.
 */
@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly subscribers: Map<string, NewsletterSubscriber> = new Map();

  constructor(private readonly resendService: ResendService) {}

  /**
   * Subscribes a new email address to the newsletter.
   * If the email is already subscribed and active, returns the existing record.
   * @param dto - Subscription details containing email and optional name.
   * @returns The subscriber record.
   */
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

  /**
   * Unsubscribes an email address from the newsletter.
   * Marks the subscriber as inactive and records the unsubscription date.
   * @param dto - Unsubscription details containing email and optional reason.
   */
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

  /**
   * Sends a newsletter to all subscribers (or only active ones).
   * @param subject - The email subject line.
   * @param content - HTML content of the newsletter.
   * @param options - Sending options. `onlyActive` (default true) filters to active subscribers only.
   * @returns Counts of successfully sent and failed deliveries.
   */
  async sendNewsletter(
    subject: string,
    content: string,
    options: { onlyActive?: boolean } = { onlyActive: true },
  ): Promise<{ sent: number; failed: number }> {
    const { onlyActive } = options;

    const recipients = Array.from(this.subscribers.values()).filter(
      (sub) => onlyActive ? sub.isActive : true,
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
        this.logger.error(`Failed to send to ${subscriber.email}: ${error instanceof Error ? error.message : String(error)}`);
        failed++;
      }
    }

    this.logger.log(`Newsletter sent: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Returns the list of newsletter subscribers.
   * @param onlyActive - When true (default), returns only active subscribers; otherwise returns all.
   * @returns Array of subscriber records.
   */
  getSubscribers(onlyActive = true): NewsletterSubscriber[] {
    return Array.from(this.subscribers.values()).filter(
      (sub) => onlyActive ? sub.isActive : true,
    );
  }

  /**
   * Returns the total number of newsletter subscribers.
   * @param onlyActive - When true (default), counts only active subscribers; otherwise counts all.
   * @returns The subscriber count.
   */
  getSubscriberCount(onlyActive = true): number {
    return this.getSubscribers(onlyActive).length;
  }
}