import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';

export interface RenderOptions {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  [key: string]: unknown;
}

@Injectable()
export class ServeStaticService {
  private readonly templatesPath: string;
  private readonly tailwindCdn = 'https://cdn.tailwindcss.com';
  private readonly defaultLayout = 'main';

  constructor() {
    this.templatesPath = path.join(__dirname, '..', '..', 'templates');
  }

  private getViewPath(view: string): string {
    return path.join(this.templatesPath, 'pages', `${view}.ejs`);
  }

  private getLayoutPath(layout: string): string {
    return path.join(this.templatesPath, 'layouts', `${layout}.ejs`);
  }

  async render(view: string, options: RenderOptions = {}): Promise<string> {
    const layout = (options.layout as string) || this.defaultLayout;
    const viewPath = this.getViewPath(view);
    const layoutPath = this.getLayoutPath(layout);

    if (!fs.existsSync(viewPath)) {
      throw new Error(`View not found: ${viewPath}`);
    }

    if (!fs.existsSync(layoutPath)) {
      throw new Error(`Layout not found: ${layoutPath}`);
    }

    const baseData = {
      title: 'App',
      description: '',
      keywords: '',
      author: '',
      tailwindCdn: this.tailwindCdn,
      ...options,
    };

    const viewContent = await ejs.renderFile(viewPath, baseData, {
      strict: false,
    });

    return ejs.renderFile(
      layoutPath,
      { ...baseData, body: viewContent },
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

  getPartials(): string[] {
    const partialsPath = path.join(this.templatesPath, 'partials');
    if (!fs.existsSync(partialsPath)) return [];
    return fs
      .readdirSync(partialsPath)
      .filter((f) => f.endsWith('.ejs'))
      .map((f) => f.replace('.ejs', ''));
  }

  getPages(): string[] {
    const pagesPath = path.join(this.templatesPath, 'pages');
    if (!fs.existsSync(pagesPath)) return [];
    return fs
      .readdirSync(pagesPath)
      .filter((f) => f.endsWith('.ejs'))
      .map((f) => f.replace('.ejs', ''));
  }

  getAssetsPath(): string {
    return path.join(this.templatesPath, 'assets');
  }
}
