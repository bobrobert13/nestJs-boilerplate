import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard that enforces JWT authentication on routes.
 *
 * @description Extends Passport's built-in `AuthGuard('jwt')` with support
 * for public routes via the {@link IS_PUBLIC_KEY} metadata. When a route
 * is decorated with `@Public()`, authentication is skipped entirely.
 *
 * @example
 * ```typescript
 * // Protect all routes on a controller
 * @UseGuards(JwtAuthGuard)
 * @Controller('users')
 * export class UsersController { ... }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}