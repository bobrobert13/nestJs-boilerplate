import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as BunnyStorageSDK from '@bunny.net/storage-sdk';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'stream/web';
import type { BunnyConfig, StorageRegionName } from '../config/bunny.config';
import { BUNNY_REGION_MAP, DEFAULT_REGION } from '../constants/bunny.constants';
import type {
  BunnyDownloadResult,
  BunnyFileInfo,
  BunnyUploadInput,
  BunnyUploadOptions,
} from '../interfaces/bunny.interfaces';

type StorageZone = BunnyStorageSDK.zone.StorageZone;
type StorageFile = BunnyStorageSDK.file.StorageFile;

/**
 * NestJS service wrapping the official `@bunny.net/storage-sdk` for
 * bunny.net Edge Storage file management.
 *
 * Provides typed methods for uploading, downloading, listing, deleting,
 * and inspecting files and directories in a bunny.net storage zone.
 *
 * @example
 * ```typescript
 * // In your module
 * imports: [BunnyModule]
 *
 * // In your service
 * constructor(private readonly bunny: BunnyStorageService) {}
 *
 * // Upload a Buffer
 * await this.bunny.uploadBuffer('/images/cover.jpg', buffer, 'image/jpeg');
 *
 * // List files
 * const files = await this.bunny.listFiles('/images');
 *
 * // Download
 * const { stream, length } = await this.bunny.downloadFile('/images/cover.jpg');
 * ```
 */
@Injectable()
export class BunnyStorageService {
  private readonly logger = new Logger(BunnyStorageService.name);
  private readonly zone: StorageZone | null = null;
  private readonly cdnUrl?: string;
  private readonly storageZoneName: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<BunnyConfig>('bunny');

    this.storageZoneName = config?.storageZoneName || '';
    this.cdnUrl = config?.cdnUrl;

    if (!config?.storageZoneName) {
      this.logger.warn(
        'BUNNY_STORAGE_ZONE_NAME not configured. Storage operations will be disabled.',
      );
      return;
    }

    if (!config?.accessKey) {
      this.logger.warn(
        'BUNNY_STORAGE_ACCESS_KEY not configured. Storage operations will be disabled.',
      );
      return;
    }

    const regionName: StorageRegionName = config.region || DEFAULT_REGION;
    const sdkRegion = BUNNY_REGION_MAP[regionName];

    if (!sdkRegion) {
      this.logger.warn(
        `Unknown bunny region "${regionName}". Falling back to ${DEFAULT_REGION}.`,
      );
    }

    this.zone = BunnyStorageSDK.zone.connect_with_accesskey(
      sdkRegion ?? BUNNY_REGION_MAP[DEFAULT_REGION],
      config.storageZoneName,
      config.accessKey,
    );

    this.logger.log(
      `Bunny storage zone "${config.storageZoneName}" connected (region: ${regionName}).`,
    );
  }

  /**
   * Upload a file to the storage zone.
   *
   * Accepts Web `ReadableStream`, Node.js `Buffer`, or Node.js `Readable` streams.
   *
   * @param path - Destination path in the storage zone (e.g. `/images/cover.jpg`).
   * @param input - File content as a stream or buffer.
   * @param options - Optional content-type and SHA-256 checksum.
   * @returns `true` on success.
   * @throws If the path is empty, input is null, or the SDK call fails.
   */
  async uploadFile(
    path: string,
    input: BunnyUploadInput,
    options?: BunnyUploadOptions,
  ): Promise<boolean> {
    this.assertPath(path);
    this.assertZone();

    if (input == null) {
      throw new Error('Upload input must not be null or undefined.');
    }

    const webStream = this.toWebStream(input);

    try {
      this.logger.debug(`Uploading file to "${path}".`);
      return await BunnyStorageSDK.file.upload(
        this.zone!,
        path,
        webStream,
        options,
      );
    } catch (error) {
      this.logger.error(
        `Failed to upload file "${path}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Convenience method to upload a `Buffer` as a file.
   *
   * @param path - Destination path in the storage zone.
   * @param buffer - Binary content to upload.
   * @param contentType - Optional MIME type. Defaults to `application/octet-stream`.
   * @returns `true` on success.
   * @throws If the path is empty or the SDK call fails.
   */
  async uploadBuffer(
    path: string,
    buffer: Buffer,
    contentType?: string,
  ): Promise<boolean> {
    return this.uploadFile(path, buffer, {
      contentType: contentType || 'application/octet-stream',
    });
  }

  /**
   * Download a file from the storage zone.
   *
   * @param path - Path to the file in the storage zone.
   * @returns The file stream, length, and content-type.
   * @throws If the path is empty or the file does not exist.
   */
  async downloadFile(path: string): Promise<BunnyDownloadResult> {
    this.assertPath(path);
    this.assertZone();

    try {
      this.logger.debug(`Downloading file from "${path}".`);
      const result = await BunnyStorageSDK.file.download(this.zone!, path);

      return {
        stream: result.stream,
        length: result.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to download file "${path}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * List files and directories at the given path.
   *
   * @param path - Directory path to list. Defaults to root `/`.
   * @returns Array of file/directory metadata entries.
   * @throws If the SDK call fails.
   */
  async listFiles(path = '/'): Promise<BunnyFileInfo[]> {
    this.assertZone();

    try {
      this.logger.debug(`Listing files at "${path}".`);
      const entries: StorageFile[] = await BunnyStorageSDK.file.list(
        this.zone!,
        path,
      );

      return entries.map((entry) => this.mapFileMetadata(entry));
    } catch (error) {
      this.logger.error(
        `Failed to list files at "${path}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get metadata for a single file or directory.
   *
   * @param path - Path to the file or directory.
   * @returns File metadata.
   * @throws If the path is empty or the file does not exist.
   */
  async getFileMetadata(path: string): Promise<BunnyFileInfo> {
    this.assertPath(path);
    this.assertZone();

    try {
      this.logger.debug(`Getting metadata for "${path}".`);
      const entry: StorageFile = await BunnyStorageSDK.file.get(
        this.zone!,
        path,
      );

      return this.mapFileMetadata(entry);
    } catch (error) {
      this.logger.error(
        `Failed to get metadata for "${path}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Delete a single file from the storage zone.
   *
   * @param path - Path to the file to delete.
   * @returns `true` on success.
   * @throws If the path is empty or the SDK call fails.
   */
  async deleteFile(path: string): Promise<boolean> {
    this.assertPath(path);
    this.assertZone();

    try {
      this.logger.debug(`Deleting file "${path}".`);
      return await BunnyStorageSDK.file.remove(this.zone!, path);
    } catch (error) {
      this.logger.error(
        `Failed to delete file "${path}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Recursively delete a directory and all its contents.
   *
   * @param path - Path to the directory to delete.
   * @returns `true` on success.
   * @throws If the path is empty or the SDK call fails.
   */
  async deleteDirectory(path: string): Promise<boolean> {
    this.assertPath(path);
    this.assertZone();

    try {
      this.logger.debug(`Deleting directory "${path}".`);
      return await BunnyStorageSDK.file.removeDirectory(this.zone!, path);
    } catch (error) {
      this.logger.error(
        `Failed to delete directory "${path}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Check whether a file or directory exists in the storage zone.
   *
   * @param path - Path to check.
   * @returns `true` if the file exists, `false` otherwise.
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.getFileMetadata(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build a public CDN URL for a file.
   *
   * Uses the configured `BUNNY_CDN_URL` if available, otherwise falls back
   * to a generic storage URL pattern.
   *
   * @param path - Path to the file within the storage zone.
   * @returns The public URL string.
   */
  getPublicUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (this.cdnUrl) {
      const base = this.cdnUrl.replace(/\/+$/, '');
      return `${base}${normalizedPath}`;
    }

    return `https://storage.bunnycdn.com/${this.storageZoneName}${normalizedPath}`;
  }

  /**
   * Convert any supported input type to a Web `ReadableStream<Uint8Array>`.
   */
  private toWebStream(input: BunnyUploadInput): ReadableStream<Uint8Array> {
    if (Buffer.isBuffer(input)) {
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(input));
          controller.close();
        },
      });
    }

    if (input instanceof ReadableStream) {
      return input;
    }

    // Node.js Readable stream
    return Readable.toWeb(input as Readable) as ReadableStream<Uint8Array>;
  }

  /**
   * Map an SDK `StorageFile` to our typed `BunnyFileInfo`.
   */
  private mapFileMetadata(raw: StorageFile): BunnyFileInfo {
    return {
      guid: raw.guid,
      objectName: raw.objectName,
      path: raw.path,
      length: raw.length,
      contentType: raw.contentType,
      dateCreated: raw.dateCreated,
      lastChanged: raw.lastChanged,
      isDirectory: raw.isDirectory,
      checksum: raw.checksum,
      replicatedZones: raw.replicatedZones ? [...raw.replicatedZones] : null,
    };
  }

  /**
   * Guard: ensure the path is a non-empty string.
   */
  private assertPath(path: string): void {
    if (!path || typeof path !== 'string' || path.trim().length === 0) {
      throw new Error('Storage path must be a non-empty string.');
    }
  }

  /**
   * Guard: ensure the storage zone is connected.
   */
  private assertZone(): void {
    if (!this.zone) {
      throw new Error(
        'Bunny storage zone is not connected. Check BUNNY_STORAGE_ZONE_NAME and BUNNY_STORAGE_ACCESS_KEY configuration.',
      );
    }
  }
}
