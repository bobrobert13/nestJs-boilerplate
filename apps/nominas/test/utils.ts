import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { DatabaseExceptionFilter, ResponseInterceptor } from '@common/common';
import { AppModule } from '../src/app.module';

/**
 * Ephemeral MongoDB ReplicaSet shared by the test app lifecycle.
 * `mongodb-memory-server` downloads and caches the mongod binary on
 * first run; no Docker or external MongoDB is required.
 */
let replSet: MongoMemoryReplSet | undefined;

/** JWT secret for E2E runs — must be ≥32 chars so JwtStrategy accepts it. */
const TEST_JWT_SECRET = 'e2e-test-secret-not-for-production-32chars';

/**
 * Creates and initializes the full NestJS application against an
 * ephemeral in-memory MongoDB ReplicaSet (transactions supported).
 *
 * Mirrors the global wiring from `apps/nominas/src/main.ts`:
 * global prefix `api`, strict ValidationPipe, DatabaseExceptionFilter
 * and the ResponseInterceptor envelope.
 *
 * @returns The initialized NestJS application (use `app.getHttpServer()`
 *          as the supertest target).
 */
export async function createTestApp(): Promise<INestApplication> {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  // Env must be set BEFORE AppModule compiles: database.config.ts reads
  // process.env.MONGODB_URI directly and validateEnv() runs at compile time.
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('boilerplate_test');
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  await app.init();
  return app;
}

/**
 * Closes the test application and stops the ephemeral MongoDB ReplicaSet.
 * Always call from `afterAll()` so no orphan mongod processes remain.
 *
 * @param app - The application returned by {@link createTestApp}.
 */
export async function teardownTestApp(app: INestApplication): Promise<void> {
  await app.close();
  if (replSet) {
    await replSet.stop();
    replSet = undefined;
  }
}
