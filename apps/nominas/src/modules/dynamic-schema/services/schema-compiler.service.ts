import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Schema } from 'mongoose';
import { GeneratedSchema, SchemaFieldDefinition } from '@common/ai';
import { validateCollectionName } from '../validators/collection-name.validator';
import { validateFields } from '../validators/schema-field.validator';

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
    if (this.legacyMode) {
      this.logger.warn(
        'DYNAMIC_SCHEMA_LEGACY=true: schema will NOT be registered. Rollback only.',
      );
    }
  }
  /**
   * compileOnly method.
   */
  compileOnly(schema: GeneratedSchema, collectionName: string): CompileResult {
    return this.compileAndRegister(schema, collectionName, { dryRun: true });
  }

  /**
   * compileAndRegister method.
   */
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
    if (!nameResult.valid)
      errors.push(
        ...nameResult.errors.map((e) => 'SCHEMA_VALIDATION_ERROR: ' + e),
      );
    const fieldsResult = validateFields(schema?.fields);
    /**
     * if method.
     */
    if (!fieldsResult.valid)
      errors.push(
        ...fieldsResult.errors.map((e) => 'SCHEMA_VALIDATION_ERROR: ' + e),
      );
    /**
     * if method.
     */
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
    if (this.isCollectionRegistered(collectionName)) {
      const existingHash = this.hashByCollection.get(collectionName);
      /**
       * if method.
       */
      if (existingHash === fieldsHash) {
        this.logger.log(
          'compileAndRegister: idempotent hit for ' + collectionName,
        );
        return { success: true, collectionName, fieldsHash, idempotent: true };
      }
      this.logger.warn(
        'compileAndRegister: ' +
          collectionName +
          ' already registered with different fields',
      );
    }

    let mongooseSchema: Schema;
    try {
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
    for (const field of generated.fields) {
      definition[field.name] = this.buildFieldDefinition(field);
    }
    const opts: Record<string, unknown> = {
      timestamps: generated.timestamps ?? true,
    };
    /**
     * if method.
     */
    if (generated.options?.strict !== undefined)
      opts.strict = generated.options.strict;
    /**
     * if method.
     */
    if (generated.options?.versionKey !== undefined)
      opts.versionKey = generated.options.versionKey;
    /**
     * if method.
     */
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
    if (field.validate) Object.assign(def, field.validate);
    /**
     * if method.
     */
    if (field.type === 'array' && field.items) {
      def.type = [this.buildFieldDefinition(field.items)];
    }
    /**
     * if method.
     */
    if (field.type === 'object' && field.properties) {
      const nested: Record<string, unknown> = {};
      /**
       * for method.
       */
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
  unregister(collectionName: string): boolean {
    this.compiledSchemas.delete(collectionName);
    this.hashByCollection.delete(collectionName);
    /**
     * if method.
     */
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
  getCompiledSchema(collectionName: string): Schema | undefined {
    return this.compiledSchemas.get(collectionName);
  }

  static computeFieldsHashStatic(fields: SchemaFieldDefinition[]): string {
    return computeFieldsHash(fields);
  }

  /**
   * rehydrate method.
   */
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
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  /**
   * return method.
   */
  return (hash >>> 0).toString(16).padStart(8, '0');
}
