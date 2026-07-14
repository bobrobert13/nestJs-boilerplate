<!-- scraper — status: new -->

# Scraper Module

Web scraping module built on `@common/playwright`. Uses the **Strategy pattern**
to support multiple target websites with different HTML structures.

## Features

- **Strategy pattern** — Each website has its own `IScraperStrategy` implementation
- **Shared base class** — `BaseScraperStrategy` encapsulates Playwright orchestration, retry, error handling
- **MongoDB persistence** — All scrape results stored in `scrape_results` collection
- **Scheduled jobs** — Cron-based recurring scrapes via `@nestjs/schedule`
- **Admin-only API** — All endpoints require `admin` role
- **Sites reference docs** — `sites/*.md` files document HTML structure per target site

## Architecture

```
ScraperController  (REST API, @Roles('admin'))
        │
ScraperService     (Context/registry — selects & invokes strategies)
   │        │
   │   IScraperStrategy[]  (multi-provider injection)
   │        ├── ExampleScraperStrategy  (concrete: Hacker News)
   │        └── ...                     (future: Amazon, MercadoLibre, etc.)
   │
ScraperRepository  (MongoDB data access)

ScraperCronService  (@Cron scheduled jobs)
   │
   └── ScraperService.scrape()
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/scraper/scrape` | Trigger a one-off scrape | admin |
| `GET` | `/api/scraper/strategies` | List registered strategies | admin |
| `GET` | `/api/scraper/results` | List recent results | admin |
| `GET` | `/api/scraper/results/:id` | Get single result | admin |

### Example Request

```http
POST /api/scraper/scrape
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "url": "https://news.ycombinator.com",
  "strategyName": "example"
}
```

## Adding a New Strategy

1. Create a `.md` reference doc in `sites/` documenting the target HTML structure.
2. Create a new class extending `BaseScraperStrategy`.
3. Implement `name`, `supports()`, `getSelectors()`, `extractData()`.
4. Register it in `ScraperModule.providers` as a multi-provider:

```typescript
{ provide: SCRAPER_STRATEGY, useClass: MyNewStrategy, multi: true }
```

## Scheduled Jobs

CRON jobs are defined in `ScraperCronService`. By default, an example job
scrapes Hacker News every 6 hours. To disable, remove or comment the `@Cron` decorator.

## Dependencies

- `@common/playwright` — Browser automation
- `@common/database` — MongoDB (global)
- `@nestjs/schedule` — Cron scheduling (global via `CronModule`)
