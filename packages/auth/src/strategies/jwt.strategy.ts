import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../interfaces/auth.interfaces';

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
 * Passport strategy that validates JWT bearer tokens from the Authorization header.
 *
 * @description Extracts the JWT from the `Authorization: Bearer <token>` header,
 * verifies its signature, issuer, and audience, then calls {@link validate}
 * to build the {@link AuthenticatedUser} object attached to `req.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const config = configService.get<AuthConfig>('auth');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config?.jwt?.secret || 'dev-secret',
      issuer: config?.jwt?.issuer,
      audience: config?.jwt?.audience,
    });
  }

  /**
   * Validates the decoded JWT payload and constructs the authenticated user.
   *
   * @param payload - Decoded JWT payload containing `sub`, `email`, and `roles`
   * @returns An {@link AuthenticatedUser} object attached to the request
   * @throws UnauthorizedException if the payload is missing required fields
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