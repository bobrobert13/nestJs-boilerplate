import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

/**
 * PR3 / C1 / REQ-auth-crypto-2,3 â€” per-user passkey challenge store with TTL.
 *
 * Tradeoffs (locked in design Â§2):
 *   - In-memory `Map`; single-instance only. The `IPasskeyChallengeStore`
 *     interface stub below documents a Redis adapter swap.
 *   - Single-use semantics: `take()` deletes the entry. Replay returns null.
 *   - TTL is configurable via PASSKEY_CHALLENGE_TTL_MS and floored to
 *     5 minutes (REQ-auth-crypto-3).
 */
interface ChallengeEntry {
  challenge: string;
  expiresAt: number;
}

@Injectable()
export class PasskeyChallengeStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PasskeyChallengeStore.name);
  private readonly store = new Map<string, ChallengeEntry>();
  private readonly ttlMs: number;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor() {
    const envTtl = parseInt(process.env.PASSKEY_CHALLENGE_TTL_MS ?? '', 10);
    const safeEnvTtl = Number.isFinite(envTtl) && envTtl > 0 ? envTtl : 600_000;
    // REQ-auth-crypto-3 â€” validity window MUST be at least 5 minutes.
    this.ttlMs = Math.max(5 * 60_000, safeEnvTtl);
  }

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => this.sweep(), 60_000);
    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /** Store the challenge generated at options time. */
  put(userId: string, challenge: string): void {
    this.store.set(userId, { challenge, expiresAt: Date.now() + this.ttlMs });
  }

  /** Pop and return the challenge. Subsequent calls return null â†’ replay rejected. */
  take(userId: string): string | null {
    const entry = this.store.get(userId);
    if (!entry) return null;
    this.store.delete(userId);
    if (Date.now() > entry.expiresAt) return null;
    return entry.challenge;
  }

  /** Peek without consuming â€” used in tests. */
  peek(userId: string): string | null {
    const entry = this.store.get(userId);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.challenge;
  }

  /** Force the TTL for tests (use sparingly). */
  __setTtlForTest(ms: number): void {
    (this as any).ttlMs = Math.max(5 * 60_000, ms);
  }

  private sweep(): void {
    const now = Date.now();
    let dropped = 0;
    for (const [k, v] of this.store) {
      if (now > v.expiresAt) {
        this.store.delete(k);
        dropped++;
      }
    }
    if (dropped > 0) this.logger.debug(`Passkey sweep dropped ${dropped}`);
  }
}

/**
 * Interface contract for a future Redis adapter. Replace
 * PasskeyChallengeStore with `RedisPasskeyChallengeStore` and bind via DI
 * token. No call-site changes needed.
 */
export interface IPasskeyChallengeStore {
  put(userId: string, challenge: string): Promise<void>;
  take(userId: string): Promise<string | null>;
}
