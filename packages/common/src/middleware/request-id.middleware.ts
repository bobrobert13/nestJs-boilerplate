import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * L8 / hardening-medium-low — strict regex on client-supplied
 * `X-Request-Id`. Anything that doesn't match the safe charset (8–128
 * characters of alphanumerics, `_`, `-`) is replaced with a random
 * UUID to defuse log-injection attempts (CR/LF, ANSI escapes, etc.).
 */
const REQUEST_ID_REGEX = /^[A-Za-z0-9_-]{8,128}$/;

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existing = req.headers['x-request-id'];
  let requestId: string;
  if (typeof existing === 'string' && REQUEST_ID_REGEX.test(existing)) {
    requestId = existing;
  } else {
    requestId = randomUUID();
  }

  (req as any).id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
