import { Injectable, Logger, Scope, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

export interface TransactionManagerOptions {
  retry?: boolean;
  maxRetries?: number;
}

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

  /** start (see class JSDoc for context). */
  async start(options: TransactionManagerOptions = {}): Promise<void> {
    if (this.session) {
      this.logger.warn('Transaction already started');
      return;
    }

    const { maxRetries: _maxRetries = 3 } = options;
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

  /** commit (see class JSDoc for context). */
  async commit(): Promise<void> {
    if (!this.session) {
      throw new Error('No active transaction');
    }
    /** if (see class JSDoc for context). */
    if (this.isCommitted || this.isAborted) {
      throw new Error('Transaction already finished');
    }

    await this.session.commitTransaction();
    this.isCommitted = true;
    this.logger.debug('Transaction committed');
  }

  /** abort (see class JSDoc for context). */
  async abort(): Promise<void> {
    if (!this.session) {
      throw new Error('No active transaction');
    }
    /** if (see class JSDoc for context). */
    if (this.isCommitted || this.isAborted) {
      throw new Error('Transaction already finished');
    }

    await this.session.abortTransaction();
    this.isAborted = true;
    this.logger.debug('Transaction aborted');
  }

  /** end (see class JSDoc for context). */
  async end(): Promise<void> {
    if (this.session) {
      await this.session.endSession();
      this.session = null;
    }
  }

  /** getSession (see class JSDoc for context). */
  getSession(): ClientSession {
    if (!this.session) {
      throw new Error('No active transaction. Call start() first.');
    }
    return this.session;
  }

  /** isActive (see class JSDoc for context). */
  isActive(): boolean {
    return this.session !== null && !this.isCommitted && !this.isAborted;
  }

  /** getSessionId (see class JSDoc for context). */
  getSessionId(): string | null {
    if (!this.session?.id) return null;
    return this.session.id.toString();
  }
}
