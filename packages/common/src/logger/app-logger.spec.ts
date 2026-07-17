import { AppLogger } from './app-logger.service';
import { BootstrapLogger } from './bootstrap-logger';

describe('AppLogger (M4)', () => {
  function captureStdout(): { restore: () => void; getOutput: () => string } {
    const writes: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    // @ts-expect-error - override for capture
    process.stdout.write = ((chunk: any, ..._args: any[]) => {
      writes.push(String(chunk));
      return true;
    }) as any;
    return {
      restore: () => {
        process.stdout.write = origWrite as any;
      },
      getOutput: () => writes.join(''),
    };
  }

  it('redacts email, password, and token key-value fields', () => {
    const cap = captureStdout();
    try {
      const logger = new AppLogger('TestCtx');
      logger.log(
        'user logged in: email=alice@example.com password=hunter2 token=abc123',
      );
      const out = cap.getOutput();
      expect(out).toContain('email=[REDACTED]');
      expect(out).toContain('password=[REDACTED]');
      expect(out).toContain('token=[REDACTED]');
      expect(out).not.toContain('alice@example.com');
      expect(out).not.toContain('hunter2');
      expect(out).not.toContain('abc123');
    } finally {
      cap.restore();
    }
  });

  it('replaces standalone email addresses with [EMAIL]', () => {
    const cap = captureStdout();
    try {
      const logger = new AppLogger('TestCtx');
      logger.log('Sent to bob@example.com successfully');
      const out = cap.getOutput();
      expect(out).toContain('[EMAIL]');
      expect(out).not.toContain('bob@example.com');
    } finally {
      cap.restore();
    }
  });

  it('preserves BootstrapLogger route-map output (not extended through AppLogger)', () => {
    const cap = captureStdout();
    try {
      // BootstrapLogger is a separate class; route-map output should pass through verbatim.
      BootstrapLogger.log(
        'routes',
        'GET /api/users → 200',
        'alice@example.com',
      );
      const out = cap.getOutput();
      // We do NOT scrub BootstrapLogger output — email visible in route-map log.
      expect(out).toContain('alice@example.com');
    } finally {
      cap.restore();
    }
  });
});
