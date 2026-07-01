import { registerAs } from '@nestjs/config';

/**
 * Configuration interface for the authentication module.
 *
 * @description Defines the shape of the `auth` configuration namespace
 * loaded via `ConfigModule.forFeature(authConfig)`. All nested sections
 * correspond to environment variables prefixed with their respective keys
 * (e.g. `JWT_SECRET`, `TWO_FACTOR_ISSUER`, `PASSKEYS_RP_ID`).
 */
export interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenTtl: number;
    refreshTokenTtl: number;
    issuer: string;
    audience: string;
  };
  magicLink: {
    enabled: boolean;
    tokenTtl: number;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
    github: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  };
  argon2: {
    type: number;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
  twoFactor: {
    issuer: string;
    algorithm: 'SHA1' | 'SHA256' | 'SHA512';
    digits: 6 | 8;
    period: number;
    step: number;
    backupCodes: {
      count: number;
      length: number;
    };
  };
  passkeys: {
    rpId: string;
    rpName: string;
    rpOrigin: string;
  };
}

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '900', 10),
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL || '604800', 10),
    issuer: process.env.JWT_ISSUER || 'api-nominas',
    audience: process.env.JWT_AUDIENCE || 'api-nominas',
  },
  magicLink: {
    enabled: process.env.MAGIC_LINK_ENABLED === 'true',
    tokenTtl: parseInt(process.env.MAGIC_LINK_TOKEN_TTL || '300', 10),
  },
  oauth: {
    google: {
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.OAUTH_GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    },
    github: {
      clientId: process.env.OAUTH_GITHUB_CLIENT_ID || '',
      clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.OAUTH_GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
    },
  },
  argon2: {
    type: parseInt(process.env.ARGON2_TYPE || '2', 10),
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536', 10),
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
  },
  twoFactor: {
    issuer: process.env.TWO_FACTOR_ISSUER || 'MyApp',
    algorithm: (process.env.TWO_FACTOR_ALGORITHM as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1',
    digits: parseInt(process.env.TWO_FACTOR_DIGITS || '6', 10) as 6 | 8,
    period: parseInt(process.env.TWO_FACTOR_PERIOD || '30', 10),
    step: parseInt(process.env.TWO_FACTOR_STEP || '30', 10),
    backupCodes: {
      count: parseInt(process.env.TWO_FACTOR_BACKUP_CODES_COUNT || '10', 10),
      length: parseInt(process.env.TWO_FACTOR_BACKUP_CODES_LENGTH || '10', 10),
    },
  },
  passkeys: {
    rpId: process.env.PASSKEYS_RP_ID || 'localhost',
    rpName: process.env.PASSKEYS_RP_NAME || 'MyApp',
    rpOrigin: process.env.PASSKEYS_RP_ORIGIN || 'http://localhost:3000',
  },
}));