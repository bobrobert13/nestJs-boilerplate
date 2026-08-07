import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import mongoose from 'mongoose';
import { DatabaseExceptionFilter } from './database-exception.filter';

describe('DatabaseExceptionFilter', () => {
  /** Host + the shared json mock so assertions observe the same response. */
  function makeHost(url = '/test'): { host: ArgumentsHost; json: jest.Mock } {
    const json = jest.fn().mockReturnThis();
    const response = {
      status: jest.fn().mockReturnThis(),
      json,
    } as unknown as Response;

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url }) as unknown as Request,
      }),
    } as unknown as ArgumentsHost;

    return { host, json };
  }

  it('invokes the capture hook with every caught exception', () => {
    const capture = jest.fn();
    const filter = new DatabaseExceptionFilter(capture);
    const boom = new Error('boom');

    filter.catch(boom, makeHost().host);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(boom);
  });

  it('captures HttpExceptions and responds with their status', () => {
    const capture = jest.fn();
    const filter = new DatabaseExceptionFilter(capture);
    const exception = new HttpException(
      { statusCode: HttpStatus.FORBIDDEN, message: 'Forbidden' },
      HttpStatus.FORBIDDEN,
    );

    const { host, json } = makeHost();
    filter.catch(exception, host);

    expect(capture).toHaveBeenCalledWith(exception);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.FORBIDDEN }),
    );
  });

  it('responds 500 and captures non-Error, non-HttpException payloads', () => {
    const capture = jest.fn();
    const filter = new DatabaseExceptionFilter(capture);

    const { host, json } = makeHost();
    filter.catch('not-an-error', host);

    expect(capture).toHaveBeenCalledWith('not-an-error');
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR }),
    );
  });

  it('keeps responding 500 when the capture hook throws', () => {
    const filter = new DatabaseExceptionFilter(() => {
      throw new Error('hook failure');
    });

    const { host, json } = makeHost();
    expect(() => filter.catch(new Error('boom'), host)).not.toThrow();
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR }),
    );
  });

  it('is a no-op capture by default (standalone usage)', () => {
    const filter = new DatabaseExceptionFilter();
    expect(() =>
      filter.catch(new Error('boom'), makeHost().host),
    ).not.toThrow();
  });

  it('still responds 503 for Mongo connection errors after capturing', () => {
    const capture = jest.fn();
    const filter = new DatabaseExceptionFilter(capture);
    // Real mongoose server-selection error (name matches the filter check).
    const mongoError = new mongoose.Error.MongooseServerSelectionError(
      'no servers available',
    );

    const { host, json } = makeHost();
    filter.catch(mongoError, host);

    expect(capture).toHaveBeenCalledWith(mongoError);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.SERVICE_UNAVAILABLE }),
    );
  });

  it('still responds 500 for generic errors after capturing', () => {
    const capture = jest.fn();
    const filter = new DatabaseExceptionFilter(capture);

    const { host, json } = makeHost();
    filter.catch(new Error('boom'), host);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR }),
    );
  });
});
