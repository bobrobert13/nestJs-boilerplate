import { RefreshToken, RefreshTokenSchema } from './refresh-token.schema';

describe('RefreshToken schema (H3)', () => {
  it('declares an expiresAt TTL index with expireAfterSeconds 0', () => {
    const ttlIndex = RefreshTokenSchema.indexes().find(
      (idx) => idx[0]?.expiresAt !== undefined,
    );
    expect(ttlIndex).toBeDefined();
    expect((ttlIndex?.[1] as any)?.expireAfterSeconds).toBe(0);
  });

  it('declares the familyId and revokedAt compound index', () => {
    const familyIndex = RefreshTokenSchema.indexes().find(
      (idx) => idx[0]?.familyId !== undefined && idx[0]?.revokedAt !== undefined,
    );
    expect(familyIndex).toBeDefined();
  });

  it('hashes raw refresh tokens before persistence', () => {
    const raw = 'my-raw-refresh-token';
    const hash = RefreshToken.hash(raw);
    expect(hash).not.toBe(raw);
    expect(hash).toHaveLength(64); // SHA-256 hex digest length
    expect(RefreshToken.hash(raw)).toBe(hash); // deterministic
  });
});