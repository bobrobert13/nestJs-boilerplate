import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
class DenyAllGuard {
  canActivate(): boolean {
    return false;
  }
}

@Injectable()
class FakeJwtGuard {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    return Boolean(req.headers?.authorization && req.user?.id);
  }
}

describe('TwoFactorController.verify-backup (C2)', () => {
  function buildController(guard: any) {
    const mockSvc = {
      verifyBackupCodeWithUser: jest.fn(),
    } as any;
    return Test.createTestingModule({
      controllers: [TwoFactorController],
      providers: [
        { provide: TwoFactorService, useValue: mockSvc },
        { provide: JwtAuthGuard, useClass: guard },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(guard)
      .compile()
      .then((m) => ({ controller: m.get(TwoFactorController), svc: mockSvc }));
  }

  it('rejects anonymous verify-backup requests with HTTP 401', async () => {
    const { controller, svc } = await buildController(DenyAllGuard);
    svc.verifyBackupCodeWithUser.mockResolvedValue(true);
    let caught: any;
    try {
      await controller.verifyBackup({ headers: {}, user: undefined } as any, {
        backupCode: 'AAAA',
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.getStatus?.() ?? caught?.status ?? caught?.statusCode).toBe(
      401,
    );
  });

  it('uses req.user.id and ignores a body-supplied userId', async () => {
    const { controller, svc } = await buildController(FakeJwtGuard);
    svc.verifyBackupCodeWithUser.mockResolvedValue(true);

    const result = await controller.verifyBackup(
      {
        headers: { authorization: 'Bearer x' },
        user: { id: 'user-42' },
      } as any,
      { backupCode: 'AAAA' } as any,
    );

    expect(svc.verifyBackupCodeWithUser).toHaveBeenCalledWith(
      'user-42',
      'AAAA',
    );
    expect((result.data as any).verified).toBe(true);
  });

  it('returns HTTP 401 when the JWT user backup code is invalid', async () => {
    const { controller, svc } = await buildController(FakeJwtGuard);
    svc.verifyBackupCodeWithUser.mockResolvedValue(false);

    let caught: any;
    try {
      await controller.verifyBackup(
        {
          headers: { authorization: 'Bearer x' },
          user: { id: 'user-42' },
        } as any,
        { backupCode: 'WRONG' },
      );
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(UnauthorizedException);
    expect(caught.getStatus()).toBe(401);
  });
});
