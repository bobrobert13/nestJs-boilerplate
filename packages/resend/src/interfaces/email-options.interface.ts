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

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailWithAttachmentOptions extends EmailOptions {
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  id: string;
  to: string[];
  from: string;
  subject: string;
  createdAt: Date;
}