import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@common/auth';
import { ScraperService } from './scraper.service';
import { CreateScrapeJobDto } from './dto/create-scrape-job.dto';
import { ScrapeResultDto } from './dto/scrape-result.dto';

@ApiTags('scraper')
@Controller('scraper')
@Roles('admin')
export class ScraperController {
  /**
   * @param scraperService Orchestrator for scraping strategies.
   */
  /* eslint-disable-next-line no-unused-vars -- NestJS DI, used via this.scraperService */
  constructor(private readonly scraperService: ScraperService) {}

  /**
   * Trigger a one-off scrape.
   * Requires admin role.
   */
  @Post('scrape')
  @ApiOperation({ summary: 'Scrape a URL using a registered strategy' })
  @ApiResponse({ status: 201, description: 'Scrape job completed.' })
  @ApiResponse({ status: 404, description: 'No matching strategy found.' })
  async scrape(@Body() dto: CreateScrapeJobDto): Promise<ScrapeResultDto> {
    const doc = await this.scraperService.scrape(dto.url, dto.strategyName);
    return this.toDto(doc);
  }

  /** List registered strategies. */
  @Get('strategies')
  @ApiOperation({ summary: 'List all registered scraping strategies' })
  listStrategies(): string[] {
    return this.scraperService.listStrategies();
  }

  /** Return recent results. */
  @Get('results')
  @ApiOperation({ summary: 'List recent scrape results' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findRecent(@Query('limit') limit?: string): Promise<ScrapeResultDto[]> {
    const docs = await this.scraperService.getRecent(Number(limit) || 20);
    return docs.map((d) => this.toDto(d));
  }

  /** Return a single result. */
  @Get('results/:id')
  @ApiOperation({ summary: 'Get a single scrape result by ID' })
  @ApiResponse({ status: 404, description: 'Result not found.' })
  async findOne(@Param('id') id: string): Promise<ScrapeResultDto> {
    const doc = await this.scraperService.getResult(id);
    if (!doc) {
      throw new NotFoundException(`ScrapeResult ${id} not found`);
    }
    return this.toDto(doc);
  }

  // ── Private ────────────────────────────────────────────────

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
