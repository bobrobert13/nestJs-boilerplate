import { HttpService } from './http.service';
import { HttpError } from '../http-error';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn(),
    __mockInstance: mockAxiosInstance,
  };
});

import axios from 'axios';

const mockAxios = (axios as any).__mockInstance;

describe('HttpService', () => {
  let service: HttpService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HttpService('https://api.example.com');
  });

  describe('request', () => {
    it('returns typed response on success', async () => {
      mockAxios.request.mockResolvedValue({
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      });

      const result = await service.get<{ id: number; name: string }>(
        '/users/1',
      );

      expect(result.data).toEqual({ id: 1, name: 'Test' });
      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.headers['content-type']).toBe('application/json');
    });

    it('throws HttpError on axios error with response', async () => {
      const axiosError = new Error('Request failed') as any;
      axiosError.response = {
        status: 404,
        statusText: 'Not Found',
        data: null,
      };
      mockAxios.request.mockRejectedValue(axiosError);
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);

      await expect(service.get('/missing')).rejects.toThrow();
    });

    it('throws HttpError on network error without response', async () => {
      const axiosError = new Error('ECONNREFUSED') as any;
      axiosError.response = undefined;
      mockAxios.request.mockRejectedValue(axiosError);
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);

      await expect(service.get('/down')).rejects.toThrow();
    });

    it('throws generic HttpError on non-axios error', async () => {
      mockAxios.request.mockRejectedValue(new Error('unexpected'));
      (axios.isAxiosError as jest.Mock).mockReturnValue(false);

      await expect(service.get('/error')).rejects.toThrow(HttpError);
    });
  });

  describe('HTTP verb methods', () => {
    it('get sends GET request', async () => {
      mockAxios.request.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      await service.get('/resource');

      expect(mockAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', url: '/resource' }),
      );
    });

    it('post sends POST request with body', async () => {
      mockAxios.request.mockResolvedValue({
        data: { created: true },
        status: 201,
        statusText: 'Created',
        headers: {},
      });

      const result = await service.post('/resource', { name: 'new' });

      expect(mockAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST', url: '/resource' }),
      );
      expect(result.status).toBe(201);
    });

    it('put sends PUT request', async () => {
      mockAxios.request.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      await service.put('/resource/1', { name: 'updated' });

      expect(mockAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('patch sends PATCH request', async () => {
      mockAxios.request.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      await service.patch('/resource/1', { name: 'patched' });

      expect(mockAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('delete sends DELETE request', async () => {
      mockAxios.request.mockResolvedValue({
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
      });

      const result = await service.delete('/resource/1');

      expect(mockAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(result.status).toBe(204);
    });
  });

  describe('download', () => {
    it('returns a DownloadService instance', () => {
      const downloadService = service.download('/tmp');
      expect(downloadService).toBeDefined();
    });
  });

  describe('timeout configuration', () => {
    it('applies custom timeout from options', async () => {
      mockAxios.request.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      await service.request('/slow', { timeout: 5000 });

      expect(mockAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('defaults to 30000ms timeout', async () => {
      mockAxios.request.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      await service.request('/normal');

      expect(mockAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 30000 }),
      );
    });
  });
});
