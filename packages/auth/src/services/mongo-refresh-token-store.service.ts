import { Injectable, Logger } from '@nestjs/common';
import type { IRefreshTokenStore } from '../interfaces/auth.interfaces';

/**
 * In-memory refresh-token store.
 *
 * **TODO: persist to MongoDB**
 * Replace this in-memory `Map` with a proper MongoDB-backed
 * implementation that survives restarts and works across multiple
 * instances.  The store must implement {@link IRefreshTokenStore}.
 *
 * The in-memory fallback is fine for local development but **will**
 * lose all active refresh tokens on restart and is not suitable for
 * multi‑instance deployments.
 *
 * @see IRefreshTokenStore
 */
@Injectable()
export class MongoRefreshTokenStore implements IRefreshTokenStore {
  private readonly logger = new Logger(MongoRefreshTokenStore.name);
  // TODO: replace with a Mongoose model — see saved comment above.
  private readonly store: Map<
    string,
    { userId: string; email: string; roles: string[]; expiresAt: Date }
  > = new Map();

  async save(
    token: string,
    userId: string,
    email: string,
    roles: string[],
    expiresAt: Date,
  ): Promise<void> {
    this.store.set(token, { userId, email, roles, expiresAt });
    this.logger.debug(`Token saved for user ${userId} (${email})`);
  }

  async find(
    token: string,
  ): Promise<{ userId: string; email: string; roles: string[]; expiresAt: Date } | null> {
    return this.store.get(token) ?? null;
  }

  async delete(token: string): Promise<void> {
    this.store.delete(token);
    this.logger.debug('Token deleted');
  }
}
