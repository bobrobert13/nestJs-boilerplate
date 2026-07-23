import { DownloadService } from './download.service';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    webp: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  }));
  return mockSharp;
});

describe('DownloadService', () => {
  let service: DownloadService;
  let mockAxiosClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosClient = {
      get: jest.fn(),
    };
    service = new DownloadService(mockAxiosClient, '/tmp/downloads');
  });

  describe('file', () => {
    it('downloads a file and returns result', async () => {
      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((event, cb) => {
          if (event === 'finish') cb();
        }),
      };
      mockAxiosClient.get.mockResolvedValue({ data: mockStream });
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockStream);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.file('https://example.com/doc.pdf');

      expect(result.filename).toBe('doc.pdf');
      expect(result.size).toBe(1024);
      expect(mockAxiosClient.get).toHaveBeenCalledWith(
        'https://example.com/doc.pdf',
        expect.objectContaining({ responseType: 'stream' }),
      );
    });

    it('uses custom filename when provided', async () => {
      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((event, cb) => {
          if (event === 'finish') cb();
        }),
      };
      mockAxiosClient.get.mockResolvedValue({ data: mockStream });
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockStream);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 512 });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.file('https://example.com/file', {
        filename: 'custom-name.pdf',
      });

      expect(result.filename).toBe('custom-name.pdf');
    });

    it('throws HttpError on axios failure', async () => {
      const axiosError = new Error('Not Found') as any;
      axiosError.response = { status: 404, statusText: 'Not Found' };
      axiosError.isAxiosError = true;
      mockAxiosClient.get.mockRejectedValue(axiosError);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // axios.isAxiosError needs to be mocked at module level
      const axios = require('axios');
      axios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(
        service.file('https://example.com/missing.pdf'),
      ).rejects.toThrow();
    });
  });

  describe('extractFilename', () => {
    it('extracts filename from URL', async () => {
      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((event, cb) => {
          if (event === 'finish') cb();
        }),
      };
      mockAxiosClient.get.mockResolvedValue({ data: mockStream });
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockStream);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 100 });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.file(
        'https://cdn.example.com/images/photo.jpg',
      );

      expect(result.filename).toBe('photo.jpg');
    });

    it('falls back to "download" for URLs without filename', async () => {
      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((event, cb) => {
          if (event === 'finish') cb();
        }),
      };
      mockAxiosClient.get.mockResolvedValue({ data: mockStream });
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockStream);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 100 });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.file('https://example.com/');

      expect(result.filename).toBe('download');
    });
  });

  describe('video', () => {
    it('delegates to file method', async () => {
      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((event, cb) => {
          if (event === 'finish') cb();
        }),
      };
      mockAxiosClient.get.mockResolvedValue({ data: mockStream });
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockStream);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 5000 });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.video('https://example.com/clip.mp4');

      expect(result.filename).toBe('clip.mp4');
    });
  });
});
