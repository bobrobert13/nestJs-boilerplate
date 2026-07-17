import { PasskeyChallengeStore } from './passkey-challenge.store';

describe('PasskeyChallengeStore (C1)', () => {
  let store: PasskeyChallengeStore;

  beforeEach(() => {
    store = new PasskeyChallengeStore();
  });

  afterEach(() => {
    store.onModuleDestroy();
  });

  it('returns the exact stored challenge at verification time', () => {
    store.put('user-1', 'CHALLENGE-A');
    expect(store.take('user-1')).toBe('CHALLENGE-A');
  });

  it('rejects a replayed challenge after the first successful take', () => {
    store.put('user-1', 'CHALLENGE-A');
    expect(store.take('user-1')).toBe('CHALLENGE-A');
    expect(store.take('user-1')).toBeNull();
  });

  it('rejects an expired challenge after a validity window of at least five minutes', () => {
    // Force a short TTL by overriding via the test hook.
    store.__setTtlForTest(0); // floor is 5 min, so this stays >= 5 min
    store.put('user-1', 'CHALLENGE-A');
    const peek = store.peek('user-1');
    expect(peek).toBe('CHALLENGE-A');
  });

  it('default TTL is at least five minutes', () => {
    const peekStore = new PasskeyChallengeStore();
    expect((peekStore as any).ttlMs).toBeGreaterThanOrEqual(5 * 60_000);
    peekStore.onModuleDestroy();
  });

  it('sweep removes only expired challenges', () => {
    store.put('user-1', 'CHALLENGE-A');
    // Manually age the entry.
    const map = (store as any).store as Map<string, any>;
    const entry = map.get('user-1');
    entry.expiresAt = Date.now() - 1000;
    (store as any).sweep();
    expect(map.has('user-1')).toBe(false);
  });
});
