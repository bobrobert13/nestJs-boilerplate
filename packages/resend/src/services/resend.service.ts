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