import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private retryCount = 0;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async connectWithRetry(): Promise<void> {
    const config = this.configService.get<DatabaseConfig>('database');
    if (!config) {
      this.logger.error('Database configuration is not available');
      return;
    }

    const { uri, options, retry } = config;
    const connectOptions: ConnectOptions = {
      ...options,
    };

    try {
      this.logger.log(
        `Attempting to connect to MongoDB... (Attempt ${this.retryCount + 1})`,
      );
      await mongoose.connect(uri, connectOptions);

      this.logger.log('✅ Successfully connected to MongoDB');
      this.retryCount = 0; // Reset retry count on success
      this.setupEventListeners();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ MongoDB connection error: ${errorMessage}`);

      if (this.retryCount < retry.maxRetries) {
        const delay = this.calculateBackoff(
          retry.initialDelayMs,
          retry.maxDelayMs,
        );
        this.logger.warn(`Retrying connection in ${delay}ms...`);

        this.retryCount++;
        setTimeout(() => {
          void this.connectWithRetry();
        }, delay);
      } else {
        this.logger.error(
          '🚨 Max MongoDB connection retries reached. Server will continue without DB connection.',
        );
      }
    }
  }

  private calculateBackoff(initialDelay: number, maxDelay: number): number {
    const delay = initialDelay * Math.pow(2, this.retryCount);
    return Math.min(delay, maxDelay);
  }

  private setupEventListeners(): void {
    mongoose.connection.on('disconnected', () => {
      this.logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
      this.retryCount = 0;
      this.connectWithRetry();
    });

    mongoose.connection.on('error', (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`MongoDB connection error: ${errorMessage}`);
    });

    mongoose.connection.on('connected', () => {
      this.logger.log('✅ MongoDB reconnected');
    });
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    this.logger.log('MongoDB connection closed');
  }
}
