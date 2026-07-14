import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

/** Shape of the wrapped response envelope. */
export interface Envelope<T = unknown> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Global interceptor that wraps every successful response in a consistent
 * `{ data, meta: { timestamp, requestId } }` envelope.
 *
 * Opt-out with `@RawResponse()` on a controller or route handler.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Envelope<T>> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRaw) {
      return next.handle() as unknown as Observable<Envelope<T>>;
    }

    const request = context.switchToHttp().getRequest();
    const requestId: string = request.id ?? request.requestId ?? '';

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      })),
    );
  }
}
