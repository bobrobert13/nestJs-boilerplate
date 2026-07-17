import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  DatabaseExceptionFilter,
  BootstrapLogger,
  LogCategory,
  ResponseInterceptor,
  requestIdMiddleware,
} from '@common/common';

async function bootstrap() {
  const startTime = Date.now();
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);

  BootstrapLogger.step('NestFactory created', Date.now() - startTime);

  // PR4 / H4 — trust proxy from env (default 1 hop). Must run BEFORE
  // Helmet/CORS so req.ip is the client behind the proxy.
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  const httpAdapter = app.getHttpAdapter();
  const expressInstance = (httpAdapter as any).getInstance?.() ?? httpAdapter;
  if (typeof (expressInstance as any).set === 'function') {
    (expressInstance as any).set('trust proxy', trustProxyHops);
  }

  // PR4 / C7 / REQ-gateway-hardening-3 — Helmet unconditional, no fallback.
  // CSP default-deny, HSTS 1 year, Referrer-Policy no-referrer.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            // L2 / hardening-medium-low — allow the Tailwind CDN host
            // explicitly so the SRI-verified inline script can load
            // from the rendered HTML pages.
            'https://cdn.tailwindcss.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // PR4 / C6 / REQ-gateway-hardening-1 — explicit CORS origin.
  const corsOrigin = process.env.CORS_ORIGIN ?? '';
  if (
    process.env.NODE_ENV === 'production' &&
    (corsOrigin === '' || corsOrigin === '*')
  ) {
    throw new Error(
      'CORS_ORIGIN must be set to an explicit origin list in production (C6).',
    );
  }
  const origins = corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : false,
    credentials: false,
  });

  // PR4 — final-gate startup line.
  BootstrapLogger.log(
    LogCategory.SECURITY,
    `✅ Helmet: enabled · CSP: strict · CORS: explicit · trust-proxy: ${trustProxyHops}`,
  );

  // Global pipes & filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());

  // Global interceptors & middleware
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.use(requestIdMiddleware);

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger
  const swaggerStart = Date.now();
  const config = new DocumentBuilder()
    .setTitle('Boilerplate Service API')
    .setDescription(
      'API documentation for the NestJS boilerplate with MongoDB and Playwright',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('usuarios')
    .addTag('auth')
    .addTag('health')
    .addTag('scraper')
    .addTag('dynamic-schema')
    .addTag('newsletter')
    .addTag('passkeys')
    .addTag('2fa')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  BootstrapLogger.routeMap(document as Record<string, any>);
  BootstrapLogger.step('Swagger setup', Date.now() - swaggerStart);

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  BootstrapLogger.log(LogCategory.API, `Listening on http://localhost:${port}`);
  BootstrapLogger.log(
    LogCategory.API,
    `Swagger UI at http://localhost:${port}/api`,
  );
  BootstrapLogger.log(
    LogCategory.API,
    `Health check at http://localhost:${port}/api/health`,
  );
  BootstrapLogger.banner('Boilerplate Service', Number(port));
}

bootstrap();
