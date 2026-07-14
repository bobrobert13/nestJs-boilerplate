import { IsUrl, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO to trigger a one-off scrape via the API.
 */
export class CreateScrapeJobDto {
  /** Full URL to scrape. */
  @IsUrl(
    { protocols: ['http', 'https'] },
    { message: 'A valid HTTP(S) URL is required' },
  )
  url!: string;

  /**
   * Optional strategy name to force a specific scraping strategy.
   * When omitted the service auto-detects from the URL's hostname.
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  strategyName?: string;
}
