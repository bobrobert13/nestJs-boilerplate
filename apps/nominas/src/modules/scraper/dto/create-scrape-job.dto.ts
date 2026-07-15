import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUrl, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO to trigger a one-off scrape via the API.
 */
export class CreateScrapeJobDto {
  /** Full URL to scrape. */
  @ApiProperty({
    example: 'https://example.com',
    description: 'The full HTTP(S) URL to scrape',
  })
  @IsUrl(
    { protocols: ['http', 'https'] },
    { message: 'A valid HTTP(S) URL is required' },
  )
  url!: string;

  /**
   * Optional strategy name to force a specific scraping strategy.
   * When omitted the service auto-detects from the URL''s hostname.
   */
  @ApiPropertyOptional({
    example: 'default',
    description:
      'Optional strategy name. When omitted, auto-detected from hostname.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  strategyName?: string;
}
