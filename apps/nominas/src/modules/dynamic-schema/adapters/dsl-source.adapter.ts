import { Injectable } from '@nestjs/common';
import {
  GeneratedSchema,
  SchemaFieldDefinition,
  SchemaFieldType,
} from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import {
  SourceAdapter,
  AdapterContext,
  AdapterValidation,
} from './source-adapter.interface';

export interface DslInput {
  dsl: string;
}

@Injectable()
export class DslSourceAdapter implements SourceAdapter<DslInput> {
  readonly source = SchemaSource.Dsl;

  /**
   * validate method.
   */
  validate(input: DslInput): AdapterValidation {
    const errors: string[] = [];
    /**
     * if method.
     */
    if (typeof input?.dsl !== 'string' || input.dsl.trim() === '') {
      errors.push('dsl must be a non-empty string');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * convert method.
   */
  async convert(
    input: DslInput,
    _context: AdapterContext,
  ): Promise<GeneratedSchema> {
    const v = this.validate(input);
    /**
     * if method.
     */
    if (!v.valid)
      throw new Error('SCHEMA_VALIDATION_ERROR: ' + v.errors.join('; '));
    const result = parseDsl(input.dsl);
    /**
     * if method.
     */
    if (!result.ok) throw new Error('DSL_PARSE_ERROR: ' + result.error);
    return {
      fields: result.fields,
      collectionName: result.collectionName,
      source: SchemaSource.Dsl,
      metadata: { dslSnippet: input.dsl.slice(0, 200) },
    };
  }
}

const ALPHA_RE_LOCAL = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parseDsl(
  raw: string,
):
  | { ok: true; collectionName: string; fields: SchemaFieldDefinition[] }
  | { ok: false; error: string } {
  const src = raw.replace(/\r\n/g, '\n').trim();
  const headerMatch = src.match(
    /^Entity\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*)\}$/,
  );
  /**
   * if method.
   */
  if (!headerMatch)
    return {
      ok: false,
      error: 'expected pattern: Entity <Name> { <fields...> }',
    };
  const entityName = headerMatch[1];
  const body = headerMatch[2].trim();
  /**
   * if method.
   */
  if (!body) return { ok: false, error: 'entity body is empty' };
  const rawFields = body
    .split(/;+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const fields: SchemaFieldDefinition[] = [];
  /**
   * for method.
   */
  for (const rawField of rawFields) {
    const tokens = rawField.split(/\s+/).filter(Boolean);
    /**
     * if method.
     */
    if (tokens.length < 2)
      return {
        ok: false,
        error: 'field requires: <name>:<type> [required] -- got: ' + rawField,
      };
    const nameType = tokens[0].split(':');
    /**
     * if method.
     */
    if (nameType.length !== 2)
      return {
        ok: false,
        error: 'field requires name:type pattern -- got: ' + tokens[0],
      };
    const name = nameType[0];
    const rawType = nameType[1];
    /**
     * if method.
     */
    if (!ALPHA_RE_LOCAL.test(name))
      return { ok: false, error: 'invalid field name: ' + name };
    const isArray = rawType.endsWith('[]');
    const baseType = isArray ? rawType.slice(0, -2) : rawType;
    const validTypes = [
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
     * if method.
     */
    if (!validTypes.includes(baseType))
      return { ok: false, error: 'unknown type: ' + baseType };
    const field: SchemaFieldDefinition = {
      name,
      type: baseType as SchemaFieldType,
    };
    /**
     * if method.
     */
    if (isArray) {
      field.type = 'array';
      field.items = { name: 'item', type: baseType as SchemaFieldType };
    }
    /**
     * for method.
     */
    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      /**
       * if method.
       */
      if (t === 'required') field.required = true;
      else if (t === 'unique') field.unique = true;
      else if (t === 'index') field.index = true;
      else if (t.startsWith('default=')) {
        const v = t.slice('default='.length);
        /**
         * if method.
         */
        if (v === 'true') field.default = true;
        else if (v === 'false') field.default = false;
        else if (/^-?\d+(\.\d+)?$/.test(v)) field.default = Number(v);
        else field.default = v.replace(/^"|"$/g, '');
      }
    }
    fields.push(field);
  }
  /**
   * if method.
   */
  if (fields.length === 0) return { ok: false, error: 'no fields parsed' };
  return { ok: true, collectionName: entityName.toLowerCase(), fields };
}
