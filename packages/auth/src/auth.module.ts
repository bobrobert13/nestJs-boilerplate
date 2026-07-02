import { Module, Global, Logger, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { MagicLinkService } from './services/magic-link.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './rbac/roles.guard';
import { AuthController } from './strategies/auth.controller';
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
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    RolesGuard,
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
  }
}