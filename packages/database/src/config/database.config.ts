import { registerAs } from '@nestjs/config';

/**
 * Database configuration registered under the 'database' namespace.
 *
 * Provides MongoDB connection URI, connection options (autoIndex, timeouts,
 * replica set), and retry policy (max retries, delays).
 *
 * Reads from environment variables:
 * - `MONGODB_URI` — MongoDB connection string
 * - `MONGODB_REPLICA_SET` — Replica set name
 * - `MONGODB_DIRECT_CONNECTION` — Force direct connection
 */
export default registerAs('database', () => {
  const mongodbUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/manga_scrapping?replicaSet=rs0';

  if (!process.env.MONGODB_URI) {
    console.warn(
      '⚠️ WARNING: MONGODB_URI is not defined in .env. Using default: mongodb://localhost:27017/manga_scrapping',
    );
  }

  return {
    uri: mongodbUri,
    options: {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      replicaSet: process.env.MONGODB_REPLICA_SET,
      directConnection: process.env.MONGODB_DIRECT_CONNECTION === 'true',
    },
    retry: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
    },
  };
});
