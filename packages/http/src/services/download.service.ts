import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';
import { SsrfGuard } from '@common/common';
import { createHttpError, HttpError } from '../http-error';
import {
  DownloadOptions,
  ImageOptimizationOptions,
} from '../interfaces/http-options.interface';

interface DownloadResult {
  filepath: string;
  size: number;
  filename: string;
}

/** PR5 / M8 â€” 50 MB hard cap on axios responses. */
const MAX_CONTENT_LENGTH = 50 * 1024 * 1024;

/**
 * PR5 / M7 â€” safe filename join. Strips directory components and verifies
 * the resolved path stays under `savePath`.
 */
function safeJoin(savePath: string, filename: string): string {
  const base = path.basename(filename); // strips directory components
  const resolved = path.resolve(savePath, base);
  const root = path.resolve(savePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new BadRequestException('Invalid filename');
  }
  return resolved;
}

export class DownloadService {
  constructor(
    private readonly client: AxiosInstance,
    private readonly baseFolder?: string,

    private readonly _ssrfGuard?: SsrfGuard,
  ) {}

  private get ssrfGuard(): SsrfGuard | undefined {
    return this._ssrfGuard;
  }

  async file(
    url: string,
    options: DownloadOptions = {},
  ): Promise<DownloadResult> {
    // PR5 / H5 â€” guard against SSRF before any network request.
    if (this.ssrfGuard) {
      await this.ssrfGuard.assertSafeUrl(url);
    }

    const { folder = '', filename, headers } = options;
    const savePath = this.resolvePath(folder);
    const name = filename ?? this.extractFilename(url);
    const filepath = safeJoin(savePath, name);

    this.ensureDir(path.dirname(filepath));

    try {
      const response = await this.client.get(url, {
        responseType: 'stream',
        headers,
        // PR5 / M8 â€” cap response size; axios throws on overflow.
        maxContentLength: MAX_CONTENT_LENGTH,
      });

      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(filepath);
      return { filepath, size: stats.size, filename: name };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const message = error.response?.statusText ?? error.message;
        throw createHttpError(status, message, url);
      }
      throw new HttpError(
        500,
        'Internal Server Error',
        error instanceof Error ? error.message : 'Download failed',
        url,
      );
    }
  }

  async image(
    url: string,
    options: DownloadOptions & { optimize?: ImageOptimizationOptions } = {},
  ): Promise<DownloadResult> {
    const { folder = '', filename, headers, optimize } = options;
    const savePath = this.resolvePath(folder);
    const name = filename ?? this.extractFilename(url);
    const tempPath = path.join(savePath, `temp_${name}`);

    this.ensureDir(savePath);

    try {
      const response = await this.client.get(url, {
        responseType: 'arraybuffer',
        headers,
      });

      let sharpInstance = sharp(Buffer.from(response.data));

      if (optimize) {
        const { quality = 80, width, height, format = 'webp' } = optimize;
        sharpInstance = sharpInstance[format]({ quality });
        if (width || height) {
          sharpInstance = sharpInstance.resize(width, height, {
            fit: 'inside',
          });
        }
        const ext = path.extname(name);
        const baseName = path.basename(name, ext);
        const finalName = `${baseName}.${format}`;
        const finalPath = path.join(savePath, finalName);

        await sharpInstance.toFile(finalPath);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }

        const stats = fs.statSync(finalPath);
        return { filepath: finalPath, size: stats.size, filename: finalName };
      }

      await sharpInstance.toFile(tempPath);
      const finalPath = path.join(savePath, name);
      fs.renameSync(tempPath, finalPath);

      const stats = fs.statSync(finalPath);
      return { filepath: finalPath, size: stats.size, filename: name };
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const message = error.response?.statusText ?? error.message;
        throw createHttpError(status, message, url);
      }
      throw new HttpError(
        500,
        'Internal Server Error',
        error instanceof Error ? error.message : 'Image download failed',
        url,
      );
    }
  }

  async video(
    url: string,
    options: DownloadOptions = {},
  ): Promise<DownloadResult> {
    return this.file(url, options);
  }

  private resolvePath(folder: string): string {
    if (this.baseFolder) {
      return path.join(this.baseFolder, folder);
    }
    return folder;
  }

  private ensureDir(dirpath: string): void {
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true });
    }
  }

  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      return parts[parts.length - 1] || 'download';
    } catch {
      return 'download';
    }
  }
}
