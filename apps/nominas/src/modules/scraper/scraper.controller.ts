import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '@common/auth';
import { ScraperService } from './scraper.service';
import { CreateScrapeJobDto } from './dto/create-scrape-job.dto';
import { ScrapeResultDto } from './dto/scrape-result.dto';

@ApiTags('scraper')
@ApiBearerAuth()
@Controller('scraper')
@Roles('admin')
export class ScraperController {
  /**
   * @param scraperService Orchestrator for scraping strategies.
   */

  constructor(private readonly scraperService: ScraperService) {}

  /**
   * Trigger a one-off scrape.
   * Requires admin role.
   */
  @Post('scrape')
  @ApiOperation({
    summary: 'Scrape a URL using a registered strategy',
    description:
      'Triggers a one-off scrape job. Strategy auto-detected from hostname unless strategyName is provided. Requires admin role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Scrape job completed successfully.',
    type: ScrapeResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL or missing required fields.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized â€” missing JWT.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden â€” requires admin role.',
  })
  @ApiResponse({
    status: 404,
    description: 'No matching strategy found for URL.',
  })
  async scrape(@Body() dto: CreateScrapeJobDto): Promise<ScrapeResultDto> {
    const doc = await this.scraperService.scrape(dto.url, dto.strategyName);
    return this.toDto(doc);
  }

  /** List registered strategies. */
  @Get('strategies')
  @ApiOperation({
    summary: 'List all registered scraping strategies',
    description: 'Returns available strategy names for scraping.',
  })
  @ApiResponse({
    status: 200,
    description: 'Strategy names returned.',
    schema: {
      type: 'array',
      items: { type: 'string', example: 'default' },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized â€” missing JWT.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden â€” requires admin role.',
  })
  listStrategies(): string[] {
    return this.scraperService.listStrategies();
  }

  /** Return recent results. */
  @Get('results')
  @ApiOperation({
    summary: 'List recent scrape results',
    description:
      'Returns recent scrape results ordered by creation date descending.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results to return (default: 20)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent scrape results.',
    type: [ScrapeResultDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized â€” missing JWT.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden â€” requires admin role.',
  })
  async findRecent(@Query('limit') limit?: string): Promise<ScrapeResultDto[]> {
    const docs = await this.scraperService.getRecent(Number(limit) || 20);
    return docs.map((d) => this.toDto(d));
  }

  /** Return a single result. */
  @Get('results/:id')
  @ApiOperation({
    summary: 'Get a single scrape result by ID',
    description: 'Returns a specific scrape result by its MongoDB ObjectId.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'MongoDB ObjectId of the scrape result',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({
    status: 200,
    description: 'Scrape result found.',
    type: ScrapeResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized â€” missing JWT.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden â€” requires admin role.',
  })
  @ApiResponse({ status: 404, description: 'Scrape result not found.' })
  async findOne(@Param('id') id: string): Promise<ScrapeResultDto> {
    const doc = await this.scraperService.getResult(id);
    if (!doc) {
      throw new NotFoundException(`ScrapeResult ${id} not found`);
    }
    return this.toDto(doc);
  }

  // â”€â”€ Private â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private toDto(doc: any): ScrapeResultDto {
    return {
      id: doc._id?.toString() ?? doc.id,
      url: doc.url,
      strategyName: doc.strategyName,
      status: doc.status,
      data: doc.data ?? null,
      errorMessage: doc.errorMessage,
      createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt,
      updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt,
    };
  }
}
