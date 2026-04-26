import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InngestService } from './inngest.service';
import { Inngest } from 'inngest';

describe('InngestService', () => {
  let service: InngestService;
  let configService: ConfigService;
  let mockInngestClient: jest.Mocked<Inngest>;

  beforeEach(async () => {
    mockInngestClient = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Inngest>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InngestService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              switch (key) {
                case 'INNGEST_BASE_URL':
                  return 'https://inngest.treborjs-dev.online/';
                case 'INNGEST_EVENT_KEY':
                  return 'test-event-key';
                case 'INNGEST_SIGNING_KEY':
                  return 'test-signing-key';
                default:
                  return defaultValue;
              }
            }),
          },
        },
      ],
    })
      .overrideProvider(InngestService)
      .useFactory({
        factory: (configService: ConfigService) => {
          const service = new InngestService(configService);
          (service as any)._client = mockInngestClient;
          return service;
        },
        inject: [ConfigService],
      })
      .compile();

    service = module.get<InngestService>(InngestService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should log warning when keys are not configured', async () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ConfigService;

      const serviceWithoutKeys = new InngestService(mockConfigService);
      await serviceWithoutKeys.onModuleInit();

      expect(mockConfigService.get).toHaveBeenCalledWith('INNGEST_EVENT_KEY');
      expect(mockConfigService.get).toHaveBeenCalledWith('INNGEST_SIGNING_KEY');
    });

    it('should log success when keys are configured', async () => {
      await service.onModuleInit();

      expect(configService.get).toHaveBeenCalledWith('INNGEST_EVENT_KEY');
      expect(configService.get).toHaveBeenCalledWith('INNGEST_SIGNING_KEY');
    });
  });

  describe('sendEvent', () => {
    it('should send a simple event successfully', async () => {
      const mockPayload = {
        name: 'scrapping/job.started' as const,
        data: {
          jobId: 'test-job-123',
          strategyName: 'manhwaweb',
          timestamp: new Date().toISOString(),
        },
      };

      await service.sendEvent(mockPayload);

      expect(mockInngestClient.send).toHaveBeenCalledWith(mockPayload);
    });

    it('should send a custom "HOLA INNGEST" event', async () => {
      const holaPayload = {
        name: 'scrapping/hola-inngest' as const,
        data: {
          message: 'HOLA INNGEST',
          timestamp: new Date().toISOString(),
        },
      };

      await service.sendEvent(holaPayload);

      expect(mockInngestClient.send).toHaveBeenCalledWith(holaPayload);
    });

    it('should throw error when send fails', async () => {
      const mockError = new Error('Inngest API error');
      mockInngestClient.send.mockRejectedValue(mockError);

      const payload = {
        name: 'scrapping/job.started' as const,
        data: {
          jobId: 'test-job-123',
          strategyName: 'manhwaweb',
          timestamp: new Date().toISOString(),
        },
      };

      await expect(service.sendEvent(payload)).rejects.toThrow(
        'Inngest API error',
      );
    });
  });

  describe('sendEvents', () => {
    it('should send batch events successfully', async () => {
      const payloads = [
        {
          name: 'scrapping/job.started' as const,
          data: {
            jobId: 'job-1',
            strategyName: 'manhwaweb',
            timestamp: new Date().toISOString(),
          },
        },
        {
          name: 'scrapping/job.completed' as const,
          data: {
            jobId: 'job-1',
            strategyName: 'manhwaweb',
            success: true,
            timestamp: new Date().toISOString(),
          },
        },
      ];

      await service.sendEvents(payloads);

      expect(mockInngestClient.send).toHaveBeenCalledWith(payloads);
    });

    it('should throw error when batch send fails', async () => {
      const mockError = new Error('Batch send failed');
      mockInngestClient.send.mockRejectedValue(mockError);

      const payloads = [
        {
          name: 'scrapping/job.started' as const,
          data: {
            jobId: 'job-1',
            strategyName: 'manhwaweb',
            timestamp: new Date().toISOString(),
          },
        },
      ];

      await expect(service.sendEvents(payloads)).rejects.toThrow(
        'Batch send failed',
      );
    });
  });

  describe('createJobStartedPayload', () => {
    it('should create job.started event payload', () => {
      const payload = service.createJobStartedPayload('job-123', 'manhwaweb');

      expect(payload.name).toBe('scrapping/job.started');
      expect(payload.data.jobId).toBe('job-123');
      expect(payload.data.strategyName).toBe('manhwaweb');
      expect(payload.data.timestamp).toBeDefined();
    });
  });

  describe('createJobCompletedPayload', () => {
    it('should create job.completed event payload with resultCount', () => {
      const payload = service.createJobCompletedPayload(
        'job-123',
        'manhwaweb',
        5,
      );

      expect(payload.name).toBe('scrapping/job.completed');
      expect(payload.data.success).toBe(true);
      expect(payload.data.resultCount).toBe(5);
    });

    it('should create job.completed event payload without resultCount', () => {
      const payload = service.createJobCompletedPayload('job-123', 'manhwaweb');

      expect(payload.name).toBe('scrapping/job.completed');
      expect(payload.data.success).toBe(true);
      expect(payload.data.resultCount).toBeUndefined();
    });
  });

  describe('createJobFailedPayload', () => {
    it('should create job.failed event payload', () => {
      const payload = service.createJobFailedPayload(
        'job-123',
        'manhwaweb',
        'Test error',
      );

      expect(payload.name).toBe('scrapping/job.failed');
      expect(payload.data.error).toBe('Test error');
    });
  });

  describe('createChapterProcessedPayload', () => {
    it('should create chapter.processed event payload', () => {
      const payload = service.createChapterProcessedPayload(
        'job-123',
        'chapter-1',
        'Chapter 1',
        15,
      );

      expect(payload.name).toBe('scrapping/chapter.processed');
      expect(payload.data.chapterId).toBe('chapter-1');
      expect(payload.data.chapterTitle).toBe('Chapter 1');
      expect(payload.data.pagesScraped).toBe(15);
    });
  });

  describe('client getter', () => {
    it('should return the Inngest client', () => {
      const client = service.client;
      expect(client).toBeDefined();
      expect(client).toBe(mockInngestClient);
    });
  });

  describe('sendHolaInngest - Carga de task HOLA INNGEST', () => {
    it('should send HOLA INNGEST event successfully', async () => {
      await service.sendHolaInngest();

      expect(mockInngestClient.send).toHaveBeenCalledWith({
        name: 'scrapping/hola-inngest',
        data: expect.objectContaining({
          message: 'HOLA INNGEST',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should send custom message event successfully', async () => {
      await service.sendHolaInngest('HOLA INNGEST - TEST CUSTOM');

      expect(mockInngestClient.send).toHaveBeenCalledWith({
        name: 'scrapping/hola-inngest',
        data: expect.objectContaining({
          message: 'HOLA INNGEST - TEST CUSTOM',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should create HolaInngest payload with default message', () => {
      const payload = service.createHolaInngestPayload();

      expect(payload.name).toBe('scrapping/hola-inngest');
      expect(payload.data.message).toBe('HOLA INNGEST');
      expect(payload.data.timestamp).toBeDefined();
    });

    it('should create HolaInngest payload with custom message', () => {
      const payload = service.createHolaInngestPayload('Custom message');

      expect(payload.name).toBe('scrapping/hola-inngest');
      expect(payload.data.message).toBe('Custom message');
    });

    it('should throw error when sending HOLA INNGEST fails', async () => {
      const mockError = new Error('Failed to send HOLA INNGEST');
      mockInngestClient.send.mockRejectedValue(mockError);

      await expect(service.sendHolaInngest()).rejects.toThrow(
        'Failed to send HOLA INNGEST',
      );
    });
  });
});
