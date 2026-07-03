import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../roles.guard';
import { RBAC_HIERARCHY, RoleHierarchy } from '../role-hierarchy';

/**
 * Build a minimal ExecutionContext stub.
 *
 * The RolesGuard only needs `switchToHttp().getRequest()` to return the
 * request — and from there it reads `user`. We pass a fake request object
 * through this helper.
 */
function makeContext(req: { user?: unknown }): ExecutionContext {
  return {
    getHandler: () => jest.fn() as unknown as Function,
    getClass: () => jest.fn() as unknown as Function,
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => jest.fn(),
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({}) as any,
    switchToWs: () => ({}) as any,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

/**
 * Build a `RolesGuard` for one test case.
 *
 * @param options.hierarchy The hierarchy to inject via `RBAC_HIERARCHY`.
 *   Pass `null` to omit the provider (backward-compat path).
 * @param options.roles What `Reflector.getAllAndOverride` returns.
 *   Pass `undefined` to simulate "no @Roles() metadata".
 */
async function buildGuard(options: {
  hierarchy?: RoleHierarchy<string> | null;
  roles?: string[] | undefined;
}): Promise<RolesGuard> {
  const reflectorMock = {
    getAllAndOverride: jest.fn().mockReturnValue(options.roles),
  };

  // NestJS testing contract: an `overrideProvider` only takes effect when
  // the token is registered in the `providers` list — otherwise DI cannot
  // resolve the dependency. The token can use a sentinel value (here
  // `null`) that we will override or omit.
  const providers: any[] = [RolesGuard, Reflector];
  if (options.hierarchy !== null) {
    providers.push({
      provide: RBAC_HIERARCHY,
      // The override below replaces this sentinel.
      useValue: null,
    });
  }

  let builder = Test.createTestingModule({ providers })
    .overrideProvider(Reflector)
    .useValue(reflectorMock);

  if (options.hierarchy !== null) {
    builder = builder
      .overrideProvider(RBAC_HIERARCHY)
      .useValue(options.hierarchy) as unknown as typeof builder;
  }

  const moduleRef: TestingModule = await builder.compile();
  return moduleRef.get<RolesGuard>(RolesGuard);
}

const hierarchy: RoleHierarchy<string> = Object.freeze({
  admin: 3,
  manager: 2,
  user: 1,
});

describe('RolesGuard', () => {
  describe('when no @Roles() metadata is set on the route', () => {
    it('returns true regardless of the request user (baseline)', async () => {
      // No metadata → no required roles → allow.
      const guard = await buildGuard({ hierarchy, roles: undefined });
      const ctx = makeContext({ user: { id: 'A', roles: ['user'] } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true even when the request has no user (no metadata path)', async () => {
      // The guard short-circuits BEFORE reading user, so missing user
      // does not block access on routes that do not require roles.
      const guard = await buildGuard({ hierarchy, roles: undefined });
      const ctx = makeContext({});
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('with a hierarchy registered', () => {
    it('@Roles("user") admits an admin (rank 3 >= rank 1) — R5.1', async () => {
      // admin (rank 3) should satisfy 'user' (rank 1) when the hierarchy
      // is registered.
      const guard = await buildGuard({ hierarchy, roles: ['user'] });
      const ctx = makeContext({ user: { id: 'A', roles: ['admin'] } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('@Roles("admin") rejects a user (rank 1 < rank 3) — R5.2 / R1.1', async () => {
      // user (rank 1) does NOT satisfy 'admin' (rank 3) when the hierarchy
      // is registered.
      const guard = await buildGuard({ hierarchy, roles: ['admin'] });
      const ctx = makeContext({ user: { id: 'A', roles: ['user'] } });
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('@Roles("manager") rejects a user-only user — edge case', async () => {
      // 'user' has rank 1; 'manager' requires rank 2. The user does not
      // satisfy even though the role list is not empty.
      const guard = await buildGuard({ hierarchy, roles: ['manager'] });
      const ctx = makeContext({ user: { id: 'A', roles: ['user'] } });
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('without a hierarchy (backward-compat path)', () => {
    it('@Roles("admin") admits user with roles: ["admin"] (string equality)', async () => {
      // No hierarchy → guard falls back to plain `userRoles.includes(role)`.
      const guard = await buildGuard({ hierarchy: null, roles: ['admin'] });
      const ctx = makeContext({ user: { id: 'A', roles: ['admin'] } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('@Roles("admin") rejects user with roles: ["user"] (string equality)', async () => {
      // Same fallback, negative case.
      const guard = await buildGuard({ hierarchy: null, roles: ['admin'] });
      const ctx = makeContext({ user: { id: 'A', roles: ['user'] } });
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('with missing user data', () => {
    it('returns false when req.user is undefined', async () => {
      // The guard must not crash on unauthenticated requests — it must
      // deny them when roles are required.
      const guard = await buildGuard({ hierarchy, roles: ['user'] });
      const ctx = makeContext({});
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('returns false when req.user.roles is undefined', async () => {
      // The user object exists but has no roles field — guard must deny.
      const guard = await buildGuard({ hierarchy, roles: ['user'] });
      const ctx = makeContext({ user: { id: 'A' } });
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });
});
