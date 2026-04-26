export interface ScrapingResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
