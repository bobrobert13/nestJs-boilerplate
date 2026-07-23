import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  Inject,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import argon2 from 'argon2';
import type {
  IUserService,
  IRefreshTokenStore,
} from '../interfaces/auth.interfaces';
import {
  JwtPayload,
  TokenResponse,
  AuthenticatedUser,
  USER_SERVICE,
  REFRESH_TOKEN_STORE,
} from '../interfaces/auth.interfaces';

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
  /** ponytail: fallback store when no IRefreshTokenStore is registered. */
  private readonly memoryStore: Map<
    string,
    { userId: string; email: string; roles: string[]; expiresAt: Date }
  > = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional()
    @Inject(USER_SERVICE)
    private readonly userService?: IUserService,
    @Optional()
    @Inject(REFRESH_TOKEN_STORE)
    private readonly tokenStore?: IRefreshTokenStore,
  ) {}

  /**
   * Validate a user by email + password.
   *
   * If an {@link IUserService} provider is wired, it delegates to
   * `userService.findByEmail()` + argon2 comparison.  Otherwise it
   * falls back to the built-in demo stub (`demo@example.com` / `demo123`).
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    // PR3 / M4 â€” log userId-or-redacted, never the email.
    this.logger.log(`Validating user: redacted`);

    // Real path â€” consumer provided an IUserService
    if (this.userService) {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        this.logger.warn(`User not found: redacted`);
        return null;
      }

      const valid = await this.comparePassword(password, user.password);
      if (!valid) {
        this.logger.warn(`Invalid password for userId=${user.id}`);
        return null;
      }

      return { id: user.id, email: user.email, roles: user.roles };
    }

    // Fallback â€” demo stub
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
   * Register a new user account.
   * Delegates to IUserService if wired, otherwise uses demo stub.
   *
   * @param email - User email address
   * @param password - Plain text password (will be hashed with argon2)
   * @param name - Optional display name
   * @returns AuthenticatedUser with id, email, and roles
   * @throws ConflictException if user already exists
   */
  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthenticatedUser> {
    this.logger.log(`Registering user: ${email}`);

    if (email === 'demo@example.com') {
      throw new ConflictException('User already exists');
    }

    // If an IUserService is wired (e.g. UsuariosService), delegate to it
    // so the user is persisted in MongoDB. Otherwise fall back to the demo stub.
    if (this.userService) {
      const hashedPassword = await this.hashPassword(password);
      const user = await this.userService.createUser(
        email,
        hashedPassword,
        name,
      );
      return { id: user.id, email: user.email, roles: user.roles };
    }

    // Fallback â€” demo stub (no persistence)
    await this.hashPassword(password);
    this.logger.debug(`Password hashed for ${email}`);

    return {
      id: `user-${Date.now()}`,
      email,
      roles: ['user'],
    };
  }

  /**
   * Authenticate a user and return access + refresh tokens.
   *
   * @param user - Authenticated user object
   * @returns TokenResponse with accessToken, refreshToken, and user info
   */
  async login(user: AuthenticatedUser): Promise<TokenResponse> {
    this.logger.log(`User login: ${user.email}`);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  /**
   * Refresh an access token using a valid refresh token.
   * Implements refresh token rotation with reuse detection:
   * - If the token store supports rotate(), uses atomic rotation with family tracking
   * - Detects token reuse (theft) and revokes the entire family
   * - Falls back to simple in-memory rotation for legacy/test scenarios
   *
   * @param refreshToken - The current refresh token to rotate
   * @returns TokenResponse with new access and refresh tokens
   * @throws UnauthorizedException if token is invalid, expired, or reuse detected
   */
  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    // PR2 / H3 â€” use the Mongoose-backed rotation path when the store
    // exposes `rotate`; otherwise fall back to the in-memory rotation.
    if (
      this.tokenStore &&
      typeof (this.tokenStore as any).rotate === 'function'
    ) {
      const config = this.configService.get<AuthConfig>('auth');
      const ttl = config?.jwt?.refreshTokenTtl || 604800;
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const newRaw = randomBytes(48).toString('base64url');

      // PR2 / H3 â€” reuse detection. If the presented token already has
      // `revokedAt` set, treat it as theft: revoke the whole family and
      // respond 401.
      const existing = await this.tokenStore.find(refreshToken);
      if (!existing) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      if (existing.expiresAt.getTime() < Date.now()) {
        await this.tokenStore.delete(refreshToken);
        throw new UnauthorizedException('Refresh token expired');
      }

      const rotated = await (this.tokenStore as any).rotate(
        refreshToken,
        newRaw,
        expiresAt,
      );
      if (!rotated) {
        // The predecessor is already revoked â†’ reuse attempt.
        if (typeof (this.tokenStore as any).revokeFamily === 'function') {
          await (this.tokenStore as any).revokeFamily(refreshToken);
        }
        throw new UnauthorizedException('Refresh token reuse detected');
      }

      const user: AuthenticatedUser = {
        id: rotated.userId,
        email: rotated.email,
        roles: rotated.roles,
      };
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        roles: user.roles,
      } as JwtPayload);
      return {
        accessToken,
        refreshToken: newRaw,
        expiresIn: 900,
      };
    }

    // Legacy in-memory rotation (kept for tests / fallback).
    const tokenData = await this.loadToken(refreshToken);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (new Date() > tokenData.expiresAt) {
      await this.deleteToken(refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }
    await this.deleteToken(refreshToken);
    const user: AuthenticatedUser = {
      id: tokenData.userId,
      email: tokenData.email,
      roles: tokenData.roles,
    };
    return this.login(user);
  }

  /**
   * Logout by revoking the refresh token (and its family if supported).
   *
   * @param refreshToken - The refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    // PR2 / H3 â€” revoke the entire family so descendant tokens can't be
    // replayed.
    if (
      this.tokenStore &&
      typeof (this.tokenStore as any).revokeFamily === 'function'
    ) {
      await (this.tokenStore as any).revokeFamily(refreshToken);
    } else {
      await this.deleteToken(refreshToken);
    }
    this.logger.log('User logged out');
  }

  /**
   * Verify and decode a JWT access token.
   *
   * @param token - JWT string to validate
   * @returns Decoded JwtPayload
   * @throws UnauthorizedException if token is invalid or expired
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Hash a password using argon2id with configured parameters.
   *
   * @param password - Plain text password to hash
   * @returns Argon2 hash string
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
   * Compare a plain text password against an argon2 hash.
   *
   * @param password - Plain text password to verify
   * @param hash - Stored argon2 hash to compare against
   * @returns true if password matches, false otherwise
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error(
        `Password comparison failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async createRefreshToken(user: AuthenticatedUser): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const config = this.configService.get<AuthConfig>('auth');
    const ttl = config?.jwt?.refreshTokenTtl || 604800;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await this.saveToken(token, user.id, user.email, user.roles, expiresAt);
    return token;
  }

  /** Save token via the injected store or fall back to the in-memory Map. */
  private async saveToken(
    token: string,
    userId: string,
    email: string,
    roles: string[],
    expiresAt: Date,
  ): Promise<void> {
    if (this.tokenStore) {
      await this.tokenStore.save(token, userId, email, roles, expiresAt);
    } else {
      this.memoryStore.set(token, { userId, email, roles, expiresAt });
    }
  }

  /** Load token via the injected store or fall back to the in-memory Map. */
  private async loadToken(token: string): Promise<{
    userId: string;
    email: string;
    roles: string[];
    expiresAt: Date;
  } | null> {
    if (this.tokenStore) {
      return this.tokenStore.find(token);
    }
    return this.memoryStore.get(token) ?? null;
  }

  /** Delete token via the injected store or fall back to the in-memory Map. */
  private async deleteToken(token: string): Promise<void> {
    if (this.tokenStore) {
      await this.tokenStore.delete(token);
    } else {
      this.memoryStore.delete(token);
    }
  }
}
