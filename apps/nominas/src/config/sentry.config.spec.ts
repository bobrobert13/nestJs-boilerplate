import * as Sentry from '@sentry/nestjs';
import {
  buildSentryOptions,
  initSentry,
  parseTracesSampleRate,
} from './sentry.config';

jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  nestIntegration: jest.fn(() => ({ name: 'Nest' })),
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
});
