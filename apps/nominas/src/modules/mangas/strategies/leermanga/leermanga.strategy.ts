import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightService } from '@common/playwright';
import type { ScrappingStrategy } from '../../interfaces/scrapping-strategy.interface';

@Injectable()
export class LeermangaStrategy implements ScrappingStrategy {
  private readonly logger = new Logger(LeermangaStrategy.name);
  readonly siteName = 'leermanga';

  constructor(private readonly playwright: PlaywrightService) {}

  async scrapeManga(link: string): Promise<{
    name: string;
    description: string;
    genres: string[];
    chapters: { title: string; link: string }[];
  }> {
    await this.playwright.createPage(link);
    // TODO: Extract real selectors when HTML template is documented
    const name = await this.extractName();
    const description = await this.extractDescription();
    const genres = await this.extractGenres();
    const chapters = await this.extractChapters();
    return { name, description, genres, chapters };
  }

  async scrapeChapterImages(chapterLink: string, viewportHeight = 1080): Promise<string[]> {
    await this.playwright.createPage(chapterLink);
    // TODO: Set viewport height to load all lazy images
    // await this.playwright.page.setViewportSize({ height: viewportHeight });
    // TODO: Extract image selectors when HTML template is documented
    const images: string[] = [];
    return images;
  }

  private async extractName(): Promise<string> {
    return '';
  }

  private async extractDescription(): Promise<string> {
    return '';
  }

  private async extractGenres(): Promise<string[]> {
    return [];
  }

  private async extractChapters(): Promise<{ title: string; link: string }[]> {
    return [];
  }
}

/*
================================================================================
HTML TEMPLATE DOCUMENTATION - Leermanga
================================================================================
Place the HTML structure of the manga page here with comments indicating:
- Where the TITLE is located
- Where the DESCRIPTION is located
- Where the GENRES/TAGS are located
- Where the CHAPTER LIST is located
- Where each CHAPTER LINK and TITLE is located

Example:
<div class="manga-info">
  <h1 class="manga-title"> <!-- TITLE SELECTOR --> </h1>
  <p class="manga-description"> <!-- DESCRIPTION SELECTOR --> </p>
  <div class="genres">
    <span class="genre-tag"> <!-- GENRE SELECTOR --> </span>
  </div>
</div>
<div class="chapter-list">
  <a class="chapter-link" href="..."> <!-- CHAPTER LINK SELECTOR --> </a>
</div>

================================================================================
CHAPTER PAGE HTML TEMPLATE DOCUMENTATION - Leermanga
================================================================================
Place the HTML structure of the chapter page here with comments indicating:
- Where the IMAGES are located
- How they are loaded (lazy loading, infinite scroll, etc.)

Example:
<div class="chapter-pages">
  <img class="page-image" src="..."> <!-- IMAGE SELECTOR --> </img>
</div>
*/