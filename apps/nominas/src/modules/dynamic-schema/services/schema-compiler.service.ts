import { Injectable, Logger } from '@nestjs/common';
import { Schema } from 'mongoose';
import { GeneratedSchema, SchemaFieldDefinition } from '@common/ai';

@Injectable()
export class SchemaCompilerService {
  private readonly logger = new Logger(SchemaCompilerService.name);
  private readonly compiledSchemas: Map<string, Schema> = new Map();

  constructor() {}

  compileSchema(schema: GeneratedSchema, collectionName: string): Schema {
    if (!schema.fields || !Array.isArray(schema.fields)) {
      throw new Error(
        JSON.stringify({
          code: 'SCHEMA_COMPILATION_ERROR',
          message: 'Invalid schema: fields must be an array',
        }),
      );
    }

    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error(
        JSON.stringify({
          code: 'SCHEMA_COMPILATION_ERROR',
          message: 'Invalid collection name',
        }),
      );
    }

    try {
      // Create a plain object to pass to Schema constructor
      const schemaDefinition: Record<string, any> = {};

      for (const field of schema.fields) {
        this.validateFieldDefinition(field);
        schemaDefinition[field.name] = this.fieldToSchemaProp(field);
      }

      const mongooseSchema = new Schema(schemaDefinition, {
        timestamps: true,
      });

      // Store the compiled schema
      this.compiledSchemas.set(collectionName, mongooseSchema);

      this.logger.log(`Schema compiled for collection: ${collectionName}`);

      return mongooseSchema;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        JSON.stringify({
          code: 'SCHEMA_COMPILATION_ERROR',
          message: `Failed to compile schema: ${message}`,
        }),
      );
    }
  }

  private validateFieldDefinition(field: SchemaFieldDefinition): void {
    if (!field.name || typeof field.name !== 'string') {
      throw new Error(
        JSON.stringify({
          code: 'SCHEMA_COMPILATION_ERROR',
          message: `Invalid field name: ${field.name}`,
        }),
      );
    }

    const validTypes = ['string', 'number', 'boolean', 'date', 'array', 'object'];
    if (!field.type || !validTypes.includes(field.type)) {
      throw new Error(
        JSON.stringify({
          code: 'SCHEMA_COMPILATION_ERROR',
          message: `Invalid field type '${field.type}' for field '${field.name}'. Must be one of: ${validTypes.join(', ')}`,
        }),
      );
    }
  }

  private fieldToSchemaProp(field: SchemaFieldDefinition): any {
    const propDefinition: any = {
      type: this.getMongooseType(field.type),
    };

    if (field.required) {
      propDefinition.required = true;
    }

    if (field.default !== undefined) {
      propDefinition.default = field.default;
    }

    if (field.validate && typeof field.validate === 'object') {
      Object.assign(propDefinition, field.validate);
    }

    return propDefinition;
  }

  private getMongooseType(type: SchemaFieldDefinition['type']): any {
    const SchemaTypes = Schema.Types;
    const typeMap: Record<SchemaFieldDefinition['type'], any> = {
      string: String,
      number: Number,
      boolean: Boolean,
      date: Date,
      // For arrays we just keep [Object] here; per-field items.type is resolved
      // in the recursive buildFieldDefinition helper added in the dynamic-schema
      // refactor (FASE 3).
      array: [Object],
      object: Object,
      mixed: SchemaTypes.Mixed,
      objectId: SchemaTypes.ObjectId,
    };

    return typeMap[type] || String;
  }

  getCompiledSchema(collectionName: string): Schema | undefined {
    return this.compiledSchemas.get(collectionName);
  }

  isCollectionRegistered(collectionName: string): boolean {
    return this.compiledSchemas.has(collectionName);
  }
}
