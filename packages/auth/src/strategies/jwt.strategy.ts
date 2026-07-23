import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../interfaces/auth.interfaces';
import { DEV_JWT_SECRET_FALLBACK } from '../config/auth.config';

interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    issuer: string;
    audience: string;
  };
}

/**
 * Passport JWT strategy for token validation.
 * Extracts Bearer token from Authorization header and verifies it
 * against the configured JWT secret, issuer, and audience.
 *
 * Fails fast at startup if JWT_SECRET is missing or equals the dev fallback.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private static readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const config = configService.get<AuthConfig>('auth');
    const secret = config?.jwt?.secret;

    // C5 / REQ-auth-4 — fail-fast on missing or default-fallback secret.
    if (!secret || secret === DEV_JWT_SECRET_FALLBACK) {
      JwtStrategy.logger.error(
        'JwtStrategy: JWT secret missing or equal to dev fallback. Refusing to start.',
      );
      throw new Error(
        'JwtStrategy: JWT secret missing or equal to dev fallback. ' +
          'Set JWT_SECRET to a strong value before starting the application.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: config?.jwt?.issuer,
      audience: config?.jwt?.audience,
    });
  }

  /**
   * Validate the JWT payload and return the authenticated user.
   * Called automatically by Passport after successful token verification.
   *
   * @param payload - Decoded JWT payload containing sub, email, roles
   * @returns AuthenticatedUser attached to request.user
   * @throws UnauthorizedException if payload is missing required fields
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}
