import { Injectable } from '@nestjs/common';
import { GeneratedSchema, SchemaFieldDefinition, SchemaFieldType } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import { SourceAdapter, AdapterContext, AdapterValidation } from './source-adapter.interface';

/**
 * Draft-07 JSON Schema subset -> GeneratedSchema.
 * Supported:
 * - type: string/number/integer/boolean/array/object/null
 * - required: string[] -> required: true per field
 * - enum: any[] -> preserved on SchemaFieldDefinition.enum
 * - items: JSONSchema for arrays
 * - properties: map of nested JSONSchema for objects
 */
export interface JsonSchemaInput {
  /** JSON Schema draft-07 document. */
  jsonSchema: Record<string, unknown>;
  /** Optional: collectionName override. Defaults to jsonSchema.title or "entity". */
  collectionName?: string;
}

@Injectable()
export class JsonSchemaSourceAdapter implements SourceAdapter<JsonSchemaInput> {
  readonly source = SchemaSource.JsonSchema;

  validate(input: JsonSchemaInput): AdapterValidation {
    const errors: string[] = [];
    if (!input || typeof input !== "object") {
      errors.push("JsonSchemaInput.jsonSchema is required");
    } else if (!input.jsonSchema || typeof input.jsonSchema !== "object") {
      errors.push("JsonSchemaInput.jsonSchema must be an object");
    }
    return { valid: errors.length === 0, errors };
  }

  async convert(input: JsonSchemaInput, _context: AdapterContext): Promise<GeneratedSchema> {
    const v = this.validate(input);
    if (!v.valid) {
      const err = new Error("SCHEMA_VALIDATION_ERROR: " + v.errors.join("; "));
      throw err;
    }
    const schema = input.jsonSchema;
    const properties = (schema.properties as Record<string, Record<string, unknown>> | undefined) ?? {};
    const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];

    const fields: SchemaFieldDefinition[] = [];
    for (const [name, propSchema] of Object.entries(properties)) {
      fields.push(this.toField(name, propSchema, required.includes(name)));
    }

    const collectionName =
      input.collectionName || (typeof schema.title === "string" ? this.singularize(schema.title).toLowerCase() : "entity");

    return {
      fields,
      collectionName,
      source: SchemaSource.JsonSchema,
      metadata: { originalTitle: schema.title },
    };
  }

  private toField(name: string, schema: Record<string, unknown>, required: boolean): SchemaFieldDefinition {
    const jsonType = Array.isArray(schema.type) ? (schema.type[0] as string) : (schema.type as string);
    const map: Record<string, SchemaFieldType> = {
      string: "string",
      number: "number",
      integer: "number",
      boolean: "boolean",
      array: "array",
      object: "object",
      null: "string",
    };
    const fieldType = map[jsonType] ?? "string";
    const field: SchemaFieldDefinition = { name, type: fieldType };
    if (required) field.required = true;

    if (Array.isArray(schema.enum)) {
      field.enum = schema.enum;
    }
    if (typeof schema.default !== "undefined") {
      field.default = schema.default;
    }

    if (fieldType === "array" && schema.items && typeof schema.items === "object") {
      field.items = this.toField("item", schema.items as Record<string, unknown>, false);
    }
    if (fieldType === "object" && schema.properties && typeof schema.properties === "object") {
      const nestedProps = schema.properties as Record<string, Record<string, unknown>>;
      const nestedRequired = Array.isArray(schema.required) ? (schema.required as string[]) : [];
      const nested: Record<string, SchemaFieldDefinition> = {};
      for (const [n, p] of Object.entries(nestedProps)) {
        nested[n] = this.toField(n, p, nestedRequired.includes(n));
      }
      field.properties = nested;
    }
    return field;
  }

  private singularize(s: string): string {
    if (!s) return "entity";
    if (s.endsWith("ies")) return s.slice(0, -3) + "y";
    if (s.endsWith("s") && !s.endsWith("ss")) return s.slice(0, -1);
    return s;
  }
}