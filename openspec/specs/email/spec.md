# Email Specification

## Purpose

Servicio de email basado en Resend API con soporte para newsletter (suscriptores en memoria).

Documentación asociada: `packages/resend/README.md`

## Requirements

### Send Email

The system MUST send transactional emails via Resend API.

#### Scenario: Send basic email

- GIVEN a configured RESEND_API_KEY
- WHEN `ResendService.sendEmail({ to, subject, html })` is called
- THEN the system sends the email via Resend API
- AND returns a SendEmailResult with id and timestamp

#### Scenario: Send without API key

- GIVEN no RESEND_API_KEY configured
- WHEN `ResendService.sendEmail(...)` is called
- THEN the system logs a warning
- AND the email fails to send

### Template Rendering

The system SHOULD support simple `{{key}}` template interpolation in email content.

#### Scenario: Send template email

- GIVEN a template string with `{{name}}` placeholders
- WHEN `sendEmailWithTemplate(to, template, { name: 'John' })` is called
- THEN the system replaces `{{name}}` with "John" in the HTML

### Newsletter Subscription

The system MAY provide newsletter subscription management.

#### Scenario: Subscribe email

- GIVEN a valid email address
- WHEN POST `/api/newsletter/subscribe` with `{ email }`
- THEN the system adds the subscriber
- AND returns success

#### Scenario: Unsubscribe

- GIVEN an existing subscriber
- WHEN POST `/api/newsletter/unsubscribe` with `{ email }`
- THEN the system marks subscriber as inactive

### Newsletter Sending

The system MAY send bulk newsletter emails to subscribers.

#### Scenario: Send newsletter to active subscribers

- GIVEN multiple active subscribers
- WHEN `NewsletterService.sendNewsletter(subject, content)` is called
- THEN the system sends the email to each active subscriber
- AND returns `{ sent: N, failed: 0 }`

## Implementation Notes

- Newsletter subscribers stored in-memory (`Map`) — NOT persisted between restarts
- Newsletter is NOT suitable for production without adding a persistence layer

## Affected Documentation

- `packages/resend/README.md`
- `AGENTS.md` — section 3 (Packages Index)
