export interface HttpErrorResponse {
  status: number;
  statusText: string;
  url: string;
  message: string;
  data?: unknown;
}

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly statusText: string,
    message: string,
    public readonly url: string,
    public readonly data?: unknown,
  ) {
    /** super (see class JSDoc for context). */
    super(message);
    this.name = this.constructor.name;
  }

  /** toJSON (see class JSDoc for context). */
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

export class BadRequestError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    /** super (see class JSDoc for context). */
    super(400, 'Bad Request', message, url, data);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    /** super (see class JSDoc for context). */
    super(401, 'Unauthorized', message, url, data);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    /** super (see class JSDoc for context). */
    super(403, 'Forbidden', message, url, data);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    /** super (see class JSDoc for context). */
    super(404, 'Not Found', message, url, data);
  }
}

export class TimeoutError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    /** super (see class JSDoc for context). */
    super(408, 'Request Timeout', message, url, data);
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    /** super (see class JSDoc for context). */
    super(500, 'Internal Server Error', message, url, data);
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string, url: string, data?: unknown) {
    /** super (see class JSDoc for context). */
    super(503, 'Service Unavailable', message, url, data);
  }
}

export function createHttpError(
  status: number,
  message: string,
  url: string,
  data?: unknown,
): HttpError {
  const errors: Record<
    number,
    /** new (see class JSDoc for context). */
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
