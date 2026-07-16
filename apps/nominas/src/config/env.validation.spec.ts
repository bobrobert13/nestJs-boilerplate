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
    expect(() => validateEnv({ JWT_SECRET: 'a'.repeat(40) })).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it('throws on NODE_ENV=production + empty CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    expect(() =>
      validateEnv({ JWT_SECRET: 'a'.repeat(40), CORS_ORIGIN: '' }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('throws on NODE_ENV=production + CORS_ORIGIN=*', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    expect(() =>
      validateEnv({ JWT_SECRET: 'a'.repeat(40), CORS_ORIGIN: '*' }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('accepts NODE_ENV=production + explicit CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'production';
    const out = validateEnv({
      JWT_SECRET: 'a'.repeat(40),
      CORS_ORIGIN: 'https://app.example.com',
    });
    expect(out.CORS_ORIGIN).toBe('https://app.example.com');
  });
});
