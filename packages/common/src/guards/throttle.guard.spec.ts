import { HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottleOptions } from './throttle.guard';

describe('ThrottlerGuard — composite tracker (H4)', () => {
  function makeGuard() {
    return new ThrottlerGuard({
      getAllAndOverride: () => undefined,
    } as any);
  }

  it('uses userId as the throttle key for an authenticated request', () => {
    const g = makeGuard();
    expect(g.getTracker({ user: { id: 'u-1' }, ip: '1.2.3.4' })).toBe(
      'user:u-1',
    );
  });

  it('uses the trusted client IP when no user is authenticated', () => {
    const g = makeGuard();
    expect(g.getTracker({ user: undefined, ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
  });

  it('falls back to socket remoteAddress when req.ip is unavailable', () => {
    const g = makeGuard();
    expect(g.getTracker({ socket: { remoteAddress: '5.6.7.8' } } as any)).toBe(
      'ip:5.6.7.8',
    );
  });
});

describe('ThrottlerGuard — rate-limit enforcement (M1 / REQ-throttle-1..6)', () => {
  function makeContext(
    request: Record<string, any>,
    throttleOptions: ThrottleOptions | undefined,
  ) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
      getAllAndOverride: () => throttleOptions,
    } as any;
  }

  function makeGuardWithOptions(opts: ThrottleOptions | undefined) {
    return new ThrottlerGuard({
      getAllAndOverride: () => opts,
    } as any);
  }

  it('enforces 5 requests per 60 seconds on /auth/login (REQ-throttle-1)', () => {
    // Use a unique user id so this test is isolated from the shared `hits` Map.
    const user = { id: 'login-test-user-A' };
    const g = makeGuardWithOptions({ limit: 5, ttl: 60 });
    const ctx = makeContext({ user, ip: '10.0.0.1' }, { limit: 5, ttl: 60 });

    for (let i = 0; i < 5; i++) {
      expect(g.canActivate(ctx)).toBe(true);
    }

    let thrown: unknown = null;
    try {
      g.canActivate(ctx);
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    const httpErr = thrown as HttpException;
    expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  it('enforces 10 requests per 60 seconds on /auth/refresh (REQ-throttle-2)', () => {
    const user = { id: 'refresh-test-user-B' };
    const ctx = makeContext({ user, ip: '10.0.0.2' }, { limit: 10, ttl: 60 });
    const g = makeGuardWithOptions({ limit: 10, ttl: 60 });

    for (let i = 0; i < 10; i++) {
      expect(g.canActivate(ctx)).toBe(true);
    }

    expect(() => g.canActivate(ctx)).toThrow(HttpException);
  });

  it('enforces 3 requests per 60 seconds on /auth/2fa/verify-backup (REQ-throttle-4)', () => {
    const user = { id: 'backup-test-user-C' };
    const ctx = makeContext({ user, ip: '10.0.0.3' }, { limit: 3, ttl: 60 });
    const g = makeGuardWithOptions({ limit: 3, ttl: 60 });

    expect(g.canActivate(ctx)).toBe(true);
    expect(g.canActivate(ctx)).toBe(true);
    expect(g.canActivate(ctx)).toBe(true);
    expect(() => g.canActivate(ctx)).toThrow(HttpException);
  });

  it('falls back to ip when no user is authenticated (anonym)', () => {
    const ctx = makeContext(
      { user: undefined, ip: '10.0.0.4' },
      {
        limit: 2,
        ttl: 60,
      },
    );
    const g = makeGuardWithOptions({ limit: 2, ttl: 60 });

    expect(g.canActivate(ctx)).toBe(true);
    expect(g.canActivate(ctx)).toBe(true);
    expect(() => g.canActivate(ctx)).toThrow(HttpException);
  });

  it('uses global default (20/60s) when no override is supplied (REQ-throttle-6)', () => {
    const user = { id: 'default-test-user-D' };
    const ctx = makeContext({ user, ip: '10.0.0.5' }, undefined);
    const g = makeGuardWithOptions(undefined);

    for (let i = 0; i < 20; i++) {
      expect(g.canActivate(ctx)).toBe(true);
    }
    expect(() => g.canActivate(ctx)).toThrow(HttpException);
  });
});
