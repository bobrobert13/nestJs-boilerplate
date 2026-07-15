import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** API response shape for a persisted scrape result. */
export class ScrapeResultDto {
  @ApiProperty({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'Unique identifier of the scrape result (MongoDB ObjectId)',
  })
  id!: string;

  @ApiProperty({
    example: 'https://example.com/page',
    description: 'The URL that was scraped',
  })
  url!: string;

  @ApiProperty({
    example: 'default',
    description: 'Name of the scraping strategy used',
  })
  strategyName!: string;

  @ApiProperty({
    example: 'completed',
    description: 'Scrape job status (completed, failed, in_progress)',
  })
  status!: string;

  @ApiProperty({
    example: { title: 'Example Page' },
    description: 'Extracted data payload, or null if scrape failed',
    nullable: true,
  })
  data!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    example: 'Connection timeout',
    description: 'Error message if the scrape failed',
  })
  errorMessage?: string;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'ISO 8601 timestamp when created',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'ISO 8601 timestamp when last updated',
  })
  updatedAt!: string;
}
