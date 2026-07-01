import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by {@link RolesGuard} to identify required roles
 * on a route handler or controller.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator factory that specifies which roles are required to access a route.
 *
 * @description Used in combination with {@link RolesGuard} and {@link JwtAuthGuard}
 * to restrict access based on the authenticated user's roles.
 *
 * @param roles - One or more role names required to access the endpoint
 * @returns A `SetMetadata` decorator that sets the roles metadata array
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin')
 * @Post('admin-only')
 * async adminEndpoint() { ... }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);