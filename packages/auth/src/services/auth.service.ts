import { Injectable, Logger, UnauthorizedException, ConflictException, Inject, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import argon2 from 'argon2';
import type { IUserService } from '../interfaces/auth.interfaces';
import { JwtPayload, TokenResponse, AuthenticatedUser, USER_SERVICE } from '../interfaces/auth.interfaces';

interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    issuer: string;
    audience: string;
  };
  argon2: {
    type: number;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenStore: Map<string, { userId: string; expiresAt: Date }> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() @Inject(USER_SERVICE) private readonly userService?: IUserService,
  ) {}

  /**
   * Validate a user by email + password.
   *
   * If an {@link IUserService} provider is wired, it delegates to
   * `userService.findByEmail()` + argon2 comparison.  Otherwise it
   * falls back to the built-in demo stub (`demo@example.com` / `demo123`).
   */
  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    this.logger.log(`Validating user: ${email}`);

    // Real path — consumer provided an IUserService
    if (this.userService) {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        this.logger.warn(`User not found: ${email}`);
        return null;
      }

      const valid = await this.comparePassword(password, user.password);
      if (!valid) {
        this.logger.warn(`Invalid password for user: ${email}`);
        return null;
      }

      return { id: user.id, email: user.email, roles: user.roles };
    }

    // Fallback — demo stub
    if (email === 'demo@example.com' && password === 'demo123') {
      return {
        id: 'demo-user-id',
        email: 'demo@example.com',
        roles: ['user'],
      };
    }

    return null;
  }

  async register(email: string, password: string, name?: string): Promise<AuthenticatedUser> {
    this.logger.log(`Registering user: ${email}`);

    if (email === 'demo@example.com') {
      throw new ConflictException('User already exists');
    }

    return {
      id: `user-${Date.now()}`,
      email,
      roles: ['user'],
    };
  }

  async login(user: AuthenticatedUser): Promise<TokenResponse> {
    this.logger.log(`User login: ${user.email}`);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const tokenData = this.refreshTokenStore.get(refreshToken);

    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user: AuthenticatedUser = {
      id: tokenData.userId,
      email: 'demo@example.com',
      roles: ['user'],
    };

    return this.login(user);
  }

  async logout(refreshToken: string): Promise<void> {
    this.refreshTokenStore.delete(refreshToken);
    this.logger.log('User logged out');
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const config = this.configService.get<AuthConfig>('auth');
    const argon2Options = {
      type: (config?.argon2?.type ?? argon2.argon2id) as 0 | 1 | 2,
      memoryCost: config?.argon2?.memoryCost ?? 65536,
      timeCost: config?.argon2?.timeCost ?? 3,
      parallelism: config?.argon2?.parallelism ?? 4,
    };

    this.logger.debug('Hashing password with argon2id');
    return argon2.hash(password, argon2Options);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error(`Password comparison failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private createRefreshToken(userId: string): string {
    const token = randomBytes(32).toString('hex');
    const config = this.configService.get<AuthConfig>('auth');
    const ttl = config?.jwt?.refreshTokenTtl || 604800;

    this.refreshTokenStore.set(token, {
      userId,
      expiresAt: new Date(Date.now() + ttl * 1000),
    });

    return token;
  }
}