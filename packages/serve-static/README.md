<!-- @common/serve-static — status: partial -->

# @common/serve-static — Static File Serving with EJS

Servicio de renderizado de templates EJS con TailwindCSS vía CDN. Ideal para páginas server-side sin framework frontend.

## Quick Start

```typescript
import { ServeStaticModule, ServeStaticService } from '@common/serve-static';

@Module({
  imports: [ServeStaticModule], // Global
})
export class AppModule {}
```

```typescript
@Controller()
export class AppController {
  constructor(private readonly ss: ServeStaticService) {}

  @Get()
  async home(@Res() res: Response) {
    const html = await this.ss.render('home', {
      title: 'Bienvenido',
      description: 'Página principal',
      layout: 'main',
    });
    res.send(html);
  }
}
```

## Environment Variables

No requiere variables de entorno. Usa la carpeta `templates/` del paquete como raíz.

## Template Structure

```
packages/serve-static/templates/
├── layouts/          # Layouts (main.ejs) — contienen {{{body}}}
├── pages/            # Vistas (home.ejs, about.ejs)
├── partials/         # Fragmentos reutilizables (header.ejs, footer.ejs)
└── assets/           # Archivos estáticos (css/, js/, img/)
```

### Layout Example (`layouts/main.ejs`)

```html
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <script src="<%= tailwindCdn %>"></script>
</head>
<body>
  <%- body %>
</body>
</html>
```

## API

### `ServeStaticService`

| Método | Descripción |
|--------|-------------|
| `render(view, options?)` | Renderiza una página con layout |
| `renderString(template, data?)` | Renderiza un string EJS |
| `getPages()` | Lista las páginas disponibles |
| `getPartials()` | Lista los partials disponibles |
| `getAssetsPath()` | Ruta absoluta a la carpeta assets |
| `clearTemplateCache()` | Invalida caché de templates |

### `RenderOptions`

```typescript
interface RenderOptions {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  layout?: string;     // default: 'main'
  [key: string]: unknown; // datos adicionales para el template
}
```

## Features

- **Caché de templates**: 60s TTL, se invalida con `clearTemplateCache()`
- **Sanitización**: valida nombres de vistas (solo alfanumérico, guiones y guión bajo)
- **TailwindCSS vía CDN**: inyecta `https://cdn.tailwindcss.com` como `tailwindCdn`
- **Layout system**: las páginas se renderizan dentro de un layout que contiene `<%- body %>`

## Seguridad

- Los nombres de vista son sanitizados contra path traversal (`/[^a-zA-Z0-9_-]/`)
- Los templates se leen desde `templates/` únicamente
- Modo `strict: false` en EJS para compatibilidad

## Dependencies

- `ejs` (empaquetado en NestJS o peer)

## Deployment

No requiere configuración especial. Los templates se empaquetan en `dist/` al hacer build. Para producción, asegurarse de que la carpeta `templates/` se copie al directorio de salida.
