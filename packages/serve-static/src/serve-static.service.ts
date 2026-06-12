import { Injectable, Logger } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';

export interface RenderOptions {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  layout?: string;
  [key: string]: unknown;
}

interface CacheEntry {
  content: string;
  timestamp: number;
}

@Injectable()
export class ServeStaticService {
  private readonly logger = new Logger(ServeStaticService.name);
  private readonly templatesPath: string;
  private readonly tailwindCdn = 'https://cdn.tailwindcss.com';
  private readonly defaultLayout = 'main';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 60_000;

  constructor() {
    this.templatesPath = path.join(__dirname, '..', '..', 'templates');
  }

  private sanitizeViewName(view: string): string {
    if (!view || typeof view !== 'string') {
      throw new Error('View name must be a non-empty string');
    }
    if (/[^a-zA-Z0-9_-]/.test(view)) {
      throw new Error(`Invalid view name: "${view}". Only alphanumeric, hyphen, and underscore allowed.`);
    }
    return view;
  }

  private async getCachedTemplate(filePath: string): Promise<string> {
    const cached = this.cache.get(filePath);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.content;
    }

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      this.cache.set(filePath, { content, timestamp: Date.now() });
      return content;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`File not found: ${path.basename(filePath)}`);
      }
      throw error;
    }
  }

  private clearCache(): void {
    this.cache.clear();
  }

  private getViewPath(view: string): string {
    return path.join(this.templatesPath, 'pages', `${view}.ejs`);
  }

  private getLayoutPath(layout: string): string {
    return path.join(this.templatesPath, 'layouts', `${layout}.ejs`);
  }

  async render(view: string, options: RenderOptions = {}): Promise<string> {
    const safeView = this.sanitizeViewName(view);
    const layout = (options.layout as string) || this.defaultLayout;
    const safeLayout = this.sanitizeViewName(layout);

    const viewPath = this.getViewPath(safeView);
    const layoutPath = this.getLayoutPath(safeLayout);

    let viewContent: string;
    let layoutContent: string;

    try {
      viewContent = await this.getCachedTemplate(viewPath);
    } catch {
      throw new Error(`View not found: ${safeView}`);
    }

    try {
      layoutContent = await this.getCachedTemplate(layoutPath);
    } catch {
      throw new Error(`Layout not found: ${layout}`);
    }

    const baseData = {
      title: 'App',
      description: '',
      keywords: '',
      author: '',
      tailwindCdn: this.tailwindCdn,
      ...options,
    };

    const renderedView = await ejs.render(viewContent, baseData, { strict: false });

    return ejs.render(
      layoutContent,
      { ...baseData, body: renderedView },
      { strict: false },
    );
  }

  async renderString(
    template: string,
    data: Record<string, unknown> = {},
  ): Promise<string> {
    const baseData = {
      tailwindCdn: this.tailwindCdn,
      ...data,
    };
    return ejs.render(template, baseData, { strict: false });
  }

  async getPartials(): Promise<string[]> {
    const partialsPath = path.join(this.templatesPath, 'partials');
    try {
      const files = await fs.promises.readdir(partialsPath);
      return files
        .filter((f) => f.endsWith('.ejs'))
        .map((f) => f.replace('.ejs', ''));
    } catch {
      return [];
    }
  }

  async getPages(): Promise<string[]> {
    const pagesPath = path.join(this.templatesPath, 'pages');
    try {
      const files = await fs.promises.readdir(pagesPath);
      return files
        .filter((f) => f.endsWith('.ejs'))
        .map((f) => f.replace('.ejs', ''));
    } catch {
      return [];
    }
  }

  getAssetsPath(): string {
    return path.join(this.templatesPath, 'assets');
  }

  clearTemplateCache(): void {
    this.clearCache();
    this.logger.log('Template cache cleared');
  }
}