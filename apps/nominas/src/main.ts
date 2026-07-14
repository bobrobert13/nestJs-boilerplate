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

  // ── Security ──────────────────────────────────────────────────
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });
  app.use(helmet());

  // ── Global pipes & filters ────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());

  // ── Global interceptors & middleware ──────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.use(requestIdMiddleware);

  // ── Global prefix ─────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Swagger ───────────────────────────────────────────────────
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
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  BootstrapLogger.routeMap(document as Record<string, any>);
  BootstrapLogger.step('Swagger setup', Date.now() - swaggerStart);

  // ── Graceful shutdown ─────────────────────────────────────────
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
