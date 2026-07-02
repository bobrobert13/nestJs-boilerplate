/**
 * Generic role rank map.
 *
 * @description Maps each role string to a numeric rank where a higher number
 * represents a stronger role. The map is generic over the role string type so
 * any domain (e.g. `UsuarioRole`, `ProjectRole`) can plug in its own set of
 * roles without the framework knowing the concrete enum.
 *
 * @example
 * ```typescript
 * const hierarchy: RoleHierarchy<UsuarioRole> = Object.freeze({
 *   [UsuarioRole.Admin]: 3,
 *   [UsuarioRole.Manager]: 2,
 *   [UsuarioRole.User]: 1,
 * });
 * ```
 */
export type RoleHierarchy<T extends string> = Readonly<Record<T, number>>;

/**
 * Pure utility that checks whether the requester holds at least the required
 * role according to the provided hierarchy.
 *
 * @description Returns `true` if at least one role in `userRoles` has a rank
 * greater than or equal to `requiredRole`'s rank in `hierarchy`. This makes
 * the `@Roles()` annotation hierarchy-aware: annotating an endpoint with
 * `@Roles('user')` will admit `manager` and `admin` automatically when the
 * hierarchy `admin > manager > user` is registered.
 *
 * **Behavior contract**:
 * - Pure function: no I/O, no side effects.
 * - Empty `userRoles` → returns `false`.
 * - Role present in `userRoles` but not in `hierarchy` → treated as rank 0
 *   (never satisfies a positive-rank requirement).
 * - `requiredRole` not in `hierarchy` → throws `Error` (configuration bug).
 * - Generic over the role string type `T extends string`.
 *
 * @typeParam T - The role string enum/type used by the caller.
 * @param userRoles - Roles held by the requester (read-only).
 * @param requiredRole - Role required by the route/operation.
 * @param hierarchy - Role rank map for the domain.
 * @returns `true` if any `userRoles` entry ranks >= `requiredRole`.
 * @throws Error if `requiredRole` is not present in `hierarchy`.
 *
 * @example
 * ```typescript
 * const hierarchy: RoleHierarchy<UsuarioRole> = Object.freeze({
 *   [UsuarioRole.Admin]: 3,
 *   [UsuarioRole.Manager]: 2,
 *   [UsuarioRole.User]: 1,
 * });
 *
 * hasAtLeastRole(['admin'], 'user', hierarchy);    // true (3 >= 1)
 * hasAtLeastRole(['user'], 'admin', hierarchy);    // false (1 < 3)
 * hasAtLeastRole(['user', 'manager'], 'manager', hierarchy); // true
 * hasAtLeastRole([], 'user', hierarchy);           // false
 * ```
 */
export function hasAtLeastRole<T extends string>(
  userRoles: readonly T[],
  requiredRole: T,
  hierarchy: RoleHierarchy<T>,
): boolean {
  const requiredRank = hierarchy[requiredRole];
  if (requiredRank === undefined) {
    throw new Error(
      `hasAtLeastRole: required role "${requiredRole}" is not present in the provided hierarchy. ` +
        `This is a configuration bug — the role enum and the hierarchy map must stay in sync.`,
    );
  }

  if (userRoles.length === 0) {
    return false;
  }

  return userRoles.some((role) => {
    const rank = hierarchy[role];
    // Unknown role in userRoles → rank 0 → never satisfies a positive-rank check.
    return rank !== undefined && rank >= requiredRank;
  });
}
