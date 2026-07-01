import { Module, Global } from '@nestjs/common';
import { ServeStaticService } from './serve-static.service';

/**
 * NestJS global module for serving static files and rendering EJS templates.
 * Provides ServeStaticService application-wide without requiring explicit imports.
 */
@Global()
@Module({
  providers: [ServeStaticService],
  exports: [ServeStaticService],
})
export class ServeStaticModule {}
