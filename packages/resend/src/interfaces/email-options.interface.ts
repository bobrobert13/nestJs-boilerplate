/** Options for sending a single email via Resend. */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/** Represents a file attachment for an email. */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/** Email options extended with support for file attachments. */
export interface EmailWithAttachmentOptions extends EmailOptions {
  attachments?: EmailAttachment[];
}

/** Result returned after successfully sending an email. */
export interface SendEmailResult {
  id: string;
  to: string[];
  from: string;
  subject: string;
  createdAt: Date;
}