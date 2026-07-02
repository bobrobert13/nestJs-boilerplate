import { ForbiddenException } from '@nestjs/common';

/**
 * Minimal contract for any object that carries an identity field.
 *
 * @description Used by {@link assertCanModifyOtherRoles} so the helper
 * remains domain-agnostic: any caller can pass a Mongoose document, a DTO,
 * a plain object, or a `req.user` shape — the helper only requires an
 * `id: string` field.
 *
 * @example
 * ```typescript
 * const requester: HasId = { id: req.user.id };
 * const target: HasId = { id: usuario.id };
 * ```
 */
export interface HasId {
  readonly id: string;
}

/**
 * Shape of a role-mutation operation.
 *
 * @description Generic over the role type so the helper can be reused by any
 * module that mutates role arrays. The list is read-only to encourage
 * callers to pass an immutable reference (e.g. the DTO body).
 */
export interface RoleChanges {
  readonly roles: readonly string[];
}

/**
 * Asserts that the requester is allowed to mutate the target's roles.
 *
 * @description Throws {@link ForbiddenException} when the requester is the
 * same entity as the target. This prevents an admin from accidentally
 * stripping or escalating their own roles and locking themselves (or
 * everyone) out.
 *
 * **Why a service-layer helper, not a guard**: A `CanActivate` guard does
 * not have a clean, content-type-agnostic way to read the request body.
 * The role-change payload lives in the body, so the check belongs in the
 * service that orchestrates the mutation.
 *
 * **Why domain-agnostic**: The helper imports nothing from Mongoose, DTOs,
 * or any specific module. It only requires an `id: string` field on both
 * sides. A future role-management endpoint in any module can reuse it.
 *
 * @typeParam R - Requester shape (must have `id: string`).
 * @typeParam T - Target shape (must have `id: string`).
 * @param requester - The entity initiating the change (e.g. `req.user`).
 * @param target - The entity whose roles are about to be changed.
 * @param roleChanges - The proposed role mutation (presence is enough —
 *   the helper checks ids, not the content of `roles`).
 * @throws ForbiddenException with a self-modification message when
 *   `requester.id === target.id`.
 *
 * @example
 * ```typescript
 * // Admin changes someone else — ok
 * assertCanModifyOtherRoles(
 *   { id: 'A' },
 *   { id: 'B' },
 *   { roles: ['manager'] },
 * );
 *
 * // Admin tries to change their own roles — throws
 * assertCanModifyOtherRoles(
 *   { id: 'A' },
 *   { id: 'A' },
 *   { roles: ['manager'] },
 * ); // throws ForbiddenException
 * ```
 */
export function assertCanModifyOtherRoles<
  R extends HasId,
  T extends HasId,
>(requester: R, target: T, roleChanges: RoleChanges): void {
  if (requester.id === target.id) {
    throw new ForbiddenException(
      'Cannot modify your own roles. Ask another admin to do it.',
    );
  }
  // The `roleChanges` parameter is part of the public contract for clarity
  // at call sites, and to leave room for future logic (e.g. "do not strip
  // the last admin"). Currently it is intentionally unused beyond the
  // signature — see ADR-2 in the design document.
  void roleChanges;
}
