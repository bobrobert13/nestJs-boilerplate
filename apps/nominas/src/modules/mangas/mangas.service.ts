import { Injectable, Logger } from '@nestjs/common';
import { MangasRepository } from './mangas.repository';
import { LeermangaStrategy } from './strategies/leermanga/leermanga.strategy';
import { InngestService } from '@common/inngest';
import { Manga } from './schemas/manga.schema';
@Injectable()
export class MangasService {
  private readonly logger = new Logger(MangasService.name);
  constructor(
    private readonly repository: MangasRepository,
    private readonly leermangaStrategy: LeermangaStrategy,
    private readonly inngest: InngestService,
  ) {}
  async scrapeAndStore(link: string): Promise<{ id: string }> {
    const data = await this.leermangaStrategy.scrapeManga(link);
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