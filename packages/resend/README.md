<!-- @common/resend — status: docs-complete | jsdoc-pending -->

# @common/resend — Email Module

Servicio de email basado en [Resend](https://resend.com) con soporte para newsletter.

## Quick Start

```typescript
import { ResendModule, ResendService } from '@common/resend';

@Module({
  imports: [ResendModule], // Global — no necesita re-importarse
})
export class AppModule {}
```

```typescript
@Injectable()
export class MyService {
  constructor(private readonly resend: ResendService) {}

  async sendWelcome(email: string) {
    return this.resend.sendEmail({
      to: email,
      subject: 'Welcome!',
      html: '<h1>Welcome</h1>',
    });
  }
}
```

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `RESEND_API_KEY` | `""` | Sí | Resend API key |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | No | Remitente |
| `RESEND_FROM_NAME` | `My App` | No | Nombre del remitente |
| `RESEND_REPLY_TO` | — | No | Reply-To global |

## API

### `ResendService`

| Método | Descripción |
|--------|-------------|
| `sendEmail(options)` | Envía un email. Soporta `to`, `subject`, `text`, `html`, `from`, `replyTo`, `cc`, `bcc` |
| `sendEmailWithTemplate(to, template, data)` | Renderiza template con `{{key}}` y envía |

### `EmailOptions`

```typescript
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}
```

### Newsletter (`NewsletterModule`)

Submódulo para gestión de suscriptores in-memory.

```typescript
import { NewsletterModule } from '@common/resend';

@Module({
  imports: [NewsletterModule],
})
export class AppModule {}
```

**Endpoints:**

| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/newsletter/subscribe` | Suscribir email |
| POST | `/newsletter/unsubscribe` | Dar de baja |
| GET | `/newsletter/subscribers` | Listar suscriptores |
| GET | `/newsletter/stats` | Estadísticas (activos/total) |
| DELETE | `/newsletter/subscribers/:email` | Eliminar suscriptor |

**Nota:** `NewsletterService` almacena suscriptores en memoria (`Map`). No persiste entre reinicios.

## Dependencies

- `@nestjs/common` ^10 \|\| ^11 (peer)
- `@nestjs/config` ^3 \|\| ^4 (peer)
- `resend` ^4

## Deployment

Requiere `RESEND_API_KEY` configurada en el entorno. Sin API key, el servicio loguea un warning y no envía emails.

## Patterns

- Module global (`@Global()`) — importar una vez en `AppModule`
- Config namespaced via `registerAs('resend', ...)` — accesible como `configService.get('resend')`
