import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { TransactionService } from './transaction.service';

/**
 * Configuration options for transactional operations.
 */
export interface TransactionalOptions {
  /** Whether to auto-retry on transient errors (default: true) */
  retry?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** MongoDB transaction isolation level */
  isolationLevel?: 'read uncommitted' | 'read committed' | 'snapshot' | 'serializable';
}

/**
 * Wraps operations in MongoDB transactions with optional isolation level control.
 *
 * Provides programmatic access to transactions without decorators,
 * useful when you need explicit control over isolation levels.
 *
 * @example
 * ```typescript
 * const result = await transactional.execute(async (session) => {
 *   return await this.repo.create(data, { session });
 * }, { isolationLevel: 'snapshot' });
 * ```
 */
@Injectable()
export class TransactionalWrapper {
  private readonly logger = new Logger(TransactionalWrapper.name);
  private transactionService: TransactionService;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.transactionService = new TransactionService(connection);
  }

  /**
   * Executes an operation within a MongoDB transaction.
   *
   * @param operation - Async function that receives a session and returns a result
   * @param options - Transaction configuration (retry, isolation level)
   * @returns The result of the operation
   */
  async execute<T>(
    operation: (session: ClientSession) => Promise<T>,
    options: TransactionalOptions = {},
  ): Promise<T> {
    this.logger.debug('Starting transactional operation');
    return this.transactionService.withTransaction(operation, {
      retry: options.retry ?? true,
      maxRetries: options.maxRetries ?? 3,
    });
  }

  /**
   * Starts and returns a new MongoDB client session.
   * The caller is responsible for ending the session.
   *
   * @returns A new ClientSession instance
   */
  getSession(): Promise<ClientSession> {
    return this.connection.startSession();
  }
}