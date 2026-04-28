export interface ScrappingEvents {
  'scrapping/job.started': {
    jobId: string;
    strategyName: string;
    timestamp: string;
  };
  'scrapping/job.completed': {
    jobId: string;
    strategyName: string;
    success: boolean;
    resultCount?: number;
    timestamp: string;
  };
  'scrapping/job.failed': {
    jobId: string;
    strategyName: string;
    error: string;
    timestamp: string;
  };
  'scrapping/chapter.processed': {
    jobId: string;
    chapterId: string;
    chapterTitle: string;
    pagesScraped: number;
    timestamp: string;
  };
  'scrapping/hola-inngest': {
    message: string;
    timestamp: string;
  };
  'manga/chapters-scrape': {
    mangaId: string;
    chapters: { title: string; link: string }[];
    timestamp: string;
  };
}

export type ScrappingEventName = keyof ScrappingEvents;

export type ScrappingEventData<T extends ScrappingEventName> =
  ScrappingEvents[T];

export interface InngestEventPayload<T extends ScrappingEventName> {
  name: T;
  data: ScrappingEvents[T];
  id?: string;
}
