import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from '@common/common';

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', {
    exclude: ['/api/inngest'],
  });
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Boilerplate Service API')
    .setDescription(
      'API documentation for the NestJS boilerplate with MongoDB, Inngest, and Playwright',
    )
    .setVersion('1.0')
    .addTag('usuarios')
    .addTag('inngest')
    .addTag('inngest-events')
    .addTag('auth')
    .addTag('2fa')
    .addTag('passkeys')
    .addTag('dynamic-schema')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  Logger.log(
    `[Boilerplate Service] Running on http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `[Boilerplate Service] Swagger UI available at http://localhost:${port}/api`,
    'Bootstrap',
  );
  Logger.log(
    `[Inngest] Functions served at http://localhost:${port}/api/inngest`,
    'Bootstrap',
  );
  Logger.log(
    `[Inngest] Events endpoint at http://localhost:${port}/api/inngest-events/hola-inngest`,
    'Bootstrap',
  );
}

bootstrap();
