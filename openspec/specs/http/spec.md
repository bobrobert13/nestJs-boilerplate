# HTTP Specification

## Purpose

Cliente HTTP basado en axios con soporte para descarga y optimización de imágenes vía sharp.

Documentación asociada: `packages/http/README.md`

## Requirements

### HTTP Requests

The system MUST provide an HTTP client for making external API requests.

#### Scenario: GET request

- GIVEN a valid URL
- WHEN `HttpService.get(url)` is called
- THEN the system returns the response data

### Image Download

The system MUST download and optimize images using sharp.

#### Scenario: Download and optimize image

- GIVEN a valid image URL
- WHEN `DownloadService.download(url, options)` is called
- THEN the system downloads the image
- AND applies sharp optimizations (resize, format conversion)
- AND returns the processed image buffer

## Affected Documentation

- `packages/http/README.md`
- `AGENTS.md` — section 3 (Packages Index)
