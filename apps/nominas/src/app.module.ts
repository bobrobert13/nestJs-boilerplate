import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@common/database';
import { PlaywrightModule } from '@common/playwright';
import { DatabaseExceptionFilter } from '@common/common';
import { AuthModule, JwtAuthGuard, RolesGuard } from '@common/auth';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { DynamicSchemaModule } from './modules/dynamic-schema/dynamic-schema.module';
import { validateEnv } from './config/env.validation';
import { ScraperModule } from './modules/scraper/scraper.module';
import { CronModule } from './common/cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    DatabaseModule,
    PlaywrightModule,
    AuthModule,
    UsuariosModule,
    DynamicSchemaModule,
    CronModule,
    ScraperModule,
  ],
  controllers: [],
  providers: [
    /** Global JWT guard: every route requires a valid JWT unless marked @Public(). */
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    /** Global roles guard: enforces @Roles() metadata after JWT is validated. */
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
