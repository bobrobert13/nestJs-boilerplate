import { hasAtLeastRole, RoleHierarchy } from '../role-hierarchy';

/**
 * Domain test value for the role enum. We use a literal type here (not the
 * `UsuarioRole` enum from the domain) so the test stays decoupled from any
 * particular domain's roles — `hasAtLeastRole` is generic over the role
 * string type.
 */
type TestRole = 'admin' | 'manager' | 'user';

const hierarchy: RoleHierarchy<TestRole> = Object.freeze({
  admin: 3,
  manager: 2,
  user: 1,
});

describe('hasAtLeastRole', () => {
  describe('when the user holds a higher-ranked role than required', () => {
    it('returns true for a lower-required role (R1.1)', () => {
      // admin (rank 3) satisfies a 'user' (rank 1) requirement
      expect(hasAtLeastRole<TestRole>(['admin'], 'user', hierarchy)).toBe(true);
    });
  });

  describe('when the user holds a lower-ranked role than required', () => {
    it('returns false for a higher-required role (R1.2)', () => {
      // user (rank 1) does NOT satisfy an 'admin' (rank 3) requirement
      expect(hasAtLeastRole<TestRole>(['user'], 'admin', hierarchy)).toBe(
        false,
      );
    });
  });

  describe('when the user holds multiple roles', () => {
    it('returns true if any one of them satisfies the requirement (R1.3)', () => {
      // 'user' alone would not satisfy 'manager', but the array contains
      // 'manager' so the user passes.
      expect(
        hasAtLeastRole<TestRole>(['user', 'manager'], 'manager', hierarchy),
      ).toBe(true);
    });
  });

  describe('when the user holds no roles at all', () => {
    it('returns false (R1.4)', () => {
      expect(hasAtLeastRole<TestRole>([], 'user', hierarchy)).toBe(false);
    });
  });

  describe('when a user role is not present in the hierarchy', () => {
    it('treats the unknown role as rank 0 and never satisfies', () => {
      // 'guest' is not in the hierarchy — hasAtLeastRole treats it as rank 0
      // and therefore cannot satisfy even a rank-1 requirement.
      expect(
        hasAtLeastRole<TestRole>(['guest'] as unknown as TestRole[], 'user', hierarchy),
      ).toBe(false);
    });
  });

  describe('when the required role is not present in the hierarchy', () => {
    it('throws an Error with a configuration-bug message', () => {
      // 'superadmin' is required but not in the hierarchy — configuration bug.
      // Cast to TestRole to satisfy the generic, but the runtime will throw
      // because the rank lookup returns undefined.
      expect(() =>
        hasAtLeastRole<TestRole>(
          ['admin'],
          'superadmin' as TestRole,
          hierarchy,
        ),
      ).toThrow(
        /hasAtLeastRole: required role "superadmin" is not present in the provided hierarchy/,
      );
    });
  });
});
