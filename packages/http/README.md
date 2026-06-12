# @common/http

HTTP client module for NestJS with axios and image download optimization via sharp.

## Features

- **Unified HTTP interface** — Consistent API for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **Image download with optimization** — Resize, convert, and compress images via sharp
- **Automatic error mapping** — Converts axios errors to structured HttpError
- **Response normalization** — Consistent response shape with data, status, headers

## Installation

```bash
npm install @common/http axios sharp
```

## Quick Start

### 1. Import in AppModule

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@common/http';

@Module({
  imports: [HttpModule],
})
export class AppModule {}
```

### 2. Use in any service

```typescript
import { HttpService } from '@common/http';

@Injectable()
export class MyService {
  constructor(private readonly http: HttpService) {}

  async fetchData<T>(url: string): Promise<T> {
    const response = await this.http.get<T>(url);
    return response.data;
  }
}
```

---

## HTTP Methods

All methods return `Promise<HttpResponse<T>>`:

```typescript
interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
```

### GET

```typescript
const response = await http.get<User[]>('/users');

// With custom headers
const response = await http.get('/protected', {
  headers: { Authorization: `Bearer ${token}` },
});
```

### POST

```typescript
const response = await http.post('/users', {
  name: 'John',
  email: 'john@example.com',
});
```

### PUT / PATCH / DELETE

```typescript
await http.put(`/users/${id}`, updates);
await http.patch(`/users/${id}`, partial);
await http.delete(`/users/${id}`);
```

---

## Download Service

Use `.download()` to get a `DownloadService` instance for file operations.

### Download a File

```typescript
const result = await http.download().file('https://example.com/report.pdf', {
  folder: './downloads',
  filename: 'report-2024.pdf',
});
// Result: { filepath, size, filename }
```

### Download and Optimize an Image

```typescript
const result = await http.download().image('https://example.com/photo.jpg', {
  folder: './images',
  optimize: {
    quality: 80,
    width: 800,
    height: 600,
    format: 'webp',  // 'jpeg' | 'png' | 'webp' | 'avif'
  },
});
// Downloads, converts to WebP, resizes, returns { filepath, size, filename }
```

### Download Options

```typescript
interface DownloadOptions {
  folder?: string;        // Subdirectory (default: '')
  filename?: string;       // Custom filename (auto-detected from URL)
  headers?: Record<string, string>;  // Custom headers for auth
}

interface ImageOptimizationOptions {
  quality?: number;       // 1-100 (default: 80)
  width?: number;         // Max width in pixels
  height?: number;        // Max height in pixels
  format?: 'jpeg' | 'png' | 'webp' | 'avif';  // Output format
}
```

---

## Error Handling

All HTTP errors are converted to structured `HttpError`:

```typescript
import { HttpError } from '@common/http';

try {
  await http.get('/api/data');
} catch (error) {
  if (error instanceof HttpError) {
    console.log(error.statusCode);  // e.g., 404
    console.log(error.message);     // e.g., 'Not Found'
    console.log(error.path);        // e.g., '/api/data'
  }
}
```

**Error codes:**
| Status | Class | Use Case |
|--------|-------|----------|
| 400 | BadRequestError | Malformed request |
| 401 | UnauthorizedError | Missing/invalid auth |
| 403 | ForbiddenError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 500 | InternalServerError | Server-side errors |
| 502 | BadGatewayError | Upstream failure |
| 503 | ServiceUnavailableError | Target unavailable |

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `HttpError: 500` | Target server error | Check target service logs |
| `ECONNREFUSED` | Target not reachable | Verify URL and network |
| `ETIMEDOUT` | Request timeout | Increase `timeout` option |
| Image download fails | Invalid URL or auth | Check `headers` option |
| Sharp conversion fails | Unsupported image format | Ensure source is valid image |