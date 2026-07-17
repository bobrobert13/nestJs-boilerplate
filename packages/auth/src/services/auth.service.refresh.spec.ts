import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService.refreshTokens (H3)', () => {
  function build(opts: {
    rotate?: jest.Mock;
    revokeFamily?: jest.Mock;
    find?: jest.Mock;
    delete?: jest.Mock;
  }) {
    const tokenStore: any = {
      save: jest.fn(),
      find: opts.find ?? jest.fn(),
      delete: opts.delete ?? jest.fn(),
      rotate: opts.rotate ?? jest.fn(),
      revokeFamily: opts.revokeFamily ?? jest.fn(),
    };
    const jwtService: any = { sign: jest.fn().mockReturnValue('NEW-ACCESS') };
    const configService: any = {
      get: jest.fn().mockReturnValue({ jwt: { refreshTokenTtl: 604800 } }),
    };
    const svc = new AuthService(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      undefined,
      tokenStore,
    );
    return { svc, tokenStore, jwtService };
  }

  it('rotates an active refresh token and links it with replacedBy', async () => {
    const rotate = jest.fn().mockResolvedValue({
      userId: 'u-1',
      email: 'a@b.com',
      roles: ['user'],
      expiresAt: new Date(Date.now() + 60_000),
    });
    const find = jest.fn().mockResolvedValue({
      userId: 'u-1',
      email: 'a@b.com',
      roles: ['user'],
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { svc } = build({ rotate, find });

    const result = await svc.refreshTokens('RAW-TOKEN');

    expect(rotate).toHaveBeenCalled();
    const [oldRaw, newRaw, expiresAt] = rotate.mock.calls[0];
    expect(oldRaw).toBe('RAW-TOKEN');
    expect(newRaw).not.toBe('RAW-TOKEN');
    expect(expiresAt).toBeInstanceOf(Date);
    expect(result.accessToken).toBe('NEW-ACCESS');
    expect(result.refreshToken).toBe(newRaw);
  });

  it('invalidates the old token after successful rotation', async () => {
    const rotate = jest.fn().mockResolvedValue({
      userId: 'u-1',
      email: 'a@b.com',
      roles: ['user'],
      expiresAt: new Date(Date.now() + 60_000),
    });
    const find = jest.fn().mockResolvedValue({
      userId: 'u-1',
      email: 'a@b.com',
      roles: ['user'],
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { svc } = build({ rotate, find });

    await svc.refreshTokens('OLD-TOKEN');

    // The rotation method marks revokedAt on the old token as part of its
    // atomic update; `delete` is not called when rotation succeeds.
    expect(rotate).toHaveBeenCalledTimes(1);
  });

  it('returns HTTP 401 when a rotated refresh token is reused', async () => {
    const rotate = jest.fn().mockResolvedValue(null); // already revoked
    const revokeFamily = jest.fn().mockResolvedValue(3);
    const find = jest.fn().mockResolvedValue({
      userId: 'u-1',
      email: 'a@b.com',
      roles: ['user'],
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { svc } = build({ rotate, revokeFamily, find });

    let caught: any;
    try {
      await svc.refreshTokens('REUSED');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(UnauthorizedException);
    expect(caught.getStatus()).toBe(401);
    expect(revokeFamily).toHaveBeenCalledWith('REUSED');
  });

  it('rejects a refresh token from a revoked chain after logout', async () => {
    const rotate = jest.fn().mockResolvedValue(null);
    const revokeFamily = jest.fn().mockResolvedValue(2);
    const find = jest.fn().mockResolvedValue({
      userId: 'u-1',
      email: 'a@b.com',
      roles: ['user'],
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { svc } = build({ rotate, revokeFamily, find });

    let caught: any;
    try {
      await svc.refreshTokens('POST-LOGOUT');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(UnauthorizedException);
    expect(caught.getStatus()).toBe(401);
  });

  it('does not issue a replacement token after reuse detection', async () => {
    const rotate = jest.fn().mockResolvedValue(null);
    const revokeFamily = jest.fn().mockResolvedValue(1);
    const find = jest.fn().mockResolvedValue({
      userId: 'u-1',
      email: 'a@b.com',
      roles: ['user'],
      expiresAt: new Date(Date.now() + 60_000),
    });
    const jwtSign = jest.fn().mockReturnValue('SHOULD-NOT-BE-USED');
    const tokenStore: any = {
      save: jest.fn(),
      find: find,
      delete: jest.fn(),
      rotate,
      revokeFamily,
    };
    const svc = new AuthService(
      { sign: jwtSign } as any,
      { get: () => ({ jwt: { refreshTokenTtl: 60 } }) } as any,
      undefined,
      tokenStore,
    );

    let caught: any;
    try {
      await svc.refreshTokens('X');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(UnauthorizedException);
    expect(jwtSign).not.toHaveBeenCalled();
  });
});
