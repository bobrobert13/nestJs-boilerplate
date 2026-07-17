import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Schema } from 'mongoose';
import { GeneratedSchema, SchemaFieldDefinition } from '@common/ai';
import { validateCollectionName } from '../validators/collection-name.validator';
import { validateFields } from '../validators/schema-field.validator';

/**
 * PR5 / H7 / REQ-dynamic-schema-2 — keys that MUST NOT reach the Mongoose
 * definition. They are silently dropped to defeat prototype-pollution
 * payloads (e.g. `field.validate.__proto__.isAdmin = true`).
 */
const DENIED_VALIDATE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * PR5 / H7 / REQ-dynamic-schema-3 — comma-separated allow-list of refs
 * that may appear in `field.ref`. Default is empty (deny-all).
 */
const ALLOWED_REFS: string[] = (process.env.ALLOWED_REFS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** PR5 / H7 — strip denied keys from a `field.validate` map. */
function sanitizeValidate(
  raw: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (DENIED_VALIDATE_KEYS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

/** PR5 / H7 — throw unless `ref` is in ALLOWED_REFS. */
function assertRefAllowed(ref: string | undefined): void {
  if (!ref) return;
  if (!ALLOWED_REFS.includes(ref)) {
    throw new BadRequestException(`ref '${ref}' is not in ALLOWED_REFS`);
  }
}

export interface CompileOptions {
  dryRun?: boolean;
}

export interface CompileResult {
  success: boolean;
  collectionName: string;
  fieldsHash: string;
  idempotent?: boolean;
  errors?: string[];
  schema?: Schema;
  normalizedSchema?: GeneratedSchema;
}

@Injectable()
export class SchemaCompilerService {
  private readonly logger = new Logger(SchemaCompilerService.name);
  private readonly legacyMode: boolean;
  private readonly compiledSchemas: Map<string, Schema> = new Map();
  private readonly hashByCollection: Map<string, string> = new Map();

  /**
   * Injected dependencies.
   */
  constructor(@InjectConnection() private readonly _connection: Connection) {
    this.legacyMode = process.env.DYNAMIC_SCHEMA_LEGACY === 'true';
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (this.legacyMode) {
      this.logger.warn(
        'DYNAMIC_SCHEMA_LEGACY=true: schema will NOT be registered. Rollback only.',
      );
    }
  }
  /**
   * compileOnly method.
   */
  /** compileOnly (see class JSDoc for context). */
  compileOnly(schema: GeneratedSchema, collectionName: string): CompileResult {
    return this.compileAndRegister(schema, collectionName, { dryRun: true });
  }

  /**
   * compileAndRegister method.
   */
  /** compileAndRegister (see class JSDoc for context). */
  compileAndRegister(
    schema: GeneratedSchema,
    collectionName: string,
    options: CompileOptions = {},
  ): CompileResult {
    const errors: string[] = [];
    const nameResult = validateCollectionName(collectionName);
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (!nameResult.valid)
      errors.push(
        ...nameResult.errors.map((e) => 'SCHEMA_VALIDATION_ERROR: ' + e),
      );
    const fieldsResult = validateFields(schema?.fields);
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (!fieldsResult.valid)
      errors.push(
        ...fieldsResult.errors.map((e) => 'SCHEMA_VALIDATION_ERROR: ' + e),
      );
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (errors.length > 0)
      return { success: false, collectionName, fieldsHash: '', errors };

    const normalized: GeneratedSchema = {
      ...schema,
      collectionName,
      timestamps: schema.timestamps ?? true,
    };
    const fieldsHash = computeFieldsHash(normalized.fields);

    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (this.isCollectionRegistered(collectionName)) {
      const existingHash = this.hashByCollection.get(collectionName);
      /**
       * if method.
       */
      /** if (see class JSDoc for context). */
      if (existingHash === fieldsHash) {
        this.logger.log(
          'compileAndRegister: idempotent hit for ' + collectionName,
        );
        return { success: true, collectionName, fieldsHash, idempotent: true };
      }
      // L4 / hardening-medium-low — fieldsHash changed. Drop the
      // stale in-memory entry and the Mongoose model BEFORE
      // registering the new schema, so the next connection.model(...)
      // call returns the new schema instead of the cached old one.
      this.logger.warn(
        'compileAndRegister: ' +
          collectionName +
          ' already registered with different fields — re-registering',
      );
      this.logger.log(
        'compileAndRegister: fieldsHash ' +
          existingHash +
          ' -> ' +
          fieldsHash,
      );
      if (!options.dryRun) {
        this.unregister(collectionName);
      }
    }

    let mongooseSchema: Schema;
    try {
      // PR5 / H7 — validate every `ref` against the allow-list before
      // we touch the Mongoose definition.
      /** for (see class JSDoc for context). */
      for (const f of normalized.fields) {
        assertRefAllowed(f.ref);
      }
      mongooseSchema = this.buildMongooseSchema(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        collectionName,
        fieldsHash,
        errors: ['SCHEMA_COMPILATION_ERROR: ' + message],
      };
    }

    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (!options.dryRun && !this.legacyMode) {
      try {
        this._connection.model(collectionName, mongooseSchema);
        this.logger.log(
          'Registered Mongoose model for collection: ' + collectionName,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          success: false,
          collectionName,
          fieldsHash,
          errors: [
            'SCHEMA_COMPILATION_ERROR: connection.model failed: ' + message,
          ],
        };
      }
    }

    this.compiledSchemas.set(collectionName, mongooseSchema);
    this.hashByCollection.set(collectionName, fieldsHash);
    return {
      success: true,
      collectionName,
      fieldsHash,
      schema: mongooseSchema,
      normalizedSchema: normalized,
    };
  }
  private buildMongooseSchema(generated: GeneratedSchema): Schema {
    const definition: Record<string, unknown> = {};
    /**
     * for method.
     */
    /** for (see class JSDoc for context). */
    for (const field of generated.fields) {
      definition[field.name] = this.buildFieldDefinition(field);
    }
    const opts: Record<string, unknown> = {
      timestamps: generated.timestamps ?? true,
    };
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (generated.options?.strict !== undefined)
      opts.strict = generated.options.strict;
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (generated.options?.versionKey !== undefined)
      opts.versionKey = generated.options.versionKey;
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (generated.options?.minimize !== undefined)
      opts.minimize = generated.options.minimize;
    return new Schema(definition, opts);
  }

  private buildFieldDefinition(field: SchemaFieldDefinition): unknown {
    const def: Record<string, unknown> = {
      type: this.getMongooseType(field.type),
    };
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (field.required) def.required = true;
    /**
     * if method.
     */
    if (field.unique) def.unique = true;
    /**
     * if method.
     */
    if (field.index) def.index = true;
    /**
     * if method.
     */
    if (field.default !== undefined) def.default = field.default;
    /**
     * if method.
     */
    if (field.ref) def.ref = field.ref;
    /**
     * if method.
     */
    if (Array.isArray(field.enum)) def.enum = field.enum;
    /**
     * if method.
     */
    if (field.validate) Object.assign(def, sanitizeValidate(field.validate));
    /**
     * if method.
     */
    if (field.type === 'array' && field.items) {
      def.type = [this.buildFieldDefinition(field.items)];
    }
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (field.type === 'object' && field.properties) {
      const nested: Record<string, unknown> = {};
      /**
       * for method.
       */
      /** for (see class JSDoc for context). */
      for (const [propName, propDef] of Object.entries(field.properties)) {
        nested[propName] = this.buildFieldDefinition({
          ...propDef,
          name: propName,
        });
      }
      def.type = Schema.Types.Mixed;
      def.of = nested;
    }
    return def;
  }

  private getMongooseType(type: SchemaFieldDefinition['type']): unknown {
    const typeMap: Record<SchemaFieldDefinition['type'], unknown> = {
      string: String,
      number: Number,
      boolean: Boolean,
      date: Date,
      array: [Object],
      object: Object,
      mixed: Schema.Types.Mixed,
      objectId: Schema.Types.ObjectId,
    };
    return typeMap[type] || String;
  }

  /**
   * isCollectionRegistered method.
   */
  /** isCollectionRegistered (see class JSDoc for context). */
  isCollectionRegistered(collectionName: string): boolean {
    /**
     * if method.
     */
    if (this.legacyMode) return this.compiledSchemas.has(collectionName);
    return this._connection.modelNames().includes(collectionName);
  }

  /**
   * unregister method.
   */
  /** unregister (see class JSDoc for context). */
  unregister(collectionName: string): boolean {
    this.compiledSchemas.delete(collectionName);
    this.hashByCollection.delete(collectionName);
    /**
     * if method.
     */
    /** if (see class JSDoc for context). */
    if (!this.legacyMode) {
      try {
        this._connection.deleteModel(collectionName);
        this.logger.log('Unregistered Mongoose model: ' + collectionName);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        this.logger.warn(
          'deleteModel failed for ' + collectionName + ': ' + message,
        );
        return false;
      }
    }
    return true;
  }

  /**
   * getCompiledSchema method.
   */
  /** getCompiledSchema (see class JSDoc for context). */
  getCompiledSchema(collectionName: string): Schema | undefined {
    return this.compiledSchemas.get(collectionName);
  }

  static computeFieldsHashStatic(fields: SchemaFieldDefinition[]): string {
    return computeFieldsHash(fields);
  }

  /**
   * rehydrate method.
   */
  /** rehydrate (see class JSDoc for context). */
  rehydrate(metadata: { collectionName: string; schemaDefinition: string }): {
    ok: boolean;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(metadata.schemaDefinition) as GeneratedSchema;
      const result = this.compileAndRegister(parsed, metadata.collectionName, {
        dryRun: false,
      });
      return result.success
        ? { ok: true }
        : { ok: false, error: result.errors?.join('; ') };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }
}

function computeFieldsHash(fields: SchemaFieldDefinition[]): string {
  const sorted = [...fields].sort((a, b) => a.name.localeCompare(b.name));
  const json = JSON.stringify(sorted);
  let hash = 0x811c9dc5;
  /**
   * for method.
   */
  /** for (see class JSDoc for context). */
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  /**
   * return method.
   */
  /** return (see class JSDoc for context). */
  return (hash >>> 0).toString(16).padStart(8, '0');
}
