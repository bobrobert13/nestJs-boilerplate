/**
 * Injection token for the refresh-token persistence store.
 *
 * The default {@link MongoRefreshTokenStore} is registered in
 * {@link AuthModule} via `useExisting`.  Consumers can override it
 * with a custom implementation (e.g. Redis) using a `CustomProvider`.
 *
 * @example
 * ```typescript
 * // In your AppModule or a FeatureModule:
 * { provide: REFRESH_TOKEN_STORE, useClass: RedisRefreshTokenStore }
 * ```
 */
export const REFRESH_TOKEN_STORE = Symbol('REFRESH_TOKEN_STORE');

/**
 * Metadata persisted alongside each refresh token.
 */
export interface RefreshTokenRecord {
  userId: string;
  email: string;
  roles: string[];
  expiresAt: Date;
}

/**
 * Contract for storing and retrieving refresh-token metadata.
 *
 * The default in-memory implementation persists data only within a
 * single Node.js process.  Replace with a durable store (MongoDB,
 * Redis, etc.) for production.
 */
export interface IRefreshTokenStore {
  /**
   * Persist a refresh token with its associated user and expiry.
   * @param token   Opaque hex token string (will be hashed before storage).
   * @param userId  The authenticated user's identifier.
   * @param email   The user's email address (needed for token rotation).
   * @param roles   The user's role list.
   * @param expiresAt  Absolute expiry date.
   * @param meta    Optional creation metadata (IP, user agent).
   */
  save(
    token: string,
    userId: string,
    email: string,
    roles: string[],
    expiresAt: Date,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<{ familyId: string }>;

  /**
   * Look up a refresh token (raw, will be hashed internally).
   * @returns The stored metadata, or `null` when the token is unknown.
   */
  find(token: string): Promise<RefreshTokenRecord | null>;

  /**
   * Remove a refresh token (used for logout or rotation).
   */
  delete(token: string): Promise<void>;

  /**
   * PR2 / H3: atomically rotate a refresh token. Marks the old token as
   * replaced + revoked, persists the successor, and links them via
   * `replacedBy` / `familyId`. Returns null if the old token is missing
   * or already revoked (caller must respond with 401).
   */
  rotate(
    oldToken: string,
    newToken: string,
    expiresAt: Date,
  ): Promise<RefreshTokenRecord | null>;

  /**
   * PR2 / H3: revoke the entire family of the supplied token. Used when a
   * rotated token is reused (token theft detection). Returns the number
   * of rows touched (chain members).
   */
  revokeFamily(rawToken: string): Promise<number>;
}
