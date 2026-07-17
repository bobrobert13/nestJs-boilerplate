import { MagicLinkService } from './magic-link.service';
import { ConfigService } from '@nestjs/config';

describe('MagicLinkService (L5)', () => {
  let svc: MagicLinkService;
  let mockModel: jest.Mocked<any>;

  const config = {
    get: jest.fn().mockReturnValue({
      magicLink: { enabled: true, tokenTtl: 300 },
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    // @ts-expect-error - intentionally minimal mock
    svc = new MagicLinkService(config, mockModel);
  });

  it('persists token via MongoDB when the model is injected', async () => {
    mockModel.create.mockResolvedValue({ tokenHash: 'hash', email: 'x@y' });

    const token = await svc.generateMagicLink('x@y.com');
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64); // 32 bytes hex
    expect(mockModel.create).toHaveBeenCalledTimes(1);
    const created = mockModel.create.mock.calls[0][0];
    expect(created.email).toBe('x@y.com');
    expect(created.consumedAt).toBeNull();
  });

  it('rejects an unknown token in Mongo mode', async () => {
    mockModel.findOne.mockResolvedValue(null);
    await expect(svc.verifyMagicLink('not-real')).rejects.toThrow(
      /Invalid magic link token/,
    );
  });

  it('marks consumed token rejected (no replay)', async () => {
    mockModel.findOne.mockResolvedValue({
      tokenHash: 'h',
      email: 'x@y',
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      save: jest.fn().mockResolvedValue({}),
    });
    await expect(svc.verifyMagicLink('any')).rejects.toThrow(/already used/);
  });

  it('expired token rejected', async () => {
    mockModel.findOne.mockResolvedValue({
      tokenHash: 'h',
      email: 'x@y',
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      save: jest.fn(),
    });
    await expect(svc.verifyMagicLink('any')).rejects.toThrow(/expired/);
  });

  it('valid token verifies, marks consumedAt, returns email', async () => {
    const save = jest.fn().mockResolvedValue({});
    mockModel.findOne.mockResolvedValue({
      tokenHash: 'h',
      email: 'x@y',
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      save,
    });
    const email = await svc.verifyMagicLink('any');
    expect(email).toBe('x@y');
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('MagicLinkService in-memory fallback (L5)', () => {
  let svc: MagicLinkService;

  const config = {
    get: jest.fn().mockReturnValue({
      magicLink: { enabled: true, tokenTtl: 60 },
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    // @ts-expect-error - intentionally minimal mock, no tokenModel
    svc = new MagicLinkService(config, undefined);
  });

  it('issues and verifies a token without MongoDB', async () => {
    const token = await svc.generateMagicLink('x@y.com');
    const email = await svc.verifyMagicLink(token);
    expect(email).toBe('x@y.com');
  });

  it('rejects a single-use replay in memory mode', async () => {
    const token = await svc.generateMagicLink('x@y.com');
    await svc.verifyMagicLink(token);
    await expect(svc.verifyMagicLink(token)).rejects.toThrow();
  });
});
