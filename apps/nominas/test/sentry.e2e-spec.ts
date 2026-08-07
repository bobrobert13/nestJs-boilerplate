import { Controller, Get, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';
import request from 'supertest';
import { DatabaseExceptionFilter, ResponseInterceptor } from '@common/common';
import {
  attachSentryErrorHandler,
  captureException,
  initSentry,
} from '../src/config/sentry.config';

jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  isEnabled: jest.fn(() => false),
  captureException: jest.fn(),
  nestIntegration: jest.fn(() => ({ name: 'Nest' })),
  setupExpressErrorHandler: jest.fn(),
}));

/** Ad-hoc route that throws a generic (non-HTTP) error at runtime. */
@Controller('boom')
class BoomController {
  /** Throws a runtime error so the exception filter chain is exercised. */
  @Get()
  throwError(): never {
    throw new Error('boom');
  }
}

/** Mirrors the global wiring from `main.ts` for a minimal test app. */
async function createBoomApp(
  capture?: (exception: unknown) => void,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [BoomController],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new DatabaseExceptionFilter(capture));
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

  it('initSentry() returns false without SENTRY_DSN and no express handler is registered', async () => {
    expect(initSentry()).toBe(false);

    const app = await createBoomApp();
    // Same conditional wiring as main.ts.
    attachSentryErrorHandler(app, false);

    const res = await request(app.getHttpServer()).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(Sentry.setupExpressErrorHandler).not.toHaveBeenCalled();
    await app.close();
  });

  it('filter-handled exceptions are captured and the 500 contract is preserved', async () => {
    process.env.SENTRY_DSN = 'https://publickey@o0.ingest.sentry.io/0';
    jest.mocked(Sentry.isEnabled).mockReturnValue(true);
    expect(initSentry()).toBe(true);

    const app = await createBoomApp((exception) => captureException(exception));
    // Same call order as main.ts: app.init() → attachSentryErrorHandler.
    attachSentryErrorHandler(app, true);

    const res = await request(app.getHttpServer()).get('/boom');
    expect(res.status).toBe(500);
    // DatabaseExceptionFilter still produces the response contract.
    expect(res.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    // The consumed exception reached Sentry before the response was sent.
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
    );
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
