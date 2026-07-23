import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { TransactionManager } from './transaction';
import databaseConfig from './config/database.config';

interface DatabaseConfig {
  uri: string;
  options: {
    autoIndex: boolean;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
  };
  retry: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
  };
}

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = configService.get<DatabaseConfig>('database');
        // uri is guaranteed by validateEnv() default; fallback for safety only
        return {
          uri:
            config?.uri ??
            'mongodb://localhost:27017/boilerplate_db?replicaSet=rs0',
          // Forward connection options so Mongoose fails fast (5s)
          // instead of the default 30s serverSelectionTimeoutMS.
          serverSelectionTimeoutMS:
            config?.options?.serverSelectionTimeoutMS ?? 5000,
          socketTimeoutMS: config?.options?.socketTimeoutMS ?? 45000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService, TransactionManager],
  exports: [DatabaseService, MongooseModule, TransactionManager],
})
export class DatabaseModule {}
