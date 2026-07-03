import { ForbiddenException } from '@nestjs/common';
import { assertCanModifyOtherRoles } from '../cannot-self-modify';

describe('assertCanModifyOtherRoles', () => {
  describe('when requester.id equals target.id', () => {
    it('throws ForbiddenException (R2.1)', () => {
      // The helper refuses to allow an admin to mutate their own roles.
      expect(() =>
        assertCanModifyOtherRoles(
          { id: 'A' },
          { id: 'A' },
          { roles: ['manager'] },
        ),
      ).toThrow(ForbiddenException);
    });

    it('throws with a message that mentions self-modification (R2.1)', () => {
      // The error message must guide the operator to ask another admin.
      try {
        assertCanModifyOtherRoles(
          { id: 'A' },
          { id: 'A' },
          { roles: ['manager'] },
        );
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as ForbiddenException).message).toMatch(
          /Cannot modify your own roles/,
        );
      }
    });
  });

  describe('when requester.id differs from target.id', () => {
    it('returns void (undefined) without throwing (R2.2)', () => {
      // A different admin mutating another user is the happy path.
      const result = assertCanModifyOtherRoles(
        { id: 'A' },
        { id: 'B' },
        { roles: ['manager'] },
      );
      expect(result).toBeUndefined();
    });
  });

  describe('domain-agnostic contract', () => {
    it('accepts plain { readonly id: string } literals (no Mongoose dependency, R2.3)', () => {
      // The helper is generic over HasId — no Mongoose Document, no DTO
      // class. Passing two plain object literals compiles AND runs, proving
      // the structural contract is real (not just a phantom type).
      const requester = { id: 'request-1' };
      const target = { id: 'target-2' };
      expect(() =>
        assertCanModifyOtherRoles(requester, target, { roles: ['admin'] }),
      ).not.toThrow();
    });
  });
});
