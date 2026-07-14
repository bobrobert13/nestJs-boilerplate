import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  DatabaseExceptionFilter,
  BootstrapLogger,
  LogCategory,
} from '@common/common';

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
  const startTime = Date.now();
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);

  BootstrapLogger.step('NestFactory created', Date.now() - startTime);

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DatabaseExceptionFilter());

  // Swagger configuration
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
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  BootstrapLogger.routeMap(document as Record<string, any>);
  BootstrapLogger.step('Swagger setup', Date.now() - swaggerStart);

  await app.listen(port);

  BootstrapLogger.log(LogCategory.API, `Listening on http://localhost:${port}`);
  BootstrapLogger.log(
    LogCategory.API,
    `Swagger UI at http://localhost:${port}/api`,
  );
  BootstrapLogger.banner('Boilerplate Service', Number(port));
}

bootstrap();
