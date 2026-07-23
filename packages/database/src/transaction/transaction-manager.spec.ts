import { TransactionManager } from './transaction-manager';

describe('TransactionManager', () => {
  let manager: TransactionManager;
  let mockSession: any;
  let mockConnection: any;

  beforeEach(() => {
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn().mockResolvedValue(undefined),
      id: { toString: () => 'session-123' },
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    manager = new TransactionManager(mockConnection);
  });

  describe('start', () => {
    it('starts a new session and transaction', async () => {
      await manager.start();

      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
    });

    it('does not start a second session if already started', async () => {
      await manager.start();
      await manager.start();

      expect(mockConnection.startSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('commit', () => {
    it('commits the active transaction', async () => {
      await manager.start();
      await manager.commit();

      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('throws if no active transaction', async () => {
      await expect(manager.commit()).rejects.toThrow('No active transaction');
    });

    it('throws if transaction already committed', async () => {
      await manager.start();
      await manager.commit();

      await expect(manager.commit()).rejects.toThrow(
        'Transaction already finished',
      );
    });

    it('throws if transaction already aborted', async () => {
      await manager.start();
      await manager.abort();

      await expect(manager.commit()).rejects.toThrow(
        'Transaction already finished',
      );
    });
  });

  describe('abort', () => {
    it('aborts the active transaction', async () => {
      await manager.start();
      await manager.abort();

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('throws if no active transaction', async () => {
      await expect(manager.abort()).rejects.toThrow('No active transaction');
    });
  });

  describe('end', () => {
    it('ends the session and resets state', async () => {
      await manager.start();
      await manager.end();

      expect(mockSession.endSession).toHaveBeenCalled();
      expect(manager.isActive()).toBe(false);
    });

    it('is safe to call without a session', async () => {
      await expect(manager.end()).resolves.toBeUndefined();
    });
  });

  describe('getSession', () => {
    it('returns the active session', async () => {
      await manager.start();

      expect(manager.getSession()).toBe(mockSession);
    });

    it('throws if no active session', () => {
      expect(() => manager.getSession()).toThrow(
        'No active transaction. Call start() first.',
      );
    });
  });

  describe('isActive', () => {
    it('returns false before start', () => {
      expect(manager.isActive()).toBe(false);
    });

    it('returns true after start', async () => {
      await manager.start();
      expect(manager.isActive()).toBe(true);
    });

    it('returns false after commit', async () => {
      await manager.start();
      await manager.commit();
      expect(manager.isActive()).toBe(false);
    });

    it('returns false after abort', async () => {
      await manager.start();
      await manager.abort();
      expect(manager.isActive()).toBe(false);
    });
  });

  describe('getSessionId', () => {
    it('returns null when no session', () => {
      expect(manager.getSessionId()).toBeNull();
    });

    it('returns session id string when active', async () => {
      await manager.start();
      expect(manager.getSessionId()).toBe('session-123');
    });
  });
});
