import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** Metadata key for @Throttle() decorator. */
export const THROTTLE_KEY = 'throttle';

/** Options for the @Throttle() decorator. */
export interface ThrottleOptions {
  /** Max requests within the TTL window (default: 20). */
  limit?: number;
  /** Time window in seconds (default: 60). */
  ttl?: number;
}

/** ponytail: in-memory throttle store — single-node only. Upgrade to Redis for multi-instance. */
const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Guard that enforces in-memory rate limits.
 *
 * Apply globally with `APP_GUARD` or per-controller with `@UseGuards()`.
 * Endpoints can override limits with `@Throttle({ limit, ttl })`.
 *
 * @example
 * ```typescript
 * @Throttle({ limit: 5, ttl: 60 })
 * @Post('login')
 * async login() { ... }
 * ```
 */
@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(ThrottlerGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const throttleOptions = this.reflector.getAllAndOverride<ThrottleOptions>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limit = throttleOptions?.limit ?? 20;
    const ttl = throttleOptions?.ttl ?? 60;

    const request = context.switchToHttp().getRequest();
    // PR4 / H4 / REQ-gateway-hardening-4 — authenticated requests
    // prefer userId over IP for the throttle key.
    const key = this.getTracker(request);
    const now = Date.now();

    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + ttl * 1000 });
      return true;
    }

    entry.count++;

    if (entry.count > limit) {
      this.logger.warn(
        `Rate limit exceeded for ${key}: ${entry.count}/${limit}`,
      );
      throw new HttpException(
        {
          message: 'Too Many Requests',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * PR4 / H4 — return `user:<id>` when authenticated, `ip:<addr>` otherwise.
   * Falls back to the socket's remote address when req.ip is unavailable.
   */
  protected getTracker(req: Record<string, any>): string {
    const userId = req?.user?.id;
    if (userId) return `user:${userId}`;
    const ip = req?.ip ?? req?.socket?.remoteAddress ?? 'unknown';
    return `ip:${ip}`;
  }
}

/**
 * Override global throttle limits for a specific route.
 *
 * @example
 * ```typescript
 * @Throttle({ limit: 5, ttl: 60 })
 * @Post('login')
 * ```
 */
export const Throttle = (options: ThrottleOptions = {}) =>
  SetMetadata(THROTTLE_KEY, options);

/** Periodically prune expired entries to prevent memory leak. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}, 60_000).unref();
