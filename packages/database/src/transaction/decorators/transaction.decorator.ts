import { SetMetadata } from '@nestjs/common';

export const TRANSACTION_OPTIONS_KEY = 'transaction_options';
export interface TransactionDecoratorOptions {
  retry?: boolean;
  maxRetries?: number;
}

export const Transaction = (options?: TransactionDecoratorOptions) =>
  SetMetadata(TRANSACTION_OPTIONS_KEY, options || {});