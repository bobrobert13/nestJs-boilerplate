import { SsrfGuard } from './ssrf-guard';

describe('SsrfGuard (H5)', () => {
  function build(allowCidrs?: string) {
    if (allowCidrs !== undefined) {
      process.env.SSRF_ALLOWED_CIDRS = allowCidrs;
    } else {
      delete process.env.SSRF_ALLOWED_CIDRS;
    }
    return new SsrfGuard();
  }

  afterEach(() => {
    delete process.env.SSRF_ALLOWED_CIDRS;
  });

  it('rejects loopback, link-local metadata, private IPv4, and private IPv6 destinations', async () => {
    const g = build();
    await expect(g.assertSafeUrl('http://127.0.0.1/foo')).rejects.toThrow(/not allowed/);
    await expect(g.assertSafeUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      /not allowed/,
    );
    await expect(g.assertSafeUrl('http://10.0.0.5/foo')).rejects.toThrow(/not allowed/);
    await expect(g.assertSafeUrl('http://192.168.1.1/foo')).rejects.toThrow(/not allowed/);
    await expect(g.assertSafeUrl('http://[::1]/foo')).rejects.toThrow(/not allowed/);
  });

  it('rejects a hostname resolving to a private address', async () => {
    const g = build();
    // localhost resolves to 127.0.0.1
    await expect(g.assertSafeUrl('http://localhost/foo')).rejects.toThrow(/not allowed/);
  });

  it('honors a matching SSRF_ALLOWED_CIDRS exception', async () => {
    const g = build('127.0.0.0/8');
    // 127.0.0.1 is in the allow-list now.
    await expect(g.assertSafeUrl('http://127.0.0.1/foo')).resolves.toBeUndefined();
  });

  it('returns a client-safe blocked-destination message', async () => {
    const g = build();
    let caught: any;
    try {
      await g.assertSafeUrl('http://169.254.169.254/latest/meta-data/');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    const msg = caught?.message ?? JSON.stringify(caught?.getResponse?.() ?? caught?.response ?? {});
    expect(msg).toMatch(/not allowed/i);
    expect(msg).not.toContain('169.254.169.254');
  });
});