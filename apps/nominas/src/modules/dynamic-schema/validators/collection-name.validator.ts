/**
 * Validates a MongoDB collection name used by dynamic-schema.
 * Rules:
 * - Must match /^[a-z][a-z0-9_]{0,63}$/
 * - Must not be a reserved word (system, admin, local, config, __schema__)
 * - Maximum length 64 chars
 */
export const RESERVED_COLLECTION_NAMES = new Set<string>([
  "system",
  "admin",
  "local",
  "config",
  "__schema__",
  "__dynamic_schemas__",
]);

export interface CollectionNameValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCollectionName(name: string): CollectionNameValidationResult {
  const errors: string[] = [];

  if (!name || typeof name !== "string") {
    errors.push("collectionName is required and must be a string");
    return { valid: false, errors };
  }

  if (name.length > 64) {
    errors.push(`collectionName length ${name.length} exceeds max 64`);
  }

  if (!/^[a-z][a-z0-9_]{0,63}$/.test(name)) {
    errors.push(`collectionName "${name}" must match ^[a-z][a-z0-9_]{0,63}$`);
  }

  if (RESERVED_COLLECTION_NAMES.has(name)) {
    errors.push(`collectionName "${name}" is reserved`);
  }

  return { valid: errors.length === 0, errors };
}
