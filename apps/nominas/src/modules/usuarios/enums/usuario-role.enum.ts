import { RoleHierarchy } from '@common/auth';

/**
 * The roles a `Usuario` can hold.
 *
 * @description String enum so values serialize directly to JSON, the JWT
 * payload, and MongoDB without numeric coercion. Order in source does NOT
 * imply rank — the rank is defined explicitly in {@link UsuarioRoleHierarchy}.
 *
 * The hierarchy is `admin > manager > user`. Any module that registers
 * {@link RBAC_HIERARCHY} with this map will get hierarchy-aware
 * authorization for free (see `@Roles()` + `RolesGuard`).
 */
export enum UsuarioRole {
  Admin = 'admin',
  Manager = 'manager',
  User = 'user',
}

/**
 * Rank map for the `UsuarioRole` domain.
 *
 * @description Higher number = stronger role. `admin (3) > manager (2) > user (1)`.
 * Object.freeze prevents runtime mutation so the guard cannot be tricked by
 * code that mutates the shared reference.
 *
 * Consumed by `RolesGuard` via the `RBAC_HIERARCHY` DI token, registered in
 * `UsuariosModule`'s providers.
 */
export const UsuarioRoleHierarchy: RoleHierarchy<UsuarioRole> = Object.freeze({
  [UsuarioRole.Admin]: 3,
  [UsuarioRole.Manager]: 2,
  [UsuarioRole.User]: 1,
});
