import { registerAs } from '@nestjs/config';

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export default registerAs('resend', () => ({
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  fromName: process.env.RESEND_FROM_NAME || 'My App',
  replyTo: process.env.RESEND_REPLY_TO || undefined,
}));