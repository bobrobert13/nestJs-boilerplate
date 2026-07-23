import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { ResendService } from '../../services/resend.service';
import {
  NewsletterSubscriber,
  NewsletterSubscriberDocument,
} from '../../schemas/newsletter-subscriber.schema';
import {
  SubscribeDto,
  UnsubscribeDto,
} from './interfaces/newsletter.interfaces';

const CONFIRM_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * PR5 / H6 / REQ-email-1..3 â€” newsletter double opt-in.
 *
 * Subscribers start with `isActive: false` plus a SHA-256-hashed token.
 * Confirmation promotes to `isActive: true` and clears the token. The
 * in-memory `Map` is gone; persistence is MongoDB.
 */
@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectModel(NewsletterSubscriber.name)
    private readonly subscriberModel: Model<NewsletterSubscriberDocument>,
    private readonly resendService: ResendService,
  ) {}

  async subscribe(dto: SubscribeDto): Promise<NewsletterSubscriber> {
    const { email } = dto;
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + CONFIRM_TOKEN_TTL_MS);

    const existing = await this.subscriberModel.findOne({ email });
    if (existing) {
      existing.isActive = false;
      existing.confirmationToken = tokenHash;
      existing.confirmationExpiresAt = expiresAt;
      existing.confirmedAt = null;
      await existing.save();
      await this.deliverConfirmation(email, rawToken);
      return existing;
    }

    const created = await this.subscriberModel.create({
      email,
      isActive: false,
      confirmationToken: tokenHash,
      confirmationExpiresAt: expiresAt,
    });
    await this.deliverConfirmation(email, rawToken);
    return created;
  }

  async confirm(rawToken: string): Promise<{ ok: boolean; message: string }> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const subscriber = await this.subscriberModel.findOne({
      confirmationToken: tokenHash,
    });
    if (!subscriber) {
      return { ok: false, message: 'Invalid or already-used token' };
    }
    if (
      subscriber.confirmationExpiresAt &&
      subscriber.confirmationExpiresAt.getTime() < Date.now()
    ) {
      subscriber.confirmationToken = null;
      subscriber.confirmationExpiresAt = null;
      await subscriber.save();
      return { ok: false, message: 'Token expired' };
    }
    subscriber.isActive = true;
    subscriber.confirmationToken = null;
    subscriber.confirmationExpiresAt = null;
    subscriber.confirmedAt = new Date();
    await subscriber.save();
    return { ok: true, message: 'Subscription confirmed' };
  }

  async unsubscribe(dto: UnsubscribeDto): Promise<void> {
    const { email } = dto;
    const subscriber = await this.subscriberModel.findOne({ email });
    if (!subscriber) {
      this.logger.warn(`Subscriber not found: redacted`);
      return;
    }
    subscriber.isActive = false;
    await subscriber.save();
    this.logger.log(`Unsubscribed: redacted`);
  }

  async sendNewsletter(
    subject: string,
    content: string,
    options: { onlyActive?: boolean; concurrency?: number } = {
      onlyActive: true,
      concurrency: 10,
    },
  ): Promise<{ sent: number; failed: number }> {
    const { onlyActive, concurrency = 10 } = options;
    const recipients = await this.subscriberModel.find(
      onlyActive ? { isActive: true } : {},
    );

    // L6 / hardening-medium-low â€” bounded concurrency with a shared
    // cursor; each worker pulls the next index and dispatches. A failure
    // for one recipient must not block the rest of the batch.
    let cursor = 0;
    let sent = 0;
    let failed = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const idx = cursor++;
        if (idx >= recipients.length) return;
        const subscriber = recipients[idx];
        try {
          await this.resendService.sendEmail({
            to: subscriber.email,
            subject,
            html: content,
          });
          sent++;
        } catch (error) {
          this.logger.error(
            `Failed to send to redacted: ${error instanceof Error ? error.message : String(error)}`,
          );
          failed++;
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, recipients.length) },
      () => worker(),
    );
    await Promise.allSettled(workers);

    this.logger.log(`Newsletter sent: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  async getSubscribers(onlyActive = true): Promise<NewsletterSubscriber[]> {
    return this.subscriberModel.find(onlyActive ? { isActive: true } : {});
  }

  async getSubscriberCount(onlyActive = true): Promise<number> {
    return this.subscriberModel.countDocuments(
      onlyActive ? { isActive: true } : {},
    );
  }

  private async deliverConfirmation(
    email: string,
    rawToken: string,
  ): Promise<void> {
    const link = `${process.env.NEWSLETTER_BASE_URL ?? 'http://localhost:3000'}/newsletter/confirm?token=${encodeURIComponent(rawToken)}`;
    try {
      await this.resendService.sendEmail({
        to: email,
        subject: 'Confirm your newsletter subscription',
        html: `<p>Click to confirm: <a href="${link}">${link}</a></p>`,
      });
    } catch (err) {
      this.logger.warn(
        `Confirmation delivery failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
