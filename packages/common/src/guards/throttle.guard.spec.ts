import { ThrottlerGuard } from './throttle.guard';
import { ExecutionContext } from '@nestjs/common';

function makeCtx(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined as any,
    getClass: () => undefined as any,
  } as any;
}

describe('ThrottlerGuard — composite tracker (H4)', () => {
  function makeGuard() {
    return new ThrottlerGuard({
      getAllAndOverride: () => undefined,
    } as any);
  }

  it('uses userId as the throttle key for an authenticated request', () => {
    const g = makeGuard();
    expect(g.getTracker({ user: { id: 'u-1' }, ip: '1.2.3.4' })).toBe('user:u-1');
  });

  it('uses the trusted client IP when no user is authenticated', () => {
    const g = makeGuard();
    expect(g.getTracker({ user: undefined, ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
  });

  it('falls back to socket remoteAddress when req.ip is unavailable', () => {
    const g = makeGuard();
    expect(
      g.getTracker({ socket: { remoteAddress: '5.6.7.8' } } as any),
    ).toBe('ip:5.6.7.8');
  });
});