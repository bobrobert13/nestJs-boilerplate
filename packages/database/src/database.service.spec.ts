import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import { DatabaseService } from './database.service';

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      on: jest.fn(),
      readyState: 1,
    },
  };
});

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockConfigService: jest.Mocked<ConfigService>;

  const defaultDbConfig = {
    uri: 'mongodb://localhost:27017/test',
    options: {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
    retry: {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockConfigService = {
      get: jest.fn().mockReturnValue(defaultDbConfig),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        DatabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(DatabaseService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('connectWithRetry', () => {
    it('connects successfully on first attempt', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);

      await service.connectWithRetry();

      expect(mongoose.connect).toHaveBeenCalledWith(
        defaultDbConfig.uri,
        expect.objectContaining({ autoIndex: true }),
      );
    });

    it('returns silently when config is not available', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await service.connectWithRetry();

      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('retries with exponential backoff on failure', async () => {
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce(mongoose);

      await service.connectWithRetry();

      // First attempt failed, retry scheduled
      expect(mongoose.connect).toHaveBeenCalledTimes(1);

      // Advance past first backoff delay (100ms * 2^0 = 100ms)
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // flush microtasks

      expect(mongoose.connect).toHaveBeenCalledTimes(2);
    });

    it('stops retrying after maxRetries exhausted', async () => {
      (mongoose.connect as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED'),
      );

      await service.connectWithRetry();
      expect(mongoose.connect).toHaveBeenCalledTimes(1);

      // Retry 1 (delay: 100ms)
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      expect(mongoose.connect).toHaveBeenCalledTimes(2);

      // Retry 2 (delay: 200ms)
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      expect(mongoose.connect).toHaveBeenCalledTimes(3);

      // Retry 3 (delay: 400ms)
      jest.advanceTimersByTime(400);
      await Promise.resolve();
      expect(mongoose.connect).toHaveBeenCalledTimes(4);

      // No more retries (maxRetries = 3)
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      expect(mongoose.connect).toHaveBeenCalledTimes(4);
    });

    it('caps backoff delay at maxDelayMs', async () => {
      const config = {
        ...defaultDbConfig,
        retry: { maxRetries: 5, initialDelayMs: 500, maxDelayMs: 1000 },
      };
      mockConfigService.get.mockReturnValue(config);
      (mongoose.connect as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED'),
      );

      await service.connectWithRetry();

      // attempt 0: delay = min(500 * 2^0, 1000) = 500
      jest.advanceTimersByTime(500);
      await Promise.resolve();

      // attempt 1: delay = min(500 * 2^1, 1000) = 1000
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // attempt 2: delay = min(500 * 2^2, 1000) = 1000 (capped)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mongoose.connect).toHaveBeenCalledTimes(4);
    });
  });

  describe('disconnect', () => {
    it('closes the MongoDB connection', async () => {
      (mongoose.disconnect as jest.Mock).mockResolvedValue(undefined);

      await service.disconnect();

      expect(mongoose.disconnect).toHaveBeenCalled();
    });

    it('cancels pending retry timer on disconnect', async () => {
      (mongoose.connect as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED'),
      );

      await service.connectWithRetry();
      // A retry timer is now pending

      await service.disconnect();

      // Advancing timers should NOT trigger another connect
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onApplicationShutdown', () => {
    it('sets shuttingDown flag and cancels pending retry', async () => {
      (mongoose.connect as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED'),
      );

      await service.connectWithRetry();
      await service.onApplicationShutdown('SIGTERM');

      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleInit', () => {
    it('calls connectWithRetry', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);
      const spy = jest.spyOn(service, 'connectWithRetry');

      await service.onModuleInit();

      expect(spy).toHaveBeenCalled();
    });
  });
});
