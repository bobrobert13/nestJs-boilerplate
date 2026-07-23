import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createHttpError, HttpError } from '../http-error';
import {
  HttpRequestOptions,
  HttpResponse,
} from '../interfaces/http-options.interface';
import { DownloadService } from './download.service';

/**
 * HTTP client service wrapping axios with typed responses and error handling.
 * Provides convenience methods for common HTTP verbs and automatic error mapping.
 *
 * @example
 * ```typescript
 * const http = new HttpService('https://api.example.com');
 * const response = await http.get<User>('/users/123');
 * ```
 */
export class HttpService {
  private readonly client: AxiosInstance;

  constructor(baseUrl?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
    });
  }

  /**
   * Send an HTTP request with full control over method, headers, and body.
   *
   * @param url - Request URL (relative to baseUrl if set)
   * @param options - Request options (method, headers, timeout, data, etc.)
   * @returns HttpResponse with typed data, status, and headers
   * @throws HttpError subclass on non-2xx responses or network errors
   */
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

  /**
   * Send a GET request.
   * @param url - Request URL
   * @param headers - Optional request headers
   * @returns HttpResponse with typed data
   */
  async get<T = unknown>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  /**
   * Send a POST request.
   * @param url - Request URL
   * @param data - Request body
   * @param headers - Optional request headers
   * @returns HttpResponse with typed data
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'POST', headers, data });
  }

  /**
   * Send a PUT request.
   * @param url - Request URL
   * @param data - Request body
   * @param headers - Optional request headers
   * @returns HttpResponse with typed data
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'PUT', headers, data });
  }

  /**
   * Send a PATCH request.
   * @param url - Request URL
   * @param data - Request body
   * @param headers - Optional request headers
   * @returns HttpResponse with typed data
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', headers, data });
  }

  /**
   * Send a DELETE request.
   * @param url - Request URL
   * @param headers - Optional request headers
   * @returns HttpResponse with typed data
   */
  async delete<T = unknown>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  /**
   * Create a DownloadService for file downloads with optional image optimization.
   * @param baseFolder - Base folder for downloaded files
   * @returns Configured DownloadService instance
   */
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
