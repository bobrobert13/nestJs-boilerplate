import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@common/http';
import type { ScrappingStrategy } from '../../interfaces/scrapping-strategy.interface';

@Injectable()
export class ManhwawebStrategy implements ScrappingStrategy {
  private readonly logger = new Logger(ManhwawebStrategy.name);
  readonly siteName = 'manhwaweb';

  constructor(private readonly http: HttpService) {}

  async scrapeManga(link: string): Promise<{
    name: string;
    description: string;
    genres: string[];
    chapters: { title: string; link: string }[];
  }> {
    const response = await this.http.get(link);
    const data = response.data;
    return {
      name: '',
      description: '',
      genres: [],
      chapters: [],
    };
  }

  async scrapeChapterImages(chapterLink: string): Promise<string[]> {
    const response = await this.http.get(chapterLink);
    const html = response.data as string;
    return [];
  }
}