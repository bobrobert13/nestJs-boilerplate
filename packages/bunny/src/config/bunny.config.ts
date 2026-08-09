import { registerAs } from '@nestjs/config';

/**
 * Supported bunny.net storage region identifiers.
 *
 * Maps to the SDK `StorageRegion` enum values.
 */
export type StorageRegionName =
  | 'falkenstein'
  | 'london'
  | 'newyork'
  | 'losangeles'
  | 'singapore'
  | 'stockholm'
  | 'saopaulo'
  | 'johannesburg'
  | 'sydney';

/**
 * Configuration shape for the bunny.net Edge Storage module.
 */
export interface BunnyConfig {
  /** Storage zone name (required). */
  storageZoneName: string;
  /** Storage zone access key / password (required). */
  accessKey: string;
  /** Primary storage region. Defaults to `'falkenstein'`. */
  region: StorageRegionName;
  /** Optional pull zone CDN URL for public file access (e.g. `https://myzone.b-cdn.net`). */
  cdnUrl?: string;
}

export default registerAs(
  'bunny',
  (): BunnyConfig => ({
    storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || '',
    accessKey: process.env.BUNNY_STORAGE_ACCESS_KEY || '',
    region:
      (process.env.BUNNY_STORAGE_REGION as StorageRegionName) || 'falkenstein',
    cdnUrl: process.env.BUNNY_CDN_URL || undefined,
  }),
);
