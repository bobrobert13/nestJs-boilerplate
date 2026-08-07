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

@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  /**
   * @param capture - Optional hook invoked with every caught exception
   * (e.g. error-reporting SDKs). Defaults to a no-op so the filter
   * works standalone in tests and other apps.
   */
  constructor(
    private readonly capture: (exception: unknown) => void = () => {},
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // Report before responding: the exception is consumed here, so an
    // Express-level error handler would never see it. A failing hook
    // must never break the response contract.
    try {
      this.capture(exception);
    } catch (error) {
      this.logger.warn(`Capture hook failed: ${String(error)}`);
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if the error is related to MongoDB connection
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

    // If it's not a DB error, let it propagate or handle it as a generic error
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
