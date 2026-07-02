/**
 * Serializable representation of an HTTP error returned by the common package.
 * Used as the shape for error serialization across the monorepo.
 */
export interface HttpErrorResponse {
  status: number;
  statusText: string;
  url: string;
  message: string;
  data?: unknown;
}

/**
 * Base class for structured HTTP errors.
 * Extends native Error with HTTP-specific properties (statusCode, url, data).
 *
 * Use specific subclasses (BadRequestError, NotFoundError, etc.) for semantic
 * error handling, or createHttpError() for dynamic status codes.
 *
 * @example
 * ```typescript
 * throw new NotFoundError('User not found', '/users/123');
 *
 * if (error instanceof HttpError) {
 *   console.log(error.statusCode); // 404
 * }
 * ```
 */
export class HttpError extends Error {
  constructor(
    /** HTTP status code (e.g. 404, 500) */
    public readonly statusCode: number,
    /** HTTP status text (e.g. 'Not Found') */
    public readonly statusText: string,
    message: string,
    /** URL or path where the error occurred */
    public readonly url: string,
    /** Optional response data payload */
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Serialize the error to a JSON-friendly object.
   * @returns Structured error response
   */
  toJSON(): HttpErrorResponse {
    return {
      status: this.statusCode,
      statusText: this.statusText,
      url: this.url,
      message: this.message,
      data: this.data,
    };
  }
}

/** 400 Bad Request — malformed input */
export class BadRequestError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(400, 'Bad Request', message, url, data);
  }
}

/** 401 Unauthorized — missing or invalid authentication */
export class UnauthorizedError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(401, 'Unauthorized', message, url, data);
  }
}

/** 403 Forbidden — insufficient permissions */
export class ForbiddenError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(403, 'Forbidden', message, url, data);
  }
}

/** 404 Not Found — resource does not exist */
export class NotFoundError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(404, 'Not Found', message, url, data);
  }
}

/** 408 Request Timeout — operation exceeded time limit */
export class TimeoutError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(408, 'Request Timeout', message, url, data);
  }
}

/** 500 Internal Server Error — unexpected server-side failure */
export class InternalServerError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(500, 'Internal Server Error', message, url, data);
  }
}

/** 503 Service Unavailable — external service is down or overloaded */
export class ServiceUnavailableError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(503, 'Service Unavailable', message, url, data);
  }
}

/**
 * Factory function to create the appropriate HttpError subclass
 * based on the HTTP status code.
 *
 * Unknown status codes default to InternalServerError.
 *
 * @param status - HTTP status code (400-503)
 * @param message - Error description
 * @param url - URL or path that caused the error
 * @param data - Optional response data
 * @returns The appropriate HttpError subclass instance
 */
export function createHttpError(
  status: number,
  message: string,
  url: string,
  data?: unknown,
): HttpError {
  const errors: Record<
    number,
    new (message: string, url: string, data?: unknown) => HttpError
  > = {
    400: BadRequestError,
    401: UnauthorizedError,
    403: ForbiddenError,
    404: NotFoundError,
    408: TimeoutError,
    500: InternalServerError,
    503: ServiceUnavailableError,
  };

  const ErrorClass = errors[status] ?? InternalServerError;
  return new ErrorClass(message, url, data);
}
