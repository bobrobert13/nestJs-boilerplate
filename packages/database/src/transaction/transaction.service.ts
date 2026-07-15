import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

/**
 * Transaction options for controlling retry behavior.
 */
export interface TransactionOptions {
  /** Whether to auto-retry on transient errors (default: true) */
  retry?: boolean;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Execute a callback within a MongoDB transaction with automatic retry.
   *
   * Use when you need atomic operations across multiple collections.
   * The operation will be retried automatically if a transient error occurs
   * (e.g., replica set election, network hiccup).
   *
   * @param operation - Async callback receiving the MongoDB session.
   *                   All database operations within should pass { session }.
   * @param options - { retry: true, maxRetries: 3 } to control retry behavior
   * @returns The result of the operation
   *
   * @example
   * ```typescript
   * const order = await this.transaction.withTransaction(async (session) => {
   *   const o = await this.orderRepo.create(dto, { session });
   *   await this.inventoryService.decrementStock(dto.items, { session });
   *   return o;
   * });
   * ```
   */
  async withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    const { retry = true, maxRetries = 3 } = options;
    let attempt = 0;

    const executeWithRetry = async (): Promise<T> => {
      attempt++;
      const session = await this.connection.startSession();

      try {
        session.startTransaction();
        this.logger.debug(`Transaction started (attempt ${attempt})`);

        const result = await operation(session);

        await session.commitTransaction();
        this.logger.debug('Transaction committed successfully');
        return result;
      } catch (error) {
        await session.abortTransaction();
        this.logger.warn(`Transaction aborted (attempt ${attempt}): ${error instanceof Error ? error.message : String(error)}`);

        const shouldRetry = retry && attempt < maxRetries && this.isTransientError(error);

        if (shouldRetry) {
          const delay = Math.min(100 * Math.pow(2, attempt), 1000);
          this.logger.log(`Retrying transaction in ${delay}ms...`);
          await this.sleep(delay);
          return executeWithRetry();
        }

        throw error;
      } finally {
        session.endSession();
      }
    };

    return executeWithRetry();
  }

  /**
   * Execute a callback with a MongoDB session (no transaction).
   * Use when you need session context but not atomic transactions.
   *
   * @param operation - Async callback receiving the MongoDB session
   */
  async withSession<T>(
    operation: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    try {
      return await operation(session);
    } finally {
      session.endSession();
    }
  }

  private isTransientError(error: any): boolean {
    if (error?.hasErrorLabel?.('TransientTransactionError')) {
      return true;
    }
    const message = error?.message?.toLowerCase() ?? '';
    return message.includes('transaction') && (
      message.includes('retry') ||
      message.includes('abort') ||
      message.includes('commit')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
