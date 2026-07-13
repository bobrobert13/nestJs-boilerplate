import { SchemaFieldDefinition, SchemaFieldType } from '@common/ai';

export interface FieldValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_TYPES: SchemaFieldType[] = [
  'string',
  'number',
  'boolean',
  'date',
  'array',
  'object',
  'mixed',
  'objectId',
];

/**
 * Validate a single SchemaFieldDefinition recursively. Returns all errors found.
 */
export function validateFieldDefinition(
  field: SchemaFieldDefinition,
  pathPrefix = '',
): FieldValidationResult {
  const errors: string[] = [];
  const fullPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;

  if (!field.name || typeof field.name !== 'string') {
    errors.push(`field name is required (at ${fullPath})`);
  } else if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,63}$/.test(field.name)) {
    errors.push(`field name "${field.name}" must be a valid JS identifier`);
  }

  if (!field.type || !VALID_TYPES.includes(field.type)) {
    errors.push(
      `field "${fullPath}" has invalid type "${field.type}". Must be one of: ${VALID_TYPES.join(', ')}`,
    );
  }

  if (field.enum && !Array.isArray(field.enum)) {
    errors.push(`field "${fullPath}" enum must be an array`);
  }

  if (field.ref && typeof field.ref !== 'string') {
    errors.push(`field "${fullPath}" ref must be a string`);
  }

  if (field.type === 'array') {
    if (!field.items) {
      errors.push(
        `SCHEMA_VALIDATION_ERROR: array field "${fullPath}" requires items`,
      );
    } else {
      const itemsResult = validateFieldDefinition(field.items, fullPath);
      errors.push(...itemsResult.errors);
    }
  }

  if (field.type === 'object') {
    if (!field.properties || typeof field.properties !== 'object') {
      errors.push(
        `SCHEMA_VALIDATION_ERROR: object field "${fullPath}" requires properties`,
      );
    } else {
      for (const [propName, propDef] of Object.entries(field.properties)) {
        if (!propDef.name) {
          propDef.name = propName;
        }
        const nested = validateFieldDefinition(propDef, fullPath);
        errors.push(...nested.errors);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all fields in a GeneratedSchema. Returns all errors collected.
 */
export function validateFields(
  fields: SchemaFieldDefinition[] | undefined,
): FieldValidationResult {
  const errors: string[] = [];
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    errors.push('fields must be a non-empty array');
    return { valid: false, errors };
  }
  const seen = new Set<string>();
  for (const field of fields) {
    const result = validateFieldDefinition(field);
    errors.push(...result.errors);
    if (field.name) {
      if (seen.has(field.name)) {
        errors.push(`duplicate field name "${field.name}"`);
      }
      seen.add(field.name);
    }
  }
  return { valid: errors.length === 0, errors };
}
