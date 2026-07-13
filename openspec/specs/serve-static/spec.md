# Serve Static Specification

## Purpose

Renderizado de templates EJS con TailwindCSS via CDN. Layout system donde una pagina se inyecta dentro de un layout con `<%- body %>`. Cache de templates con TTL de 60 segundos.

Templates leidos desde `templates/` (relativo al paquete) con subcarpetas `pages/`, `layouts/`, `partials/`, `assets/`.

Documentacion asociada: `packages/serve-static/README.md`, `AGENTS.md` (seccion 4).

## Requirements

### Page Rendering with Layout

The system MUST render EJS pages within configurable layouts.

#### Scenario: Render page with explicit layout

- GIVEN a page `home.ejs` and a layout `main.ejs`
- WHEN `serveStatic.render("home", { layout: "main", title: "Home" })` is called
- THEN the system renders the page content
  - AND injects it as the `body` variable into the layout
  - AND returns the complete HTML string

#### Scenario: Default layout used when not specified

- GIVEN no `layout` option
- WHEN `render("home", {})` is called
- THEN the system uses `"main"` as the default layout

### RenderOptions Default Values

The system MUST merge `RenderOptions` with sensible defaults for `title`, `description`, `keywords`, `author`, and `tailwindCdn`.

#### Scenario: Missing metadata has defaults

- GIVEN `render("home", {})`
- WHEN rendering
- THEN `title = "App"`, `description = ""`, `keywords = ""`, `author = ""`, `tailwindCdn = "https://cdn.tailwindcss.com"`

### Template Cache

The system MUST cache rendered template files (raw file content) with a 60-second TTL via in-memory `Map`.

#### Scenario: Cache hit within TTL

- GIVEN a template `home.ejs` was rendered within last 60 seconds
- WHEN the same template is requested again
- THEN the system returns the cached version without re-reading from disk

#### Scenario: Manual cache invalidation

- GIVEN stale cached templates
- WHEN `clearTemplateCache()` is called
- THEN the system clears the cache
  - AND logs `"Template cache cleared"`

### Path Sanitization

The system MUST prevent path traversal attacks by sanitizing view and layout names (alphanumeric, hyphen, underscore only).

#### Scenario: Reject invalid view name

- GIVEN a view name `"../../etc/passwd"`
- WHEN `render("../../etc/passwd")` is called
- THEN the system throws `Error: Invalid view name: "../../etc/passwd". Only alphanumeric, hyphen, and underscore allowed.`

#### Scenario: Reject non-string view name

- GIVEN `render(null as any)` or `render("")`
- WHEN called
- THEN the system throws `Error: View name must be a non-empty string`

### String Rendering

The system MUST render arbitrary EJS template strings (not files).

#### Scenario: renderString with data

- GIVEN `renderString("<h1><%= name %></h1>", { name: "Alice" })`
- WHEN called
- THEN the system returns `"<h1>Alice</h1>"`

### Partials and Pages Discovery

The system MUST expose methods to list available pages and partials.

#### Scenario: List pages

- GIVEN `templates/pages/` contains `home.ejs` and `about.ejs`
- WHEN `getPages()` is called
- THEN it returns `["home", "about"]` (without `.ejs` extension)

#### Scenario: List partials

- GIVEN `templates/partials/` contains `header.ejs`
- WHEN `getPartials()` is called
- THEN it returns `["header"]`

#### Scenario: Missing folders return empty array

- GIVEN `templates/partials/` does not exist
- WHEN `getPartials()` is called
- THEN it returns `[]` (does not throw)

### Assets Path

The system MUST expose the absolute path to the `assets/` folder.

#### Scenario: getAssetsPath returns absolute path

- GIVEN `templatesPath = "/abs/templates"`
- WHEN `getAssetsPath()` is called
- THEN it returns `"/abs/templates/assets"`

### View/Layout Not Found Errors

The system MUST throw clear errors when a view or layout file is missing.

#### Scenario: View not found

- GIVEN `nonexistent.ejs` does not exist
- WHEN `render("nonexistent")` is called
- THEN the system throws `Error: View not found: nonexistent`

#### Scenario: Layout not found

- GIVEN `custom.ejs` (layout) does not exist
- WHEN `render("home", { layout: "custom" })` is called
- THEN the system throws `Error: Layout not found: custom`

## Affected Documentation

- `packages/serve-static/README.md`
- `AGENTS.md` — section 4 (Packages Index)
