import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailOptions, SendEmailResult } from '../interfaces/email-options.interface';

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

/**
 * Service for sending emails via the Resend API.
 * Supports plain text, HTML, and template-based emails with optional CC/BCC.
 */
@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly client: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly replyTo?: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<ResendConfig>('resend');

    if (!config?.apiKey) {
      this.logger.warn('Resend API key not configured. Email sending will be disabled.');
    }

    this.client = new Resend({ apiKey: config?.apiKey || '' });
    this.fromEmail = config?.fromEmail || 'onboarding@resend.dev';
    this.fromName = config?.fromName || 'My App';
    this.replyTo = config?.replyTo;
  }

  /**
   * Sends an email using the Resend API.
   * @param options - Email configuration including recipients, subject, and body content.
   * @returns The send result containing the email ID and delivery details.
   * @throws If the Resend API returns an error.
   */
  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    const { to, subject, text, html, from, replyTo, cc, bcc } = options;

    const payload: Record<string, any> = {
      from: from || `${this.fromName} <${this.fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
    };

    if (text) payload.text = text;
    if (html) payload.html = html;
    if (replyTo) payload.reply_to = replyTo;
    else if (this.replyTo) payload.reply_to = this.replyTo;
    if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];
    if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc];

    try {
      this.logger.debug(`Sending email to: ${Array.isArray(to) ? to.join(', ') : to}`);

      const result = await this.client.emails.send(payload);

      this.logger.log(`Email sent successfully: ${result.data?.id}`);

      return {
        id: result.data?.id || '',
        to: Array.isArray(to) ? to : [to],
        from: payload.from as string,
        subject,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Sends an email using a template with variable substitution.
   * Replaces `{{key}}` placeholders in the template string with values from the data object.
   * @param to - Recipient email address or array of addresses.
   * @param template - HTML template string with `{{key}}` placeholders. Also used as the email subject.
   * @param data - Key-value pairs to substitute into the template.
   * @returns The send result containing the email ID and delivery details.
   */
  async sendEmailWithTemplate(
    to: string | string[],
    template: string,
    data: Record<string, any>,
  ): Promise<SendEmailResult> {
    const html = this.renderTemplate(template, data);
    return this.sendEmail({
      to,
      subject: template,
      html,
    });
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    return rendered;
  }
}