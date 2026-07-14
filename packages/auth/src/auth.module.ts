import { Module, Global, Logger, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BootstrapLogger, LogCategory } from '@common/common';
import { AuthService } from './services/auth.service';
import { MagicLinkService } from './services/magic-link.service';
import { MongoRefreshTokenStore } from './services/mongo-refresh-token-store.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './strategies/auth.controller';
import { REFRESH_TOKEN_STORE } from './interfaces/auth.interfaces';
import authConfig from './config/auth.config';

interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    issuer: string;
    audience: string;
  };
}

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<AuthConfig>('auth');
        return {
          secret: config?.jwt?.secret || 'dev-secret',
          signOptions: {
            expiresIn: config?.jwt?.accessTokenTtl || 900,
            issuer: config?.jwt?.issuer,
            audience: config?.jwt?.audience,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MagicLinkService,
    MongoRefreshTokenStore,
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    RolesGuard,
    { provide: REFRESH_TOKEN_STORE, useExisting: MongoRefreshTokenStore },
  ],
  exports: [
    AuthService,
    MagicLinkService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  onModuleInit() {
    this.logger.log('✅ AuthModule initialized successfully');
    this.logger.log('   - JWT authentication: enabled');
    this.logger.log('   - Magic Links: available');
    this.logger.log('   - Roles Guard: available');

    BootstrapLogger.log(LogCategory.AUTH, 'JWT · MagicLink · Roles Guard', 'enabled');
  }
}