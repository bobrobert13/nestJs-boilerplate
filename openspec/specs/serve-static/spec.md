# Serve Static Specification

## Purpose

Renderizado de templates EJS con TailwindCSS vía CDN. Layout system con caché de 60s.

Documentación asociada: `packages/serve-static/README.md`

## Requirements

### Page Rendering

The system MUST render EJS pages within configurable layouts.

#### Scenario: Render page with layout

- GIVEN a page template `home.ejs` and a layout `main.ejs`
- WHEN `ServeStaticService.render('home', { layout: 'main', title: 'Home' })` is called
- THEN the system renders the page content
- AND injects it into the layout's `body` variable
- AND returns the complete HTML

#### Scenario: Default layout

- GIVEN no layout specified
- WHEN `ServeStaticService.render('home', {})` is called
- THEN the system uses 'main' as the default layout

### String Rendering

The system MUST render arbitrary EJS template strings.

#### Scenario: Render template string

- GIVEN an EJS template string with variables
- WHEN `ServeStaticService.renderString(template, data)` is called
- THEN the system renders the string with the provided data

### Template Cache

The system SHOULD cache rendered templates with a 60-second TTL.

#### Scenario: Cache hit

- GIVEN a template rendered within the last 60 seconds
- WHEN the same template is requested again
- THEN the system returns the cached version

#### Scenario: Cache invalidation

- GIVEN stale cached templates
- WHEN `ServeStaticService.clearTemplateCache()` is called
- THEN the system clears all cached templates

### Path Sanitization

The system MUST prevent path traversal attacks by sanitizing view names.

#### Scenario: Invalid view name

- GIVEN a view name with path traversal characters like `../../etc/passwd`
- WHEN `render(invalidView)` is called
- THEN the system throws an error

## Affected Documentation

- `packages/serve-static/README.md`
- `AGENTS.md` — section 3 (Packages Index)
