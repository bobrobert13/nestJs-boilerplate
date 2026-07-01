import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the current transaction session
 * from the HTTP request context.
 *
 * Injects the `ClientSession` associated with the active transaction
 * into a controller method parameter.
 *
 * @example
 * ```typescript
 * @Post()
 * async create(
 *   @Body() dto: CreateDto,
 *   @TransactionParam() session: ClientSession,
 * ) {
 *   return this.service.create(dto, session);
 * }
 * ```
 */
export const TransactionParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.transactionSession;
  },
);