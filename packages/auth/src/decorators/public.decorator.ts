import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by {@link JwtAuthGuard} to identify public routes
 * that skip JWT authentication.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator factory that marks a route or controller as publicly accessible.
 *
 * @description Routes decorated with `@Public()` bypass the {@link JwtAuthGuard},
 * allowing unauthenticated access. Apply at the handler level or class level.
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() dto: LoginDto) { ... }
 * ```
 *
 * @returns A `SetMetadata` decorator that sets the `isPublic` metadata flag.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);