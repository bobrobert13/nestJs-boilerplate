import { requestIdMiddleware } from './request-id.middleware';

describe('requestIdMiddleware (L8)', () => {
  function makeReq(headers: Record<string, string | undefined> = {}) {
    return { headers } as any;
  }
  function makeRes() {
    const headers: Record<string, string> = {};
    return {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
      _headers: headers,
    } as any;
  }

  it('rejects log-injection attempts with CRLF inside X-Request-Id', () => {
    const req = makeReq({ 'x-request-id': 'foo\r\nX-Injected: bar' });
    const res = makeRes();
    let next = false;
    requestIdMiddleware(req, res, () => (next = true));
    expect(next).toBe(true);
    expect(res._headers['X-Request-Id']).toBeDefined();
    expect(res._headers['X-Request-Id']).not.toContain('\r');
    expect(res._headers['X-Request-Id']).not.toContain('\n');
    expect(res._headers['X-Request-Id']).not.toContain('X-Injected');
  });

  it('generates a UUID when X-Request-Id is missing', () => {
    const req = makeReq({});
    const res = makeRes();
    let next = false;
    requestIdMiddleware(req, res, () => (next = true));
    expect(next).toBe(true);
    expect(res._headers['X-Request-Id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('accepts a valid 8–128 char alnum/underscore/hyphen id', () => {
    const req = makeReq({ 'x-request-id': 'abc-123_xyz' });
    const res = makeRes();
    requestIdMiddleware(req, res, () => {});
    expect(res._headers['X-Request-Id']).toBe('abc-123_xyz');
  });

  it('rejects ids shorter than 8 chars', () => {
    const req = makeReq({ 'x-request-id': 'short' });
    const res = makeRes();
    requestIdMiddleware(req, res, () => {});
    expect(res._headers['X-Request-Id']).not.toBe('short');
  });
});
