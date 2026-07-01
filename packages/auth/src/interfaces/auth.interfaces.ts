/**
 * JWT token payload carried inside access tokens.
 *
 * @description Standard JWT claims plus application-specific roles.
 * Validated by {@link JwtStrategy.validate}.
 */
export interface JwtPayload {
  /** Subject identifier (user ID) */
  sub: string;
  /** User email address */
  email: string;
  /** Optional role assignments for RBAC */
  roles?: string[];
  /** Issued-at timestamp (set by JWT library) */
  iat?: number;
  /** Expiration timestamp (set by JWT library) */
  exp?: number;
}

/**
 * Response returned after a successful login or token refresh.
 */
export interface TokenResponse {
  /** Signed JWT access token */
  accessToken: string;
  /** Opaque refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Access token lifetime in seconds */
  expiresIn: number;
}

/**
 * Represents a user after successful authentication.
 *
 * @description Attached to the Express request object by Passport
 * strategies and available via `req.user`.
 */
export interface AuthenticatedUser {
  /** Unique user identifier */
  id: string;
  /** User email address */
  email: string;
  /** Role assignments for authorization checks */
  roles: string[];
}

/**
 * Persistence model for a refresh token.
 *
 * @description Tracks the lifecycle of a refresh token including
 * its associated user, expiration, and revocation status.
 */
export interface RefreshTokenData {
  /** User this token belongs to */
  userId: string;
  /** Opaque refresh token string */
  token: string;
  /** When this token expires */
  expiresAt: Date;
  /** Whether the token has been explicitly revoked */
  isRevoked: boolean;
}