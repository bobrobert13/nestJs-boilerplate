import { AppLogger } from './app-logger.service';
import { BootstrapLogger } from './bootstrap-logger';

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

describe('AppLogger (M4)', () => {
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

describe('AppLogger external sink (GlitchTip logs)', () => {
  const cap = captureStdout();

  afterEach(() => {
    AppLogger.setExternalSink(undefined);
  });

  afterAll(() => {
    cap.restore();
  });

  it('forwards scrubbed messages to the sink with mapped levels', () => {
    const sink = jest.fn();
    AppLogger.setExternalSink(sink);
    const logger = new AppLogger('TestCtx');

    logger.log('info entry email=alice@example.com');
    logger.warn('warn entry');
    logger.error('error entry');
    logger.debug('debug entry');
    logger.verbose('verbose entry');

    expect(sink).toHaveBeenCalledWith(
      'info',
      'info entry email=[REDACTED]',
      'TestCtx',
    );
    expect(sink).toHaveBeenCalledWith('warn', 'warn entry', 'TestCtx');
    expect(sink).toHaveBeenCalledWith('error', 'error entry', 'TestCtx');
    expect(sink).toHaveBeenCalledWith('debug', 'debug entry', 'TestCtx');
    expect(sink).toHaveBeenCalledWith('trace', 'verbose entry', 'TestCtx');
    expect(sink).toHaveBeenCalledTimes(5);
  });

  it('never forwards raw PII to the sink', () => {
    const sink = jest.fn();
    AppLogger.setExternalSink(sink);
    const logger = new AppLogger('TestCtx');

    logger.log('contact bob@example.com token=secret123');

    const forwarded = sink.mock.calls.map((c) => c[1]).join(' ');
    expect(forwarded).not.toContain('bob@example.com');
    expect(forwarded).not.toContain('secret123');
  });

  it('a throwing sink never breaks console logging', () => {
    AppLogger.setExternalSink(() => {
      throw new Error('sink down');
    });

    const logger = new AppLogger('TestCtx');
    expect(() => logger.log('still logged')).not.toThrow();
    expect(cap.getOutput()).toContain('still logged');
  });

  it('works unchanged without a sink', () => {
    const logger = new AppLogger('TestCtx');
    expect(() => logger.log('no sink')).not.toThrow();
    expect(cap.getOutput()).toContain('no sink');
  });

  it('resolves the caller context from the trailing param (global override path)', () => {
    // Production path: app.useLogger(new AppLogger()) has no context;
    // Nest appends the caller context of `new Logger('X')` as the last
    // optional parameter.
    const sink = jest.fn();
    AppLogger.setExternalSink(sink);
    const bare = new AppLogger();

    bare.log('mapped route', 'RoutesResolver');

    expect(sink).toHaveBeenCalledWith('info', 'mapped route', 'RoutesResolver');
  });

  it('prefers the instance context over the trailing param', () => {
    const sink = jest.fn();
    AppLogger.setExternalSink(sink);
    const logger = new AppLogger('OwnCtx');

    logger.log('message', 'TrailingCtx');

    expect(sink).toHaveBeenCalledWith('info', 'message', 'OwnCtx');
  });
});
