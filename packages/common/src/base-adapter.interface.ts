/** Field mapping from a source key to a target key. */
// test: CI changelog-reminder push-mode verification
export interface DataMapping {
  /** Source field name in raw data */
  source: string;
  /** Target field name in the output */
  target: string;
}

/**
 * Generic adapter interface for transforming raw/unstructured data
 * into typed domain models.
 *
 * Implement this interface when integrating external APIs, normalizing
 * database documents, or transforming webhook payloads.
 *
 * @template TOutput - The target domain model type
 *
 * @example
 * ```typescript
 * export class UserAdapter implements BaseAdapter<User> {
 *   readonly name = 'UserAdapter';
 *
 *   adapt(rawData: unknown): User | User[] {
 *     // transform raw data into User objects
 *   }
 *
 *   mapFields(rawData: Record<string, unknown>, mappings: DataMapping[]): Partial<User> {
 *     // map specific fields
 *   }
 * }
 * ```
 */
export interface BaseAdapter<TOutput> {
  /**
   * Transform raw data into domain model(s).
   * @param rawData - Unstructured input (single object or array)
   * @returns Single model or array of models
   */
  adapt(rawData: unknown): TOutput | TOutput[];

  /**
   * Map specific fields using source-to-target mappings.
   * @param rawData - Source data object
   * @param mappings - Array of field mappings
   * @returns Partial object with mapped fields
   */
  mapFields(
    rawData: Record<string, unknown>,
    mappings: DataMapping[],
  ): Partial<TOutput>;

  /** Human-readable adapter name for debugging and logging */
  readonly name: string;
}
