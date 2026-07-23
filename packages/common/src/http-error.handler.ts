/**
 * Standard HTTP error response shape for serialization.
 */
export interface HttpErrorResponse {
  /** HTTP status code */
  status: number;
  /** HTTP status text (e.g., 'Not Found') */
  statusText: string;
  /** Request URL that caused the error */
  url: string;
  /** Human-readable error message */
  message: string;
  /** Optional response body data */
  data?: unknown;
}

/**
 * Base HTTP error class with status code and serialization support.
 * All specific HTTP errors extend this class.
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly statusText: string,
    message: string,
    public readonly url: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Serialize the error to a plain object for JSON responses.
   * @returns HttpErrorResponse with status, statusText, url, message, and data
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

/** HTTP 400 Bad Request error. */
export class BadRequestError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(400, 'Bad Request', message, url, data);
  }
}

/** HTTP 401 Unauthorized error. */
export class UnauthorizedError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(401, 'Unauthorized', message, url, data);
  }
}

/** HTTP 403 Forbidden error. */
export class ForbiddenError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(403, 'Forbidden', message, url, data);
  }
}

/** HTTP 404 Not Found error. */
export class NotFoundError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(404, 'Not Found', message, url, data);
  }
}

/** HTTP 408 Request Timeout error. */
export class TimeoutError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(408, 'Request Timeout', message, url, data);
  }
}

/** HTTP 500 Internal Server Error. */
export class InternalServerError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(500, 'Internal Server Error', message, url, data);
  }
}

/** HTTP 503 Service Unavailable error. */
export class ServiceUnavailableError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    super(503, 'Service Unavailable', message, url, data);
  }
}

/**
 * Factory function to create the appropriate HttpError subclass by status code.
 * Falls back to InternalServerError for unknown status codes.
 *
 * @param status - HTTP status code
 * @param message - Error message
 * @param url - Request URL
 * @param data - Optional response data
 * @returns Appropriate HttpError subclass instance
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
