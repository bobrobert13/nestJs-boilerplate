import { validateEnv } from './env.validation';

describe('EnvValidation (C5/REQ-auth-5)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws on NODE_ENV=production + JWT_SECRET length < 32', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'too-short';
    expect(() => validateEnv({ JWT_SECRET: 'too-short' })).toThrow(
      /32 characters/,
    );
  });

  it('throws on NODE_ENV=production + JWT_SECRET === dev default', () => {
    process.env.NODE_ENV = 'production';
    const dev = '__dev_only_jwt_secret_replace_in_prod__';
    expect(() => validateEnv({ JWT_SECRET: dev })).toThrow(
      /development default/,
    );
  });

  it('accepts NODE_ENV=production + JWT_SECRET with at least 32 non-default characters', () => {
    process.env.NODE_ENV = 'production';
    const ok = 'a'.repeat(40);
    const out = validateEnv({
      JWT_SECRET: ok,
      MONGODB_URI: 'mongodb://localhost:27017/test',
      CORS_ORIGIN: 'https://app.example.com',
    });
    expect(out.JWT_SECRET).toBe(ok);
  });

  it('warns but does not throw in dev for short JWT_SECRET', () => {
    process.env.NODE_ENV = 'development';
    expect(() => validateEnv({ JWT_SECRET: 'short' })).not.toThrow();
  });
});

describe('EnvValidation — CORS_ORIGIN (C6)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws on NODE_ENV=production + missing CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    expect(() =>
      validateEnv({
        JWT_SECRET: 'a'.repeat(40),
        MONGODB_URI: 'mongodb://localhost:27017/test',
      }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('throws on NODE_ENV=production + empty CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    expect(() =>
      validateEnv({
        JWT_SECRET: 'a'.repeat(40),
        MONGODB_URI: 'mongodb://localhost:27017/test',
        CORS_ORIGIN: '',
      }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('throws on NODE_ENV=production + CORS_ORIGIN=*', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    expect(() =>
      validateEnv({
        JWT_SECRET: 'a'.repeat(40),
        MONGODB_URI: 'mongodb://localhost:27017/test',
        CORS_ORIGIN: '*',
      }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('accepts NODE_ENV=production + explicit CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'production';
    const out = validateEnv({
      JWT_SECRET: 'a'.repeat(40),
      MONGODB_URI: 'mongodb://localhost:27017/test',
      CORS_ORIGIN: 'https://app.example.com',
    });
    expect(out.CORS_ORIGIN).toBe('https://app.example.com');
  });
});

describe('EnvValidation — L1 (MONGODB_URI in production)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws when NODE_ENV=production and MONGODB_URI is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    expect(() =>
      validateEnv({
        JWT_SECRET: 'a'.repeat(40),
        CORS_ORIGIN: 'https://app.example.com',
      }),
    ).toThrow(/MONGODB_URI/);
  });

  it('does not throw in dev when MONGODB_URI is missing', () => {
    process.env.NODE_ENV = 'development';
    const out = validateEnv({});
    expect(out.MONGODB_URI).toBeDefined();
  });
});
