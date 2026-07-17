import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for transaction options (internal use).
 */
export const TRANSACTION_OPTIONS_KEY = 'transaction_options';

/**
 * Options for the @Transaction decorator.
 */
export interface TransactionDecoratorOptions {
  /** Whether to auto-retry on transient errors (default: true) */
  retry?: boolean;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Decorator to mark a service method for transaction wrapping.
 * The DatabaseModule sets up a Middleware that wraps any method
 * annotated with @Transaction() in a withTransaction() call.
 *
 * @param options - Optional transaction settings
 *
 * @example
 * ```typescript
 * @Transaction({ retry: true, maxRetries: 3 })
 * async createOrder(dto: CreateOrderDto) {
 *   // Automatically wrapped in withTransaction()
 * }
 * ```
 */
export const Transaction = (options?: TransactionDecoratorOptions) =>
  SetMetadata(TRANSACTION_OPTIONS_KEY, options || {});
