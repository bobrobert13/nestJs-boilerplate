# @common/serve-static

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

## Usage

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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  <script src="<%= tailwindCdn %>"></script>
</head>
<body class="bg-gray-100">
  <%- include('../partials/header.ejs') %>

  <main class="container mx-auto px-4 py-8">
    <%- body %>
  </main>

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

## Available Methods

### `render(view, options)`

Render a page with layout.

```typescript
await serveStatic.render('home', {
  title: 'Página Home',
  description: 'Descripción SEO',
  keywords: 'keyword1, keyword2',
  author: 'Autor',
  layout: 'main',        // Optional, defaults to 'main'
  customData: 'any',      // Any custom data passed to template
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

## TailwindCSS

TailwindCSS is loaded via CDN (`https://cdn.tailwindcss.com`). No build step required.

```html
<script src="<%= tailwindCdn %>"></script>
```

## Adding Custom CSS/JS

Place files in `templates/assets/` and reference them in layouts:

```html
<link rel="stylesheet" href="/assets/css/custom.css">
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

## License

MIT
