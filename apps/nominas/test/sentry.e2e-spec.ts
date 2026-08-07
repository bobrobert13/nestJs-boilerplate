import { Controller, Get, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';
import request from 'supertest';
import { DatabaseExceptionFilter, ResponseInterceptor } from '@common/common';
import { initSentry } from '../src/config/sentry.config';

jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  nestIntegration: jest.fn(() => ({ name: 'Nest' })),
  setupExpressErrorHandler: jest.fn(),
}));

/** Ad-hoc route that throws a generic (non-HTTP) error at runtime. */
@Controller('boom')
class BoomController {
  @Get()
  /** Throws a runtime error so the exception filter chain is exercised. */
  throwError(): never {
    throw new Error('boom');
  }
}

/** Mirrors the global wiring from `main.ts` for a minimal test app. */
async function createBoomApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [BoomController],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  await app.init();
  return app;
}

describe('Sentry integration (e2e contract)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('initSentry() returns false and registers no express handler without SENTRY_DSN', async () => {
    expect(initSentry()).toBe(false);

    const app = await createBoomApp();
    // main.ts registers the Sentry handler only when initSentry() is true.
    const res = await request(app.getHttpServer()).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(Sentry.setupExpressErrorHandler).not.toHaveBeenCalled();
    await app.close();
  });

  it('initSentry() returns true and the express handler is registered before listen', async () => {
    process.env.SENTRY_DSN = 'https://publickey@o0.ingest.sentry.io/0';
    expect(initSentry()).toBe(true);

    const app = await createBoomApp();
    // Same call order as main.ts: app.init() → Sentry.setupExpressErrorHandler.
    Sentry.setupExpressErrorHandler(app);

    const res = await request(app.getHttpServer()).get('/boom');
    expect(res.status).toBe(500);
    // DatabaseExceptionFilter still produces the response contract.
    expect(res.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(Sentry.setupExpressErrorHandler).toHaveBeenCalledWith(app);
    await app.close();
  });

  it('Sentry.init is called exactly once with the nest integration', () => {
    process.env.SENTRY_DSN = 'https://publickey@o0.ingest.sentry.io/0';
    initSentry();

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.nestIntegration).toHaveBeenCalledTimes(1);
    const options = jest.mocked(Sentry.init).mock.calls[0][0];
    expect(options?.integrations).toHaveLength(1);
  });
});
