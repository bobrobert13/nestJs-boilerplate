import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { TransactionService } from './transaction.service';

export interface TransactionalOptions {
  retry?: boolean;
  maxRetries?: number;
  isolationLevel?: 'read uncommitted' | 'read committed' | 'snapshot' | 'serializable';
}

@Injectable()
export class TransactionalWrapper {
  private readonly logger = new Logger(TransactionalWrapper.name);
  private transactionService: TransactionService;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.transactionService = new TransactionService(connection);
  }

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

  getSession(): Promise<ClientSession> {
    return this.connection.startSession();
  }
}