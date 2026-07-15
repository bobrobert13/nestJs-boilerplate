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
 * Contract for storing and retrieving refresh-token metadata.
 *
 * The default in-memory implementation persists data only within a
 * single Node.js process.  Replace with a durable store (MongoDB,
 * Redis, etc.) for production.
 */
export interface IRefreshTokenStore {
  /**
   * Persist a refresh token with its associated user and expiry.
   * @param token   Opaque hex token string.
   * @param userId  The authenticated user's identifier.
   * @param email   The user's email address (needed for token rotation).
   * @param roles   The user's role list.
   * @param expiresAt  Absolute expiry date.
   */
  save(
    token: string,
    userId: string,
    email: string,
    roles: string[],
    expiresAt: Date,
  ): Promise<void>;

  /**
   * Look up a refresh token.
   * @returns The stored metadata, or `null` when the token is unknown.
   */
  find(
    token: string,
  ): Promise<{ userId: string; email: string; roles: string[]; expiresAt: Date } | null>;

  /**
   * Remove a refresh token (used for logout or rotation).
   */
  delete(token: string): Promise<void>;
}
