<!-- @common/bunny — status: complete -->

# @common/bunny — Bunny.net Edge Storage Module

> NestJS module for bunny.net Edge Storage file management. Wraps the official `@bunny.net/storage-sdk` with typed methods, DI, and graceful degradation.

---

## Overview

`@common/bunny` provides a `BunnyStorageService` for managing files in bunny.net storage zones:

- **Upload** files (streams, buffers, Node.js Readable)
- **Download** files with metadata
- **List** files and directories
- **Delete** files and directories
- **Inspect** file metadata
- **Check existence** of files
- **Generate public CDN URLs**

---

## Installation

The package is a local library in the monorepo. Ensure the SDK is installed at the root:

```bash
npm install "@bunny.net/storage-sdk"
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BUNNY_STORAGE_ZONE_NAME` | Yes | — | Your bunny.net storage zone name |
| `BUNNY_STORAGE_ACCESS_KEY` | Yes | — | Storage zone password (AccessKey) |
| `BUNNY_STORAGE_REGION` | No | `falkenstein` | Primary region (see table below) |
| `BUNNY_CDN_URL` | No | — | Pull zone CDN URL for public URL generation |

### Supported Regions

| Region Name | Location |
|-------------|----------|
| `falkenstein` | Frankfurt, DE (default) |
| `london` | London, UK |
| `newyork` | New York, US |
| `losangeles` | Los Angeles, US |
| `singapore` | Singapore, SG |
| `stockholm` | Stockholm, SE |
| `saopaulo` | Sao Paulo, BR |
| `johannesburg` | Johannesburg, ZA |
| `sydney` | Sydney, AU |

---

## Usage

### Register the Module

```typescript
// app.module.ts
import { BunnyModule } from '@common/bunny';

@Module({
  imports: [BunnyModule],
})
export class AppModule {}
```

### Inject the Service

```typescript
import { Injectable } from '@nestjs/common';
import { BunnyStorageService } from '@common/bunny';
import { Readable } from 'node:stream';

@Injectable()
export class MediaService {
  constructor(private readonly bunny: BunnyStorageService) {}

  // Upload a buffer
  async uploadImage(buffer: Buffer): Promise<void> {
    await this.bunny.uploadBuffer('/images/photo.jpg', buffer, 'image/jpeg');
  }

  // Upload from a Node.js stream
  async uploadStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    await this.bunny.uploadFile(path, stream, { contentType: 'application/pdf' });
  }

  // Download a file
  async download(path: string) {
    const { stream, length } = await this.bunny.downloadFile(path);
    return { stream, length };
  }

  // List directory contents
  async listImages() {
    return this.bunny.listFiles('/images');
  }

  // Get file metadata
  async getInfo(path: string) {
    return this.bunny.getFileMetadata(path);
  }

  // Delete a file
  async remove(path: string) {
    return this.bunny.deleteFile(path);
  }

  // Delete a directory recursively
  async removeFolder(path: string) {
    return this.bunny.deleteDirectory(path);
  }

  // Check if file exists
  async exists(path: string): Promise<boolean> {
    return this.bunny.fileExists(path);
  }

  // Get public CDN URL
  getPublicUrl(path: string): string {
    return this.bunny.getPublicUrl(path);
  }
}
```

---

## API Reference

### `BunnyStorageService`

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `uploadFile` | `path, input, options?` | `Promise<boolean>` | Upload stream/buffer to storage |
| `uploadBuffer` | `path, buffer, contentType?` | `Promise<boolean>` | Upload Buffer convenience method |
| `downloadFile` | `path` | `Promise<BunnyDownloadResult>` | Download file with stream |
| `listFiles` | `path?` | `Promise<BunnyFileInfo[]>` | List files in directory |
| `getFileMetadata` | `path` | `Promise<BunnyFileInfo>` | Get single file metadata |
| `deleteFile` | `path` | `Promise<boolean>` | Delete a file |
| `deleteDirectory` | `path` | `Promise<boolean>` | Delete directory recursively |
| `fileExists` | `path` | `Promise<boolean>` | Check if file exists |
| `getPublicUrl` | `path` | `string` | Build public CDN URL |

### Types

- `BunnyFileInfo` — File/directory metadata
- `BunnyUploadOptions` — Upload options (`contentType`, `sha256Checksum`)
- `BunnyDownloadResult` — Download result (`stream`, `length`, `contentType`)
- `BunnyUploadInput` — Accepted upload types (`ReadableStream`, `Buffer`, `NodeJS.ReadableStream`)
- `StorageRegionName` — Region string literal type

---

## Error Handling

- The service logs warnings at startup if credentials are missing (graceful degradation)
- All SDK errors are logged and re-thrown — callers decide how to handle them
- Empty paths and null inputs throw guard errors before SDK calls

---

## Testing

```bash
# Run tests
npm run test -- packages/bunny

# Run with coverage
npm run test:cov -- packages/bunny
```

Tests use Jest with mocked SDK — no real network calls.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@bunny.net/storage-sdk` | Official bunny.net storage SDK |
| `@nestjs/config` | Configuration injection via `registerAs` |
| `@nestjs/common` | NestJS decorators (`@Injectable`, `Logger`) |
