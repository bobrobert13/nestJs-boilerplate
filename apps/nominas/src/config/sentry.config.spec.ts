import * as Sentry from '@sentry/nestjs';
import {
  attachSentryErrorHandler,
  buildSentryOptions,
  captureException,
  emitSentryLog,
  initSentry,
  parseTracesSampleRate,
} from './sentry.config';

jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  isEnabled: jest.fn(() => false),
  captureException: jest.fn(),
  nestIntegration: jest.fn(() => ({ name: 'Nest' })),
  setupExpressErrorHandler: jest.fn(),
  logger: {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  },
}));

/** Well-formed DSN shape accepted by the Sentry SDK. */
const VALID_DSN = 'https://publickey@o0.ingest.sentry.io/0';

describe('buildSentryOptions', () => {
  it('returns null when SENTRY_DSN is missing', () => {
    expect(buildSentryOptions({})).toBeNull();
  });

  it('returns null when SENTRY_DSN is empty or whitespace-only', () => {
    expect(buildSentryOptions({ SENTRY_DSN: '' })).toBeNull();
    expect(buildSentryOptions({ SENTRY_DSN: '   ' })).toBeNull();
  });

  it('returns the trimmed DSN when SENTRY_DSN is set', () => {
    const options = buildSentryOptions({ SENTRY_DSN: ` ${VALID_DSN} ` });
    expect(options).not.toBeNull();
    expect(options?.dsn).toBe(VALID_DSN);
  });

  it('prefers SENTRY_ENVIRONMENT over NODE_ENV', () => {
    const options = buildSentryOptions({
      SENTRY_DSN: VALID_DSN,
      SENTRY_ENVIRONMENT: 'staging',
      NODE_ENV: 'production',
    });
    expect(options?.environment).toBe('staging');
  });

  it('falls back to NODE_ENV when SENTRY_ENVIRONMENT is unset', () => {
    const options = buildSentryOptions({
      SENTRY_DSN: VALID_DSN,
      NODE_ENV: 'production',
    });
    expect(options?.environment).toBe('production');
  });

  it('falls back to "development" when neither SENTRY_ENVIRONMENT nor NODE_ENV is set', () => {
    const options = buildSentryOptions({ SENTRY_DSN: VALID_DSN });
    expect(options?.environment).toBe('development');
  });

  it('parses SENTRY_TRACES_SAMPLE_RATE when provided', () => {
    const options = buildSentryOptions({
      SENTRY_DSN: VALID_DSN,
      SENTRY_TRACES_SAMPLE_RATE: '0.25',
    });
    expect(options?.tracesSampleRate).toBe(0.25);
  });
});

describe('parseTracesSampleRate', () => {
  it('defaults to 1 when the value is missing', () => {
    expect(parseTracesSampleRate(undefined)).toBe(1);
  });

  it('parses a valid numeric string', () => {
    expect(parseTracesSampleRate('0.5')).toBe(0.5);
    expect(parseTracesSampleRate('0')).toBe(0);
    expect(parseTracesSampleRate('1')).toBe(1);
  });

  it('falls back to 1 for non-numeric values', () => {
    expect(parseTracesSampleRate('abc')).toBe(1);
    expect(parseTracesSampleRate('')).toBe(1);
  });

  it('clamps values below 0 to 0 and above 1 to 1', () => {
    expect(parseTracesSampleRate('-0.5')).toBe(0);
    expect(parseTracesSampleRate('2')).toBe(1);
  });
});

describe('initSentry', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_ENVIRONMENT;
    delete process.env.SENTRY_TRACES_SAMPLE_RATE;
    delete process.env.SENTRY_DEBUG;
    delete process.env.SENTRY_RELEASE;
    delete process.env.SENTRY_ENABLE_LOGS;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns false and does not call Sentry.init when SENTRY_DSN is missing', () => {
    expect(initSentry()).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('returns true and initializes Sentry when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = VALID_DSN;
    expect(initSentry()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    const options = jest.mocked(Sentry.init).mock.calls[0][0];
    expect(options).toMatchObject({
      dsn: VALID_DSN,
      tracesSampleRate: 1,
    });
    expect(options?.integrations).toBeDefined();
    expect(Sentry.nestIntegration).toHaveBeenCalledTimes(1);
  });

  it('sends a release (package version) with every init', () => {
    process.env.SENTRY_DSN = VALID_DSN;
    initSentry();

    const options = jest.mocked(Sentry.init).mock.calls[0][0];
    expect(options?.release).toBeTruthy();
    expect(typeof options?.release).toBe('string');
  });

  it('honors SENTRY_RELEASE and ignores whitespace-only values', () => {
    process.env.SENTRY_DSN = VALID_DSN;
    process.env.SENTRY_RELEASE = '1.2.3';
    initSentry();
    expect(jest.mocked(Sentry.init).mock.calls[0][0]?.release).toBe('1.2.3');

    jest.clearAllMocks();
    process.env.SENTRY_RELEASE = '   ';
    initSentry();
    expect(jest.mocked(Sentry.init).mock.calls[0][0]?.release).not.toBe('   ');
    expect(jest.mocked(Sentry.init).mock.calls[0][0]?.release).toBeTruthy();
  });

  it('enables debug mode only when SENTRY_DEBUG=true', () => {
    process.env.SENTRY_DSN = VALID_DSN;
    initSentry();
    expect(jest.mocked(Sentry.init).mock.calls[0][0]?.debug).toBe(false);

    jest.clearAllMocks();
    process.env.SENTRY_DEBUG = 'true';
    initSentry();
    expect(jest.mocked(Sentry.init).mock.calls[0][0]?.debug).toBe(true);
  });

  it('enables structured logs by default, disables with SENTRY_ENABLE_LOGS=false', () => {
    process.env.SENTRY_DSN = VALID_DSN;
    initSentry();
    expect(jest.mocked(Sentry.init).mock.calls[0][0]?.enableLogs).toBe(true);

    jest.clearAllMocks();
    process.env.SENTRY_ENABLE_LOGS = 'false';
    initSentry();
    expect(jest.mocked(Sentry.init).mock.calls[0][0]?.enableLogs).toBe(false);
  });
});

describe('captureException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the exception to Sentry when the SDK is enabled', () => {
    jest.mocked(Sentry.isEnabled).mockReturnValue(true);
    const boom = new Error('boom');

    captureException(boom);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(boom);
  });

  it('is a no-op when the SDK is not initialized', () => {
    jest.mocked(Sentry.isEnabled).mockReturnValue(false);

    captureException(new Error('boom'));

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

describe('attachSentryErrorHandler', () => {
  const app = {
    use: jest.fn(),
  } as unknown as import('@nestjs/common').INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers the express error handler when Sentry is enabled', () => {
    attachSentryErrorHandler(app, true);

    expect(Sentry.setupExpressErrorHandler).toHaveBeenCalledTimes(1);
    expect(Sentry.setupExpressErrorHandler).toHaveBeenCalledWith(app);
  });

  it('does nothing when Sentry is disabled', () => {
    attachSentryErrorHandler(app, false);

    expect(Sentry.setupExpressErrorHandler).not.toHaveBeenCalled();
  });
});

describe('emitSentryLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps each level to the matching Sentry.logger method', () => {
    jest.mocked(Sentry.isEnabled).mockReturnValue(true);

    emitSentryLog('trace', 't');
    emitSentryLog('debug', 'd');
    emitSentryLog('info', 'i');
    emitSentryLog('warn', 'w');
    emitSentryLog('error', 'e');
    emitSentryLog('fatal', 'f');

    expect(Sentry.logger.trace).toHaveBeenCalledWith('t', undefined);
    expect(Sentry.logger.debug).toHaveBeenCalledWith('d', undefined);
    expect(Sentry.logger.info).toHaveBeenCalledWith('i', undefined);
    expect(Sentry.logger.warn).toHaveBeenCalledWith('w', undefined);
    expect(Sentry.logger.error).toHaveBeenCalledWith('e', undefined);
    expect(Sentry.logger.fatal).toHaveBeenCalledWith('f', undefined);
  });

  it('attaches the context as an attribute when provided', () => {
    jest.mocked(Sentry.isEnabled).mockReturnValue(true);

    emitSentryLog('info', 'hello', 'ScraperService');

    expect(Sentry.logger.info).toHaveBeenCalledWith('hello', {
      context: 'ScraperService',
    });
  });

  it('is a no-op when the SDK is not initialized', () => {
    jest.mocked(Sentry.isEnabled).mockReturnValue(false);

    emitSentryLog('error', 'boom');

    expect(Sentry.logger.error).not.toHaveBeenCalled();
  });
});
