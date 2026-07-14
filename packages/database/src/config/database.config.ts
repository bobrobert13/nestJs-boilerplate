import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // MONGODB_URI is already validated/defaulted by validateEnv() in ConfigModule.
  // At this point it is guaranteed to be present.
  const mongodbUri = process.env.MONGODB_URI!;

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
