# @common/resend

Email sending module for NestJS via Resend API — transactional emails and newsletter support.

## Features

- **Transactional email** — Send single emails with HTML/text content
- **Template rendering** — Simple `{{variable}}` placeholder replacement
- **Newsletter module** — Subscriber management and broadcast sending
- **Configurable sender** — Per-email or default from address
- **CC/BCC support** — Multiple recipients and hidden copies

## Installation

```bash
npm install @common/resend resend
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendModule } from '@common/resend';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ResendModule,
  ],
})
export class AppModule {}
```

### 2. Configure .env

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=My App
RESEND_REPLY_TO=reply@example.com
```

### 3. Send an email

```typescript
import { ResendService } from '@common/resend';

@Injectable()
export class NotificationService {
  constructor(private readonly resend: ResendService) {}

  async sendWelcome(email: string) {
    return this.resend.sendEmail({
      to: email,
      subject: 'Welcome to My App',
      html: '<h1>Welcome!</h1><p>Thanks for joining.</p>',
    });
  }
}
```

---

## sendEmail Options

```typescript
interface EmailOptions {
  to: string | string[];           // Recipients
  subject: string;                 // Email subject
  html?: string;                   // HTML body
  text?: string;                   // Plain text body (fallback)
  from?: string;                   // Override default sender (format: "Name <email>")
  replyTo?: string;                // Override reply-to address
  cc?: string | string[];         // CC recipients
  bcc?: string | string[];        // BCC recipients
}

interface SendEmailResult {
  id: string;                       // Resend email ID
  to: string[];
  from: string;
  subject: string;
  createdAt: Date;
}
```

---

## Template Rendering

Use `sendEmailWithTemplate()` for simple variable substitution:

```typescript
await resend.sendEmailWithTemplate(
  'user@example.com',
  'Hello {{name}}, your order #{{orderId}} is ready!',
  { name: 'John', orderId: '12345' }
);
```

**Limitations:** This is a simple find/replace engine. For complex templates, render the HTML server-side using EJS or another template engine, then pass to `sendEmail()`.

---

## Newsletter Module

Manages subscribers and sends broadcast emails.

### 1. Import NewsletterModule

```typescript
import { ResendModule } from '@common/resend';

@Module({
  imports: [ResendModule, NewsletterModule],
})
export class AppModule {}
```

### 2. Add subscribers

```typescript
import { NewsletterService } from '@common/resend';

@Injectable()
export class SubscriptionService {
  constructor(private readonly newsletter: NewsletterService) {}

  async subscribe(email: string) {
    return this.newsletter.addSubscriber(email);
  }
}
```

### 3. Send broadcasts

```typescript
await newsletter.sendBroadcast({
  subject: 'Weekly Update',
  html: '<h1>News from My App</h1>',
});
// Sends to all active subscribers
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | — | Resend API key (`re_...`) |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Default sender email |
| `RESEND_FROM_NAME` | `My App` | Default sender name |
| `RESEND_REPLY_TO` | — | Default reply-to address |

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `Unauthorized` | Invalid API key | Verify `RESEND_API_KEY` starts with `re_` |
| `Email not received` | Bounced or filtered | Check Resend dashboard for bounces |
| `_from email address not verified` | Domain not verified | Add domain in Resend dashboard |
| `Missing subject` | Empty subject | Ensure `subject` is non-empty string |
| `Newsletter fails` | No subscribers | Add subscribers before sending broadcast |