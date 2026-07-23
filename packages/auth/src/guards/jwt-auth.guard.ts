import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT authentication guard that extends Passport's AuthGuard.
 * Respects the @Public() decorator to bypass authentication on specific routes.
 *
 * Flow: Request → JwtAuthGuard.canActivate() → checks @Public() →
 * if not public → JwtStrategy.validate() → req.user populated
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determine if the request can proceed.
   * Returns true immediately for routes marked with @Public().
   * Otherwise delegates to Passport JWT validation.
   *
   * @param context - NestJS execution context
   * @returns true if authenticated or public, throws UnauthorizedException otherwise
   */
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
