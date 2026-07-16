import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { authenticator } from 'otplib';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorBackupCode } from '../schemas/two-factor-backup-code.schema';
import { TwoFactorSecret } from '../schemas/two-factor-secret.schema';

describe('TwoFactorService.verifyBackupCodeWithUser (M11)', () => {
  function makeModel() {
    const stored: Array<{
      _id: string;
      userId: string;
      hashedCode: string;
      isUsed: boolean;
      usedAt: Date | null;
    }> = [];
    let nextId = 1;
    const model: any = {
      find: jest.fn((query: any) => ({
        lean: () =>
          Promise.resolve(
            stored.filter(
              (s) =>
                String(s.userId) === String(query.userId) && s.isUsed === query.isUsed,
            ),
          ),
      })),
      updateOne: jest.fn(
        (filter: any, update: any) =>
          new Promise((resolve) => {
            const row = stored.find(
              (s) => String(s._id) === String(filter._id) && s.isUsed === filter.isUsed,
            );
            if (row) {
              row.isUsed = true;
              row.usedAt = update.$set.usedAt;
              resolve({ modifiedCount: 1 });
            } else {
              resolve({ modifiedCount: 0 });
            }
          }),
      ),
      create: jest.fn((doc: any) => {
        const row = {
          _id: String(nextId++),
          isUsed: false,
          usedAt: null,
          ...doc,
        };
        stored.push(row);
        return Promise.resolve(row);
      }),
      // expose for assertions
      __stored: stored,
    };
    return model;
  }

  async function build(model?: any) {
    const cfg: any = { get: () => ({ twoFactor: { issuer: 'I', algorithm: 'SHA1', digits: 6, period: 30, backupCodes: { count: 5, length: 10 } } }) };
    const providers: any[] = [{ provide: ConfigService, useValue: cfg }];
    if (model) {
      providers.push({ provide: getModelToken(TwoFactorBackupCode.name), useValue: model });
    }
    const moduleRef = await Test.createTestingModule({
      providers: [TwoFactorService, ...providers],
    }).compile();
    return { svc: moduleRef.get(TwoFactorService), model };
  }

  it('persists backup codes as hashes with isUsed and usedAt metadata only', async () => {
    const model = makeModel();
    const { svc } = await build(model);
    // Create a fresh code directly via the model to simulate the
    // generate→persist path that the service uses internally.
    const hash = (svc as any).hashBackupCode('ABCD-1234');
    await model.create({ userId: 'u-1', hashedCode: hash });
    expect(model.__stored[0].hashedCode).toBe(hash);
    expect(model.__stored[0].isUsed).toBe(false);
    expect(model.__stored[0].usedAt).toBeNull();
    expect(JSON.stringify(model.__stored[0])).not.toContain('ABCD-1234');
  });

  it('marks a matched backup code used with usedAt during verifyCode', async () => {
    const model = makeModel();
    const { svc } = await build(model);
    const code = 'BACKUP-CODE-1';
    const hash = (svc as any).hashBackupCode(code);
    await model.create({ userId: 'u-1', hashedCode: hash });

    const ok = await svc.verifyBackupCodeWithUser('u-1', code);
    expect(ok).toBe(true);
    expect(model.__stored[0].isUsed).toBe(true);
    expect(model.__stored[0].usedAt).toBeInstanceOf(Date);
  });

  it('rejects a backup code on its second verification attempt', async () => {
    const model = makeModel();
    const { svc } = await build(model);
    const code = 'BACKUP-CODE-2';
    const hash = (svc as any).hashBackupCode(code);
    await model.create({ userId: 'u-1', hashedCode: hash });

    const first = await svc.verifyBackupCodeWithUser('u-1', code);
    const second = await svc.verifyBackupCodeWithUser('u-1', code);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});

describe('TwoFactorService — TOTP secret persistence (C4)', () => {
  function makeSecretModel() {
    const stored: Array<{ userId: string; secret: string; lastUsedAt: Date | null }> = [];
    const model: any = {
      updateOne: jest.fn(
        (filter: any, update: any) =>
          new Promise((resolve) => {
            const existing = stored.find(
              (s) => String(s.userId) === String(filter.userId),
            );
            if (existing) {
              existing.secret = update.$set.secret;
            } else {
              stored.push({
                userId: String(filter.userId),
                secret: update.$set.secret,
                lastUsedAt: null,
              });
            }
            resolve({ modifiedCount: 1, upsertedCount: existing ? 0 : 1 });
          }),
      ),
      findOne: jest.fn((filter: any) => ({
        select: () => ({
          lean: () =>
            Promise.resolve(
              stored.find((s) => String(s.userId) === String(filter.userId)) ?? null,
            ),
        }),
      })),
      __stored: stored,
    };
    return model;
  }

  async function build(secretModel?: any) {
    const cfg: any = { get: () => ({ twoFactor: { issuer: 'I', algorithm: 'SHA1', digits: 6, period: 30, backupCodes: { count: 5, length: 10 } } }) };
    const providers: any[] = [{ provide: ConfigService, useValue: cfg }];
    if (secretModel) {
      providers.push({ provide: getModelToken(TwoFactorSecret.name), useValue: secretModel });
    }
    const moduleRef = await Test.createTestingModule({
      providers: [TwoFactorService, ...providers],
    }).compile();
    return { svc: moduleRef.get(TwoFactorService), secretModel };
  }

  it('persists a cryptographically random 20-byte TOTP secret during enrollment', async () => {
    const model = makeSecretModel();
    const { svc } = await build(model);
    const result = await svc.generateSecret('user-42');
    // base32 of 20 bytes = 32 chars
    expect(result.secret).toHaveLength(32);
    expect(model.__stored[0].secret).toBe(result.secret);
    // Verify not derived from userId
    expect(result.secret).not.toBe('secret_for_user-42');
    expect(result.secret).not.toContain('user-42');
  });

  it('accepts a code generated from the persisted secret', async () => {
    const model = makeSecretModel();
    const { svc } = await build(model);
    const { secret } = await svc.generateSecret('user-42');
    const code = authenticator.generate(secret);
    const ok = await svc.verifyTotp('user-42', code);
    expect(ok).toBe(true);
  });

  it('rejects a code derived from secret_for_<userId>', async () => {
    const model = makeSecretModel();
    const { svc } = await build(model);
    await svc.generateSecret('user-42');
    // Derive a code from the legacy deterministic secret.
    const legacy = `secret_for_user-42`;
    const code = authenticator.generate(legacy);
    const ok = await svc.verifyTotp('user-42', code);
    expect(ok).toBe(false);
  });

  it('reports enrollment required when the TwoFactorSecrets document is missing', async () => {
    const model = makeSecretModel();
    const { svc } = await build(model);
    const ok = await svc.verifyTotp('never-enrolled', '123456');
    expect(ok).toBe(false);
    expect(await svc.getPersistedSecret('never-enrolled')).toBeNull();
  });
});