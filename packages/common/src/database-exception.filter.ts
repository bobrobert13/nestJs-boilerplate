import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import mongoose from 'mongoose';

/**
 * Global exception filter that catches MongoDB connection errors
 * and returns consistent HTTP responses.
 *
 * - MongoDB connection errors (MongooseServerSelectionError, MongoNetworkError) → 503
 * - NestJS HttpExceptions → passthrough with original status
 * - Unknown errors → 500
 *
 * Register globally in AppModule:
 * @example
 * ```typescript
 * @Module({
 *   providers: [{ provide: APP_FILTER, useClass: DatabaseExceptionFilter }],
 * })
 * export class AppModule {}
 * ```
 */
@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  /**
   * Handle the caught exception and format the HTTP response.
   * @param exception - The thrown exception
   * @param host - ArgumentsHost providing HTTP context
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isMongoError =
      exception instanceof mongoose.Error &&
      (exception.name === 'MongooseServerSelectionError' ||
        exception.name === 'MongoNetworkError');

    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown error';

    if (isMongoError) {
      this.logger.error(`Database Connection Error: ${errorMessage}`);

      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        timestamp: new Date().toISOString(),
        path: request.url,
        message:
          'Database service is temporarily unavailable. Please try again later.',
        error: 'Service Unavailable',
      });
    }

    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse() as Record<string, unknown>);
    }

    if (exception instanceof Error) {
      this.logger.error(`Unexpected error: ${exception.message}`);

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
