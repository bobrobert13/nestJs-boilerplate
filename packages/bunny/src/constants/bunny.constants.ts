import { regions } from '@bunny.net/storage-sdk';
import type { StorageRegionName } from '../config/bunny.config';

type StorageRegion = regions.StorageRegion;

/**
 * Maps lowercase region identifiers to the SDK `StorageRegion` enum.
 */
export const BUNNY_REGION_MAP: Record<StorageRegionName, StorageRegion> = {
  falkenstein: regions.StorageRegion.Falkenstein,
  london: regions.StorageRegion.London,
  newyork: regions.StorageRegion.NewYork,
  losangeles: regions.StorageRegion.LosAngeles,
  singapore: regions.StorageRegion.Singapore,
  stockholm: regions.StorageRegion.Stockholm,
  saopaulo: regions.StorageRegion.SaoPaulo,
  johannesburg: regions.StorageRegion.Johannesburg,
  sydney: regions.StorageRegion.Sydney,
};

/**
 * Default storage region used when none is configured.
 */
export const DEFAULT_REGION: StorageRegionName = 'falkenstein';

/**
 * Base URLs for each bunny.net storage region (documentation / fallback reference).
 */
export const BUNNY_STORAGE_BASE_URLS: Record<StorageRegionName, string> = {
  falkenstein: 'https://storage.bunnycdn.com',
  london: 'https://uk.storage.bunnycdn.com',
  newyork: 'https://ny.storage.bunnycdn.com',
  losangeles: 'https://la.storage.bunnycdn.com',
  singapore: 'https://sg.storage.bunnycdn.com',
  stockholm: 'https://se.storage.bunnycdn.com',
  saopaulo: 'https://br.storage.bunnycdn.com',
  johannesburg: 'https://jh.storage.bunnycdn.com',
  sydney: 'https://syd.storage.bunnycdn.com',
};
