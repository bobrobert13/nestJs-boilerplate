import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BootstrapLogger, LogCategory } from '@common/common';
import mongoose, { ConnectOptions } from 'mongoose';

interface DatabaseConfig {
  uri: string;
  options: {
    autoIndex: boolean;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    replicaSet?: string;
    directConnection?: boolean;
  };
  retry: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
  };
}

/**
 * Service that manages the lifecycle of a Mongoose connection to MongoDB.
 *
 * Implements exponential backoff retry on connect failure, automatic
 * reconnection on disconnect, and exposes lifecycle hooks for NestJS.
 *
 * @see {@link TransactionService} for transactional operations.
 */
@Injectable()
export class DatabaseService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(DatabaseService.name);
  private retryCount = 0;

  /**
   * M9 / hardening-medium-low — the pending retry timer (if any) so
   * shutdown can cancel it. Stored as a number because Node's setTimeout
   * returns NodeJS.Timeout in modern targets; we accept either.
   */
  private pendingRetry: ReturnType<typeof setTimeout> | null = null;
  private shuttingDown = false;
  private removingListeners = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * NestJS lifecycle hook invoked automatically during module init.
   * Kicks off the async connection with retry logic.
   *
   * @returns Resolves when the initial attempt has been processed.
   */
  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  /**
   * Establish a MongoDB connection using exponential backoff retry logic.
   *
   * Reads config from ConfigService under the database namespace. On
   * failure, retries up to config.retry.maxRetries times with backoff:
   * delay_ms = min(initialDelayMs * 2^attempt, maxDelayMs). After the
   * last retry the server continues without DB (does not crash).
   *
   * @returns Resolves immediately when the connection succeeds;
   *          returns silently if all retries are exhausted.
   */
  async connectWithRetry(): Promise<void> {
    // Shutdown guard: never start (or continue) a connection cycle once
    // teardown has begun — otherwise a 'disconnected' event racing with
    // module destroy keeps the event loop alive forever.
    if (this.shuttingDown) return;

    const config = this.configService.get<DatabaseConfig>('database');
    if (!config) {
      this.logger.error('Database configuration is not available');
      return;
    }

    const { uri, options, retry } = config;
    const connectOptions: ConnectOptions = { ...options };

    try {
      this.logger.log(
        `Attempting to connect to MongoDB... (Attempt ${this.retryCount + 1})`,
      );
      BootstrapLogger.log(
        LogCategory.DB,
        `Connecting... attempt ${this.retryCount + 1}`,
      );
      await mongoose.connect(uri, connectOptions);
      this.logger.log('Successfully connected to MongoDB');
      BootstrapLogger.log(LogCategory.DB, 'Connected', 'boilerplate_db');
      this.retryCount = 0;
      this.setupEventListeners();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`MongoDB connection error: ${errorMessage}`);

      if (this.retryCount < retry.maxRetries) {
        const delay = this.calculateBackoff(
          retry.initialDelayMs,
          retry.maxDelayMs,
        );
        this.logger.warn(`Retrying connection in ${delay}ms...`);
        this.retryCount++;
        if (!this.shuttingDown) {
          this.pendingRetry = setTimeout(() => {
            this.pendingRetry = null;
            void this.connectWithRetry();
          }, delay);
        }
      } else {
        this.logger.error(
          'Max MongoDB connection retries reached. Server continues without DB.',
        );
        BootstrapLogger.log(
          LogCategory.DB,
          'Connection failed',
          'max retries reached',
        );
      }
    }
  }

  /**
   * Compute the delay (in ms) for the next retry attempt using
   * exponential backoff: delay = min(initialDelay * 2^attempt, maxDelay).
   *
   * @param initialDelay - Base delay in ms (e.g. 1000 from config).
   * @param maxDelay - Cap on the returned delay (e.g. 30000).
   * @returns The delay in ms for the next retry attempt.
   */
  private calculateBackoff(initialDelay: number, maxDelay: number): number {
    const delay = initialDelay * Math.pow(2, this.retryCount);
    return Math.min(delay, maxDelay);
  }

  /**
   * Subscribe to Mongoose connection lifecycle events.
   *
   * - disconnected: triggers a full reconnect (resets retryCount).
   * - error: logs the underlying error message.
   * - connected: confirms a successful (re)connection.
   *
   * @internal Invoked automatically after a successful connection.
   */
  private setupEventListeners(): void {
    if (this.shuttingDown) return;
    // Guard against duplicate registration across reconnect cycles.
    mongoose.connection.removeListener('disconnected', this.onDisconnected);
    mongoose.connection.on('disconnected', this.onDisconnected);
    mongoose.connection.on('error', (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`MongoDB connection error: ${errorMessage}`);
    });
    mongoose.connection.on('connected', () => {
      this.logger.log('MongoDB reconnected');
    });
  }

  /**
   * 'disconnected' handler: reconnects automatically, unless the app is
   * shutting down or the listeners are being removed (graceful close).
   * Named (arrow) field so it can be deregistered on disconnect.
   */
  private onDisconnected = (): void => {
    if (this.shuttingDown || this.removingListeners) return;
    this.logger.warn('MongoDB disconnected. Attempting to reconnect...');
    this.retryCount = 0;
    void this.connectWithRetry();
  };

  /**
   * Gracefully close the MongoDB connection. M9 / hardening-medium-low
   * also clears any pending retry timer so the Node process exits
   * cleanly. The reconnect listener is deregistered first so the
   * 'disconnected' event emitted by mongoose.disconnect() does not
   * trigger a new connection cycle.
   */
  async disconnect(): Promise<void> {
    this.shuttingDown = true;
    this.removingListeners = true;
    mongoose.connection.removeListener('disconnected', this.onDisconnected);
    this.removingListeners = false;
    if (this.pendingRetry) {
      clearTimeout(this.pendingRetry);
      this.pendingRetry = null;
    }
    await mongoose.disconnect();
    this.logger.log('MongoDB connection closed');
  }

  /**
   * NestJS lifecycle hook invoked during `app.close()` teardown, before
   * MongooseModule disposes its own connection. Marks the service as
   * shutting down and closes the connection so no reconnect cycle can
   * keep the event loop alive after shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * M9 — invoked by Nest when `enableShutdownHooks` is on (SIGTERM,
   * SIGINT). Cancels any pending retry timer so the process exits
   * promptly instead of waiting for the backoff to elapse.
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    this.shuttingDown = true;
    if (this.pendingRetry) {
      clearTimeout(this.pendingRetry);
      this.pendingRetry = null;
    }
    this.logger.log(`DatabaseService shutdown (${signal ?? 'unknown'})`);
  }
}
