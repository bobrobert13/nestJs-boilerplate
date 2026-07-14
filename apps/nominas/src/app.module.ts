import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@common/database';
import { PlaywrightModule } from '@common/playwright';
import { AuthModule, JwtAuthGuard, RolesGuard } from '@common/auth';
import { BootstrapLogger, ThrottlerGuard } from '@common/common';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { DynamicSchemaModule } from './modules/dynamic-schema/dynamic-schema.module';
import { HealthModule } from './modules/health/health.module';
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
    HealthModule,
    CronModule,
    ScraperModule,
  ],
  controllers: [],
  providers: [
    /** Global JWT guard: every route requires a valid JWT unless marked @Public(). */
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    /** Global roles guard: enforces @Roles() metadata after JWT is validated. */
    { provide: APP_GUARD, useClass: RolesGuard },
    /** Global rate limiter: 20 req/60s per IP by default. Override with @Throttle(). */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  // eslint-disable-next-line no-unused-vars -- used via this.configService in onApplicationBootstrap
  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap(): void {
    const features: Record<string, string> = {};

    // MongoDB — check if database config is available
    const dbConfig = this.configService.get<{ uri: string }>('database');
    features['MongoDB'] = dbConfig?.uri ? 'connected' : 'not configured';

    // Auth — always enabled via AuthModule
    features['Auth'] = 'JWT · MagicLink · Roles';

    // Playwright — check if headless mode is configured
    const pw = this.configService.get<{ headless?: boolean }>('playwright');
    features['Playwright'] =
      pw?.headless != null
        ? `Chromium (headless: ${pw.headless})`
        : 'not configured';

    // Resend
    features['Resend'] = this.configService.get<string>('RESEND_API_KEY')
      ? 'configured'
      : 'API key not set (disabled)';

    // Dynamic Schema
    const legacy = this.configService.get<string>('DYNAMIC_SCHEMA_LEGACY');
    features['Dynamic Schema'] = legacy === 'true' ? 'legacy mode' : 'enabled';

    // AI Providers — list configured ones
    const aiProviders: string[] = [];
    if (this.configService.get<string>('OPENAI_API_KEY'))
      aiProviders.push('openai');
    if (this.configService.get<string>('ANTHROPIC_API_KEY'))
      aiProviders.push('anthropic');
    if (this.configService.get<string>('GEMINI_API_KEY'))
      aiProviders.push('gemini');
    if (this.configService.get<string>('MOONSHOT_API_KEY'))
      aiProviders.push('moonshot');
    if (this.configService.get<string>('MINIMAX_API_KEY'))
      aiProviders.push('minimax');
    features['AI Providers'] =
      aiProviders.length > 0 ? aiProviders.join(' · ') : 'none configured';

    BootstrapLogger.section('Feature Availability');
    BootstrapLogger.summary(features);
  }
}
