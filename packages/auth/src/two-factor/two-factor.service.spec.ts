import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorBackupCode } from '../schemas/two-factor-backup-code.schema';

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