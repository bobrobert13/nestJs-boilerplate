import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Express-compatible middleware that attaches a unique requestId to every
 * incoming HTTP request and echoes it back in the `X-Request-Id` header.
 *
 * Apply globally in `main.ts`:
 * ```typescript
 * app.use(requestIdMiddleware);
 * ```
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existing = req.headers['x-request-id'];
  const requestId =
    typeof existing === 'string' && existing.length > 0
      ? existing
      : randomUUID();

  (req as any).id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
