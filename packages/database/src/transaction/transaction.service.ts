import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

export interface TransactionOptions {
  retry?: boolean;
  maxRetries?: number;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

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
        this.logger.warn(
          `Transaction aborted (attempt ${attempt}): ${error instanceof Error ? error.message : String(error)}`,
        );

        const shouldRetry =
          retry && attempt < maxRetries && this.isTransientError(error);

        if (shouldRetry) {
          session.endSession();
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
    return (
      message.includes('transaction') &&
      (message.includes('retry') ||
        message.includes('abort') ||
        message.includes('commit'))
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
