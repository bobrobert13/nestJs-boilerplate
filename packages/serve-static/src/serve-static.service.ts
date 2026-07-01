import { Injectable, Logger } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';

/** Options passed to EJS template rendering, including SEO metadata and layout selection. */
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

/**
 * Service for rendering EJS templates with layout support and template caching.
 * Loads templates from the `templates/` directory and injects TailwindCSS via CDN.
 */
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

  /**
   * Renders a page view within a layout template.
   * The view file is loaded from `templates/pages/<view>.ejs` and wrapped
   * in the specified layout from `templates/layouts/<layout>.ejs`.
   * @param view - Name of the page template (without .ejs extension).
   * @param options - Render options including title, description, and layout name.
   * @returns The fully rendered HTML string.
   * @throws If the view or layout file is not found.
   */
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

  /**
   * Renders a raw EJS template string with optional data.
   * The TailwindCSS CDN URL is automatically available as `tailwindCdn` in the template context.
   * @param template - Raw EJS template string to render.
   * @param data - Key-value pairs available in the template context.
   * @returns The rendered HTML string.
   */
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

  /**
   * Lists all available partial templates from `templates/partials/`.
   * @returns Array of partial names (without .ejs extension). Returns empty array if the directory doesn't exist.
   */
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

  /**
   * Lists all available page templates from `templates/pages/`.
   * @returns Array of page names (without .ejs extension). Returns empty array if the directory doesn't exist.
   */
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

  /**
   * Returns the absolute filesystem path to the `templates/assets/` directory.
   * @returns The full path to the assets directory.
   */
  getAssetsPath(): string {
    return path.join(this.templatesPath, 'assets');
  }

  /**
   * Clears the in-memory template cache.
   * Use after modifying template files at runtime to pick up changes without restarting.
   */
  clearTemplateCache(): void {
    this.clearCache();
    this.logger.log('Template cache cleared');
  }
}