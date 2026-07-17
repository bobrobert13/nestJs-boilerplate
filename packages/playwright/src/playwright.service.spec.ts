import { PlaywrightService } from './playwright.service';

describe('PlaywrightService.buildLaunchArgs (H4 sandbox opt-in)', () => {
  function build() {
    const svc: any = new PlaywrightService(
      { headless: true } as any,
      { get: () => ({}) } as any,
    );
    return svc as PlaywrightService;
  }

  afterEach(() => {
    delete process.env.PLAYWRIGHT_NO_SANDBOX;
  });

  it('does not include --no-sandbox when PLAYWRIGHT_NO_SANDBOX is not true', () => {
    delete process.env.PLAYWRIGHT_NO_SANDBOX;
    const args = build().buildLaunchArgs();
    expect(args.some((a) => a === '--no-sandbox')).toBe(false);
  });

  it('includes --no-sandbox only when PLAYWRIGHT_NO_SANDBOX=true', () => {
    process.env.PLAYWRIGHT_NO_SANDBOX = 'true';
    const args = build().buildLaunchArgs();
    expect(args).toContain('--no-sandbox');
    expect(args).toContain('--disable-setuid-sandbox');
  });

  it('logs a dev-only warning when sandbox is disabled', () => {
    process.env.PLAYWRIGHT_NO_SANDBOX = 'true';
    const svc = build();
    const spy = jest
      .spyOn((svc as any).logger, 'warn')
      .mockImplementation(() => undefined);
    svc.buildLaunchArgs();
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/PLAYWRIGHT_NO_SANDBOX/),
    );
    spy.mockRestore();
  });
});
