import { registerAs } from '@nestjs/config';

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
