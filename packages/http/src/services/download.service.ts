import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { createHttpError, HttpError } from '../http-error';
import { DownloadOptions, ImageOptimizationOptions } from '../interfaces/http-options.interface';

interface DownloadResult {
  filepath: string;
  size: number;
  filename: string;
}

export class DownloadService {
  constructor(
    private readonly client: AxiosInstance,
    private readonly baseFolder?: string,
  ) {}

  async file(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
    const { folder = '', filename, headers } = options;
    const savePath = this.resolvePath(folder);
    const name = filename ?? this.extractFilename(url);

    this.ensureDir(savePath);
    const filepath = path.join(savePath, name);

    try {
      const response = await this.client.get(url, {
        responseType: 'stream',
        headers,
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
      throw new HttpError(500, 'Internal Server Error', error instanceof Error ? error.message : 'Download failed', url);
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
          sharpInstance = sharpInstance.resize(width, height, { fit: 'inside' });
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
      throw new HttpError(500, 'Internal Server Error', error instanceof Error ? error.message : 'Image download failed', url);
    }
  }

  async video(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
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