export interface ScrappingStrategy {
  siteName: string;
  scrapeManga(link: string): Promise<{
    name: string;
    description: string;
    genres: string[];
    chapters: { title: string; link: string }[];
  }>;
  scrapeChapterImages(chapterLink: string, viewportHeight?: number): Promise<string[]>;
}