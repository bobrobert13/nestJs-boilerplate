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

/**
 * EJS template rendering service with layout support and TailwindCSS CDN integration.
 * Provides server-side rendering for static pages with caching (60s TTL).
 *
 * Features:
 * - Layout-based rendering (pages + layouts)
 * - Template caching with configurable TTL
 * - TailwindCSS CDN with SRI integrity hash
 * - View name sanitization to prevent path traversal
 *
 * @example
 * ```typescript
 * const html = await this.serveStatic.render('home', {
 *   title: 'Welcome',
 *   description: 'Home page',
 * });
 * ```
 */
@Injectable()
export class ServeStaticService {
  private readonly logger = new Logger(ServeStaticService.name);
  private readonly templatesPath: string;
  private readonly tailwindCdn = 'https://cdn.tailwindcss.com';
  /**
   * L2 / hardening-medium-low — SHA-384 SRI hash for the Tailwind CDN body.
   * KNOWN-GOTCHA: refresh this value when the upstream CDN body changes
   * (fetched 2026-07-16). Compute via:
   *   curl -sSL https://cdn.tailwindcss.com | openssl dgst -sha384 -binary \
   *     | openssl base64 -A
   */
  private readonly tailwindIntegrity =
    'sha384-igm5BeiBt36UU4gqwWS7imYmelpTsZlQ45FZf+XBn9MuJbn4nQr7yx1yFydocC/K';
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
    // L7 / hardening-medium-low — strict charset: only alphanumerics,
    // underscore and hyphen. The previous regex was the inverse
    // (deny-list) which admitted `.` and `/`. We additionally refuse any
    // `..` traversal fragment before path.resolve() below as a
    // defense-in-depth check.
    if (!/^[a-zA-Z0-9_-]+$/.test(view)) {
      throw new Error(
        `Invalid view name: "${view}". Only alphanumeric, hyphen, and underscore allowed.`,
      );
    }
    if (view.includes('..')) {
      throw new Error(`Invalid view name: "${view}" contains '..'`);
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
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
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
   * Render a view template with a layout.
   * Sanitizes view and layout names to prevent path traversal attacks.
   *
   * @param view - View name (without .ejs extension)
   * @param options - Render options including title, description, layout, and custom data
   * @returns Rendered HTML string
   * @throws Error if view or layout not found, or view name is invalid
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
      tailwindIntegrity: this.tailwindIntegrity,
      ...options,
    };

    const renderedView = await ejs.render(viewContent, baseData, {
      strict: false,
    });

    return ejs.render(
      layoutContent,
      { ...baseData, body: renderedView },
      { strict: false },
    );
  }

  /**
   * Render an inline EJS template string with data.
   * Useful for dynamic content without file-based templates.
   *
   * @param template - EJS template string
   * @param data - Data object for template interpolation
   * @returns Rendered HTML string
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
   * List all available partial template names.
   * @returns Array of partial names (without .ejs extension)
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
   * List all available page template names.
   * @returns Array of page names (without .ejs extension)
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
   * Get the absolute path to the assets directory.
   * @returns Path to templates/assets folder
   */
  getAssetsPath(): string {
    return path.join(this.templatesPath, 'assets');
  }

  /**
   * Clear the template cache.
   * Useful during development when templates change frequently.
   */
  clearTemplateCache(): void {
    this.clearCache();
    this.logger.log('Template cache cleared');
  }
}
