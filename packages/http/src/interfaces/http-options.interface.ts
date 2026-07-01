/**
 * Configuration for a single HTTP request.
 */
export interface HttpRequestOptions {
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Custom request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Expected response type */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  /** Override base URL for this request */
  baseUrl?: string;
  /** Request body (for POST/PUT/PATCH) */
  data?: unknown;
}

/**
 * Options for file download operations.
 */
export interface DownloadOptions {
  /** Subfolder within the base download directory */
  folder?: string;
  /** Custom filename (auto-extracted from URL if omitted) */
  filename?: string;
  /** Custom request headers sent with the download request */
  headers?: Record<string, string>;
}

/**
 * Image optimization settings applied via Sharp after download.
 */
export interface ImageOptimizationOptions {
  /** Output quality 1-100 (default: 80) */
  quality?: number;
  /** Resize width in pixels */
  width?: number;
  /** Resize height in pixels */
  height?: number;
  /** Output format (default: webp) */
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Normalized HTTP response returned by all HttpService methods.
 */
export interface HttpResponse<T = unknown> {
  /** Response body, typed by the caller */
  data: T;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Normalized response headers (string values only) */
  headers: Record<string, string>;
}