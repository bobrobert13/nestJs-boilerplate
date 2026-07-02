# @common/serve-static

<!-- @common/serve-static — status: partial -->

Static file serving module with EJS template engine and TailwindCSS CDN support.

## Features

- **EJS Template Engine**: Server-side rendering with includes and layouts
- **TailwindCSS CDN**: Quick setup without build step
- **Layouts System**: Reusable layouts with partials
- **Hot Templates**: Templates served from `templates/` folder for easy editing

## Installation

```bash
npm install @common/serve-static ejs
```

## Structure

```
packages/serve-static/
├── src/
│   ├── index.ts              # Exports
│   ├── serve-static.module.ts # NestJS module
│   └── serve-static.service.ts # Template rendering service
└── templates/                 # Work folder for templates
    ├── layouts/              # Layout templates
    │   └── main.ejs
    ├── pages/               # Page templates
    │   └── home.ejs
    ├── partials/            # Reusable partials
    │   ├── header.ejs
    │   └── footer.ejs
    └── assets/               # Static assets
        ├── css/
        └── js/
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@common/serve-static';

@Module({
  imports: [ServeStaticModule],
})
export class AppModule {}
```

### 2. Use in Controller

```typescript
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ServeStaticService } from '@common/serve-static';

@Controller()
export class AppController {
  constructor(private readonly serveStatic: ServeStaticService) {}

  @Get()
  async home(@Res() res: Response) {
    const html = await this.serveStatic.render('home', {
      title: 'Bienvenido',
      description: 'Página principal',
      layout: 'main',
    });
    res.send(html);
  }

  @Get('about')
  async about(@Res() res: Response) {
    const html = await this.serveStatic.render('about', {
      title: 'Acerca de',
      description: 'Página about',
    });
    res.send(html);
  }
}
```

## Templates

### Layout (templates/layouts/main.ejs)

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= title %></title>
    <script src="<%= tailwindCdn %>"></script>
  </head>
  <body class="bg-gray-100">
    <%- include('../partials/header.ejs') %>

    <main class="container mx-auto px-4 py-8"><%- body %></main>

    <%- include('../partials/footer.ejs') %>
  </body>
</html>
```

### Page (templates/pages/home.ejs)

```html
<div class="bg-white rounded-lg shadow-md p-6">
  <h1 class="text-3xl font-bold mb-4 text-blue-600">Bienvenido</h1>
  <p class="text-gray-700">Contenido de la página.</p>
</div>
```

### Partials (templates/partials/header.ejs)

```html
<header class="bg-white shadow">
  <nav class="container mx-auto px-4 py-4">
    <a href="/" class="text-xl font-bold text-blue-600">Mi App</a>
  </nav>
</header>
```

## API Reference

### `render(view, options)`

Render a page with layout.

```typescript
await serveStatic.render('home', {
  title: 'Página Home',
  description: 'Descripción SEO',
  keywords: 'keyword1, keyword2',
  author: 'Autor',
  layout: 'main', // Optional, defaults to 'main'
  customData: 'any', // Any custom data passed to template
});
```

### `renderString(template, data)`

Render a template string directly.

```typescript
const html = await serveStatic.renderString('<h1><%= title %></h1>', {
  title: 'Hello',
});
```

### `getPages()`

List available pages.

```typescript
const pages = serveStatic.getPages(); // ['home', 'about', ...]
```

### `getPartials()`

List available partials.

```typescript
const partials = serveStatic.getPartials(); // ['header', 'footer', ...]
```

### `getAssetsPath()`

Returns the absolute path to the `templates/assets/` directory.

```typescript
const assetsPath = serveStatic.getAssetsPath();
// e.g., '/app/packages/serve-static/templates/assets'
```

### `clearTemplateCache()`

Clears the internal EJS template cache. Call after modifying template files at runtime.

```typescript
serveStatic.clearTemplateCache();
```

## TailwindCSS

TailwindCSS is loaded via CDN (`https://cdn.tailwindcss.com`). No build step required.

```html
<script src="<%= tailwindCdn %>"></script>
```

## Adding Custom CSS/JS

Place files in `templates/assets/` and reference them in layouts:

```html
<link rel="stylesheet" href="/assets/css/custom.css" />
<script src="/assets/js/main.js"></script>
```

For serving static assets, configure in your app:

```typescript
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'packages/serve-static/templates'),
      serveRoot: '/static',
    }),
  ],
})
export class AppModule {}
```

## Environment Variables

No environment variables required for basic usage.

## Error Handling

### Template Errors

| Error                               | Cause                                   | Resolution                                                |
| ----------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| `ENOENT: no such file`              | Template file not found in `templates/` | Verify the view name matches a file in `templates/pages/` |
| `Error: Could not find the include` | Missing partial or layout               | Check partial file exists in `templates/partials/`        |
| `ejs.compile: ... is not defined`   | Undefined variable in template          | Ensure all variables are passed in the `options` object   |
| `SyntaxError` in template           | Invalid EJS syntax                      | Check EJS delimiters (`<%= %>`, `<%- %>`, `<% %>`)        |

### Recovery Pattern

```typescript
try {
  const html = await serveStatic.render('home', { title: 'Welcome' });
  res.send(html);
} catch (error) {
  if (error.code === 'ENOENT') {
    res.status(500).send('Template not found');
  } else {
    res.status(500).send('Template rendering error');
  }
}
```

## Common Pitfalls

- **Template path resolution**: Templates are resolved relative to `<serve-static-root>/templates/`. If you see "no such file" errors, verify the package is installed correctly and the `templates/` folder exists at the expected path.
- **TailwindCSS CDN in production**: The CDN script loads TailwindCSS at runtime from `cdn.tailwindcss.com`. In production, this adds ~300 KB to every page load and introduces a third-party dependency. Consider using a build step (`@tailwindcss/cli`) or purging unused styles instead.
- **serveRoot path conflict**: `ServeStaticModule.forRoot({ serveRoot: '/static' })` serves everything under `/static`. This may conflict with your API routes. Use a distinct prefix like `/assets`.
- **Cached templates**: Templates are cached in memory after first render. If you edit templates during development without restarting, you may see stale output. Call `clearTemplateCache()` to force reload.

## License

MIT
