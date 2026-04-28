import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createHttpError, HttpError } from '../http-error';
import {
  HttpRequestOptions,
  HttpResponse,
} from '../interfaces/http-options.interface';
import { DownloadService } from './download.service';

export class HttpService {
  private readonly client: AxiosInstance;

  constructor(baseUrl?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
    });
  }

  async request<T = unknown>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const config: AxiosRequestConfig = {
      method: options.method ?? 'GET',
      url,
      headers: options.headers,
      timeout: options.timeout ?? 30000,
      responseType: options.responseType ?? 'json',
    };

    try {
      const response = await this.client.request<T>(config);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: this.normalizeHeaders(response.headers),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const message = error.response?.statusText ?? error.message;
        throw createHttpError(status, message, url, error.response?.data);
      }
      throw new HttpError(
        500,
        'Internal Server Error',
        error instanceof Error ? error.message : 'Unknown error',
        url,
      );
    }
  }

  async get<T = unknown>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'POST', headers, data });
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'PUT', headers, data });
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', headers, data });
  }

  async delete<T = unknown>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  download(baseFolder?: string): DownloadService {
    return new DownloadService(this.client, baseFolder);
  }

  private normalizeHeaders(headers: unknown): Record<string, string> {
    const result: Record<string, string> = {};
    if (headers && typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
          result[key] = value;
        }
      }
    }
    return result;
  }
}
