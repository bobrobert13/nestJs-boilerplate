import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MangasService } from './mangas.service';

@ApiTags('mangas')
@Controller('mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  @Post('scrape')
  @ApiOperation({ summary: 'Scrape manga data from URL' })
  async scrape(@Body() body: { link: string }) {
    return this.mangasService.scrapeAndStore(body.link);
  }
}