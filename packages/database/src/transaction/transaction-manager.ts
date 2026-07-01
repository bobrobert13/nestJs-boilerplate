import { Injectable, Logger, Scope, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

/** Options for manual transaction lifecycle control. */
export interface TransactionManagerOptions {
  /** Whether to auto-retry on transient errors (default: true) */
  retry?: boolean;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Request-scoped manual transaction manager.
 *
 * Use for complex multi-step operations where you need fine-grained
 * control over commit, abort, and rollback. Always call end() in
 * a finally block.
 *
 * @example
 * ```typescript
 * await this.tm.start({ retry: true, maxRetries: 3 });
 * try {
 *   const session = this.tm.getSession();
 *   // ... operations with session ...
 *   await this.tm.commit();
 * } catch (error) {
 *   await this.tm.abort();
 *   throw error;
 * } finally {
 *   await this.tm.end();
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);
  private session: ClientSession | null = null;
  private isCommitted = false;
  private isAborted = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Optional() private readonly injector?: any,
  ) {}

  /**
   * Start a new transaction.
   * @param options - Transaction options (retry, maxRetries)
   */
  async start(options: TransactionManagerOptions = {}): Promise<void> {
    if (this.session) {
      this.logger.warn('Transaction already started');
      return;
    }

    const { maxRetries = 3 } = options;
    let attempt = 0;

    const startSession = async (): Promise<ClientSession> => {
      attempt++;
      const session = await this.connection.startSession();
      return session;
    };

    this.session = await startSession();
    this.session.startTransaction();
    this.logger.debug(`Transaction started (attempt ${attempt})`);
  }

  /**
   * Commit the current transaction.
   * @throws Error if no active transaction or already finished
   */
  async commit(): Promise<void> {
    if (!this.session) {
      throw new Error('No active transaction');
    }
    if (this.isCommitted || this.isAborted) {
      throw new Error('Transaction already finished');
    }

    await this.session.commitTransaction();
    this.isCommitted = true;
    this.logger.debug('Transaction committed');
  }

  /**
   * Rollback the current transaction.
   * @throws Error if no active transaction or already finished
   */
  async abort(): Promise<void> {
    if (!this.session) {
      throw new Error('No active transaction');
    }
    if (this.isCommitted || this.isAborted) {
      throw new Error('Transaction already finished');
    }

    await this.session.abortTransaction();
    this.isAborted = true;
    this.logger.debug('Transaction aborted');
  }

  /**
   * End the current session. Call in finally block.
   */
  async end(): Promise<void> {
    if (this.session) {
      await this.session.endSession();
      this.session = null;
    }
  }

  /**
   * Get the current MongoDB client session.
   * @returns The active ClientSession
   * @throws Error if no active transaction
   */
  getSession(): ClientSession {
    if (!this.session) {
      throw new Error('No active transaction. Call start() first.');
    }
    return this.session;
  }

  /**
   * Check if a transaction is currently active.
   * @returns true if transaction is started and not yet committed/aborted
   */
  isActive(): boolean {
    return this.session !== null && !this.isCommitted && !this.isAborted;
  }

  /**
   * Get the session ID string for the current transaction.
   * @returns Session ID string or null if no active session
   */
  getSessionId(): string | null {
    if (!this.session?.id) return null;
    return this.session.id.toString();
  }
}