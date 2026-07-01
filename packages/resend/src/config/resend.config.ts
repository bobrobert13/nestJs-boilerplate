import { registerAs } from '@nestjs/config';

/** Configuration options for the Resend email service. */
export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

/** Registered configuration namespace for the Resend email service. */
export default registerAs('resend', () => ({
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  fromName: process.env.RESEND_FROM_NAME || 'My App',
  replyTo: process.env.RESEND_REPLY_TO || undefined,
}));