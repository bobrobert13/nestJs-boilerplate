import type { ReadableStream } from 'stream/web';

/**
 * Metadata for a file or directory stored in a bunny.net storage zone.
 *
 * Mirrors the SDK `StorageFile` type, exposing the fields relevant
 * for application-level consumption.
 */
export interface BunnyFileInfo {
  /** Unique identifier of the file. */
  guid: string;
  /** File or directory name. */
  objectName: string;
  /** Directory path within the storage zone. */
  path: string;
  /** Size in bytes (0 for directories). */
  length: number;
  /** MIME type of the file. */
  contentType: string;
  /** ISO-8601 creation date. */
  dateCreated: Date;
  /** ISO-8601 last modification date. */
  lastChanged: Date;
  /** Whether the entry represents a directory. */
  isDirectory: boolean;
  /** SHA-256 checksum of the file content, or null for directories. */
  checksum: string | null;
  /** Regions where this file is replicated, or null. */
  replicatedZones: string[] | null;
}

/**
 * Options for uploading a file to bunny.net storage.
 */
export interface BunnyUploadOptions {
  /** Override the MIME content-type of the uploaded file. */
  contentType?: string;
  /** Pre-computed SHA-256 checksum in uppercase HEX. Server validates if provided. */
  sha256Checksum?: string;
}

/**
 * Result of downloading a file from bunny.net storage.
 */
export interface BunnyDownloadResult {
  /** Web ReadableStream of the file content. */
  stream: ReadableStream<Uint8Array>;
  /** Total size in bytes, if known. */
  length?: number;
  /** Content-type of the downloaded file. */
  contentType?: string;
}

/**
 * Accepted input types for file uploads.
 *
 * - `ReadableStream<Uint8Array>`: Web Streams API (native SDK format).
 * - `Buffer`: In-memory binary data.
 * - `NodeJS.ReadableStream`: Node.js classic Readable stream.
 */
export type BunnyUploadInput =
  | ReadableStream<Uint8Array>
  | Buffer
  | NodeJS.ReadableStream;
