import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import argon2 from 'argon2';
import { JwtPayload, TokenResponse, AuthenticatedUser } from '../interfaces/auth.interfaces';

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

/**
 * Core authentication service handling credential validation, registration,
 * JWT token issuance, token refresh, logout, and Argon2 password hashing.
 *
 * @description In-memory demo implementation. Replace `validateUser` and
 * `register` with real database-backed logic for production.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenStore: Map<string, { userId: string; expiresAt: Date }> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates user credentials against the demo user store.
   *
   * @param email - User's email address
   * @param password - User's plaintext password
   * @returns An {@link AuthenticatedUser} if valid, or `null` if credentials are rejected
   */
  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    this.logger.log(`Validating user: ${email}`);
    
    if (email === 'demo@example.com' && password === 'demo123') {
      return {
        id: 'demo-user-id',
        email: 'demo@example.com',
        roles: ['user'],
      };
    }

    return null;
  }

  /**
   * Registers a new user (demo — in-memory only).
   *
   * @param email - New user's email address
   * @param password - New user's plaintext password
   * @param name - Optional display name
   * @returns The newly created {@link AuthenticatedUser}
   * @throws ConflictException if the email is already taken
   */
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

  /**
   * Issues a JWT access token and an opaque refresh token for the given user.
   *
   * @param user - The authenticated user to generate tokens for
   * @returns A {@link TokenResponse} with `accessToken`, `refreshToken`, and `expiresIn`
   */
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

  /**
   * Exchanges a valid refresh token for a new access/refresh token pair.
   *
   * @param refreshToken - The opaque refresh token string
   * @returns A new {@link TokenResponse}
   * @throws UnauthorizedException if the token is invalid or expired
   */
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

  /**
   * Invalidates a refresh token, effectively logging the user out.
   *
   * @param refreshToken - The opaque refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    this.refreshTokenStore.delete(refreshToken);
    this.logger.log('User logged out');
  }

  /**
   * Verifies and decodes a JWT access token.
   *
   * @param token - Raw JWT string to verify
   * @returns The decoded {@link JwtPayload}
   * @throws UnauthorizedException if the token is invalid or expired
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Hashes a plaintext password using argon2id with configurable cost parameters.
   *
   * @param password - Plaintext password to hash
   * @returns The argon2 hash string
   */
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

  /**
   * Compares a plaintext password against an argon2 hash.
   *
   * @param password - Plaintext password to verify
   * @param hash - Argon2 hash to compare against
   * @returns `true` if the password matches the hash
   */
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