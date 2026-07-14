import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScraperService } from '../scraper.service';
import { ScraperRepository } from '../scraper.repository';
import {
  IScraperStrategy,
  SCRAPER_STRATEGY,
} from '../interfaces/scraper-strategy.interface';

describe('ScraperService', () => {
  let service: ScraperService;
  let mockRepo: jest.Mocked<ScraperRepository>;
  let mockStrategy: jest.Mocked<IScraperStrategy>;

  const mockDoc = {
    _id: 'abc123',
    url: 'https://example.com',
    strategyName: 'example',
    status: 'pending' as const,
    data: null,
    errorMessage: null,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    mockStrategy = {
      name: 'example',
      supports: jest.fn().mockReturnValue(true),
      scrape: jest.fn().mockResolvedValue({
        title: 'Example Page',
        content: '{"title":"Example"}',
        structured: { title: 'Example' },
        scrapedAt: new Date().toISOString(),
      }),
    };

    mockRepo = {
      create: jest.fn().mockResolvedValue(mockDoc),
      findAll: jest.fn(),
      findByUrl: jest.fn(),
      findRecent: jest.fn().mockResolvedValue([mockDoc]),
      findById: jest.fn().mockResolvedValue({
        ...mockDoc,
        status: 'success',
        data: { title: 'Example' },
      }),
      markSuccess: jest.fn(),
      markFailed: jest.fn(),
      markRunning: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        { provide: ScraperRepository, useValue: mockRepo },
        { provide: SCRAPER_STRATEGY, useValue: [mockStrategy] },
      ],
    }).compile();

    service = module.get<ScraperService>(ScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scrape', () => {
    it('should execute strategy and persist success', async () => {
      const result = await service.scrape('https://example.com');
      expect(mockRepo.create).toHaveBeenCalledWith(
        'https://example.com',
        'example',
      );
      expect(mockRepo.markRunning).toHaveBeenCalledWith('abc123');
      expect(mockStrategy.scrape).toHaveBeenCalledWith('https://example.com');
      expect(mockRepo.markSuccess).toHaveBeenCalledWith('abc123', {
        title: 'Example',
      });
      expect(result).toBeDefined();
    });

    it('should find strategy by name when provided', async () => {
      const result = await service.scrape('https://example.com', 'example');
      expect(mockRepo.create).toHaveBeenCalledWith(
        'https://example.com',
        'example',
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for unknown strategy name', async () => {
      await expect(
        service.scrape('https://example.com', 'unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no strategy matches URL', async () => {
      mockStrategy.supports.mockReturnValue(false);
      await expect(service.scrape('https://unknown.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mark failed on scrape error', async () => {
      mockStrategy.scrape.mockRejectedValue(new Error('Network timeout'));
      await expect(service.scrape('https://example.com')).rejects.toThrow(
        'Network timeout',
      );
      expect(mockRepo.markFailed).toHaveBeenCalledWith(
        'abc123',
        'Network timeout',
      );
    });
  });

  describe('listStrategies', () => {
    it('should return registered strategy names', () => {
      expect(service.listStrategies()).toEqual(['example']);
    });
  });

  describe('getRecent', () => {
    it('should return recent results', async () => {
      const results = await service.getRecent(5);
      expect(mockRepo.findRecent).toHaveBeenCalledWith(5);
      expect(results).toHaveLength(1);
    });
  });

  describe('getResult', () => {
    it('should return a result by id', async () => {
      const result = await service.getResult('abc123');
      expect(mockRepo.findById).toHaveBeenCalledWith('abc123');
      expect(result).not.toBeNull();
    });

    it('should return null for unknown id', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await service.getResult('unknown');
      expect(result).toBeNull();
    });
  });
});
