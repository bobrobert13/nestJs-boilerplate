import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ScraperRepository } from '../scraper.repository';
import { ScrapeResult } from '../schemas/scrape-result.schema';

describe('ScraperRepository', () => {
  let repository: ScraperRepository;
  let mockModel: any;

  const mockDoc = {
    _id: 'abc123',
    url: 'https://example.com',
    strategyName: 'example',
    status: 'success',
    data: { title: 'Example' },
    errorMessage: null,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperRepository,
        { provide: getModelToken(ScrapeResult.name), useValue: mockModel },
      ],
    }).compile();

    repository = module.get<ScraperRepository>(ScraperRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a pending result document', async () => {
      mockModel.create.mockResolvedValue(mockDoc);
      const result = await repository.create('https://example.com', 'example');
      expect(result._id).toBe('abc123');
      expect(mockModel.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        strategyName: 'example',
        status: 'pending',
      });
    });
  });

  describe('findAll', () => {
    it('should return results sorted by newest first', async () => {
      const chain = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockDoc]),
      };
      mockModel.find.mockReturnValue(chain);

      const results = await repository.findAll();
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('https://example.com');
    });
  });

  describe('findByUrl', () => {
    it('should return most recent result for a URL', async () => {
      const chain = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDoc),
      };
      mockModel.findOne.mockReturnValue(chain);

      const result = await repository.findByUrl('https://example.com');
      expect(result).not.toBeNull();
      expect(result!.url).toBe('https://example.com');
    });

    it('should return null when not found', async () => {
      const chain = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockModel.findOne.mockReturnValue(chain);

      const result = await repository.findByUrl('https://unknown.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return the document', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });
      const result = await repository.findById('abc123');
      expect(result).not.toBeNull();
      expect(result!.url).toBe('https://example.com');
    });
  });

  describe('markSuccess', () => {
    it('should update status to success with data', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue(null);
      await repository.markSuccess('abc123', { title: 'Done' });
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('abc123', {
        status: 'success',
        data: { title: 'Done' },
        errorMessage: null,
      });
    });
  });

  describe('markFailed', () => {
    it('should update status to failed with error and increment retryCount', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });
      mockModel.findByIdAndUpdate.mockResolvedValue(null);
      await repository.markFailed('abc123', 'Network error');
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('abc123', {
        status: 'failed',
        errorMessage: 'Network error',
        retryCount: 1,
      });
    });

    it('should handle null document gracefully', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockModel.findByIdAndUpdate.mockResolvedValue(null);
      await repository.markFailed('unknown', 'Error');
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('unknown', {
        status: 'failed',
        errorMessage: 'Error',
        retryCount: 1,
      });
    });
  });

  describe('markRunning', () => {
    it('should set status to running', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue(null);
      await repository.markRunning('abc123');
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('abc123', {
        status: 'running',
      });
    });
  });
});
