import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { hasAtLeastRole, RBAC_HIERARCHY, RoleHierarchy } from './role-hierarchy';

/**
 * Guard that enforces role-based access control (RBAC).
 *
 * @description Reads required roles from the {@link ROLES_KEY} metadata
 * (set by the `@Roles()` decorator) and checks them against the
 * authenticated user's role list from `req.user.roles`.
 *
 * **Hierarchy support**: if a module registers a hierarchy via the
 * {@link RBAC_HIERARCHY} token, the guard uses {@link hasAtLeastRole} so
 * that a higher role automatically satisfies a lower `@Roles()` annotation
 * (e.g. `admin` satisfies `@Roles('user')`). If no hierarchy is registered,
 * the guard falls back to plain string-equality for full backward
 * compatibility.
 *
 * If no roles are specified on the route, access is granted unconditionally.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin', 'supervisor')
 * @Get('reports')
 * async getReports() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(RBAC_HIERARCHY)
    private readonly hierarchy?: RoleHierarchy<string>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      return false;
    }

    const userRoles = user.roles as string[];

    if (this.hierarchy) {
      return requiredRoles.some((role) =>
        hasAtLeastRole(userRoles, role, this.hierarchy as RoleHierarchy<string>),
      );
    }

    // Backward-compatible fallback: no hierarchy registered → string equality.
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
