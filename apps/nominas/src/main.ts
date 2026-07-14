import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from '@common/common';

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DatabaseExceptionFilter());

  // Swagger configuration
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

  await app.listen(port);
  Logger.log(
    `[Boilerplate Service] Running on http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `[Boilerplate Service] Swagger UI available at http://localhost:${port}/api`,
    'Bootstrap',
  );
}

bootstrap();
