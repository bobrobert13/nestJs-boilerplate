import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { MangasRepository } from './mangas.repository';
import { LeermangaStrategy } from './strategies/leermanga/leermanga.strategy';
import { ManhwawebStrategy } from './strategies/manhwaweb/manhwaweb.strategy';
import { InngestService } from '@common/inngest';
import { Manga } from './schemas/manga.schema';
import type { ScrappingStrategy } from './interfaces/scrapping-strategy.interface';

@Injectable()
export class MangasService {
  private readonly logger = new Logger(MangasService.name);
  constructor(
    private readonly repository: MangasRepository,
    private readonly leermangaStrategy: LeermangaStrategy,
    private readonly manhwawebStrategy: ManhwawebStrategy,
    private readonly inngest: InngestService,
  ) {}

  private getStrategy(site: string): ScrappingStrategy {
    switch (site) {
      case 'leermanga':
        return this.leermangaStrategy;
      case 'manhwaweb':
        return this.manhwawebStrategy;
      default:
        throw new UnprocessableEntityException(`Site '${site}' not supported`);
    }
  }

  async scrapeAndStore(link: string, site: string = 'leermanga'): Promise<{ id: string }> {
    const strategy = this.getStrategy(site);
    const data = await strategy.scrapeManga(link);
    const manga = await this.repository.create(data as Partial<Manga>);
    const mangaId = (manga as Manga)._id?.toString() ?? '';
    await this.inngest.sendEvent({
      name: 'manga/chapters-scrape',
      data: {
        mangaId,
        chapters: data.chapters,
        timestamp: new Date().toISOString(),
      },
    });
    return { id: mangaId };
  }
}