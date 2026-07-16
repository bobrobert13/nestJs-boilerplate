import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy (C5)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('throws on construction when config.jwt.secret is missing', () => {
    const config = {
      get: () => ({ jwt: { secret: undefined } }),
    };
    expect(() => new JwtStrategy(config as unknown as ConfigService)).toThrow(
      /JWT secret missing or equal to dev fallback/,
    );
  });

  it('throws on construction when config.jwt.secret equals dev fallback', () => {
    const config = {
      get: () => ({
        jwt: { secret: '__dev_only_jwt_secret_replace_in_prod__' },
      }),
    };
    expect(() => new JwtStrategy(config as unknown as ConfigService)).toThrow(
      /JWT secret missing or equal to dev fallback/,
    );
  });

  it('constructs successfully with a strong secret', () => {
    const config = {
      get: () => ({
        jwt: {
          secret: 'a-strong-secret-that-is-not-the-dev-fallback-string',
        },
      }),
    };
    expect(() => new JwtStrategy(config as unknown as ConfigService)).not.toThrow();
  });
});