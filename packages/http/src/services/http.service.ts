import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createHttpError, HttpError } from '../http-error';
import { HttpRequestOptions, HttpResponse } from '../interfaces/http-options.interface';
import { DownloadService } from './download.service';

/**
 * HTTP client service wrapping Axios with typed error handling
 * and a fluent download API.
 *
 * Automatically maps Axios errors to the `HttpError` hierarchy so
 * callers can `instanceof`-check specific HTTP status classes.
 *
 * @example
 * ```typescript
 * const { data } = await http.get<User[]>('https://api.example.com/users');
 * const downloader = http.download('/tmp');
 * const { filepath } = await downloader.file('https://example.com/doc.pdf');
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
   * Low-level HTTP request with full options control.
   *
   * @param url - Target URL (relative to baseUrl if configured)
   * @param options - Method, headers, timeout, responseType, and optional body
   * @returns Normalized response with typed data, status, and headers
   * @throws {HttpError} On any HTTP error or network failure
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
      throw new HttpError(500, 'Internal Server Error', error instanceof Error ? error.message : 'Unknown error', url);
    }
  }

  /**
   * Sends a GET request.
   *
   * @param url - Target URL
   * @param headers - Optional request headers
   * @returns Response with typed data
   */
  async get<T = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  /**
   * Sends a POST request.
   *
   * @param url - Target URL
   * @param data - Request body
   * @param headers - Optional request headers
   * @returns Response with typed data
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'POST', headers, data });
  }

  /**
   * Sends a PUT request.
   *
   * @param url - Target URL
   * @param data - Request body
   * @param headers - Optional request headers
   * @returns Response with typed data
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'PUT', headers, data });
  }

  /**
   * Sends a PATCH request.
   *
   * @param url - Target URL
   * @param data - Request body
   * @param headers - Optional request headers
   * @returns Response with typed data
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', headers, data });
  }

  /**
   * Sends a DELETE request.
   *
   * @param url - Target URL
   * @param headers - Optional request headers
   * @returns Response with typed data
   */
  async delete<T = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  /**
   * Creates a DownloadService instance for downloading files, images, and videos.
   *
   * @param baseFolder - Default directory for downloaded files
   * @returns A new DownloadService instance using this client's Axios instance
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