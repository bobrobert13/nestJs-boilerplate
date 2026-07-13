import { Injectable } from '@nestjs/common';
import { GeneratedSchema, SchemaFieldDefinition, SchemaFieldType } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import { SourceAdapter, AdapterContext, AdapterValidation } from './source-adapter.interface';

/**
 * DSL: Entity <Name> { <field>:<type>[ required][ default=<value>][,...]; ... }
 * Supported types: string, number, boolean, date, array, object, mixed, objectId.
 * Examples:
 *   Entity Employee { name:string required; age:number; tags: string[]; isActive:boolean; }
 *   Entity Invoice { total:number required default=0; customerId:objectId; }
 */
export interface DslInput {
  dsl: string;
}

@Injectable()
export class DslSourceAdapter implements SourceAdapter<DslInput> {
  readonly source = SchemaSource.Dsl;

  validate(input: DslInput): AdapterValidation {
    const errors: string[] = [];
    if (typeof input?.dsl !== "string" || input.dsl.trim() === "") {
      errors.push("dsl must be a non-empty string");
    }
    return { valid: errors.length === 0, errors };
  }

  async convert(input: DslInput, _context: AdapterContext): Promise<GeneratedSchema> {
    const v = this.validate(input);
    if (!v.valid) throw new Error("SCHEMA_VALIDATION_ERROR: " + v.errors.join("; "));
    const result = parseDsl(input.dsl);
    if (!result.ok) throw new Error("DSL_PARSE_ERROR: " + result.error);
    return {
      fields: result.fields,
      collectionName: result.collectionName,
      source: SchemaSource.Dsl,
      metadata: { dslSnippet: input.dsl.slice(0, 200) },
    };
  }
}

function parseDsl(input: string): { ok: true; collectionName: string; fields: SchemaFieldDefinition[] } | { ok: false; error: string } {
  const src = input.replace(/\\
/g, "\
").trim();
  // Match "Entity <Name> { ... }"
  const headerMatch = src.match(/^Entity[\s]+([A-Za-z_][A-Za-z0-9_]*)[\s]*\\{([\\s\\S]*)\\}$/);
  if (!headerMatch) return { ok: false, error: "expected pattern: Entity <Name> { <fields...> }" };
  const entityName = headerMatch[1];
  const body = headerMatch[2].trim();
  if (!body) return { ok: false, error: "entity body is empty" };

  // Split on ";" (each field is terminated by ;)
  const rawFields = body.split(/;+/).map((s) => s.trim()).filter(Boolean);
  const fields: SchemaFieldDefinition[] = [];
  for (const raw of rawFields) {
    const tokens = raw.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) return { ok: false, error: "field requires: <name>:<type> [required] [default=<v>] -- got: " + raw };

    const nameType = tokens[0].split(":");
    if (nameType.length !== 2) return { ok: false, error: "field requires name:type pattern -- got: " + tokens[0] };
    const [name, rawType] = nameType;
    const isArray = rawType.endsWith("[]");
    const baseType = isArray ? rawType.slice(0, -2) : rawType;
    const validTypes: SchemaFieldType[] = ["string", "number", "boolean", "date", "array", "object", "mixed", "objectId"];
    if (!validTypes.includes(baseType as SchemaFieldType)) {
      return { ok: false, error: "unknown type: " + baseType };
    }

    const field: SchemaFieldDefinition = { name, type: baseType as SchemaFieldType };
    if (isArray) {
      field.type = "array";
      field.items = { name: "item", type: baseType as SchemaFieldType };
    }

    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === "required") field.required = true;
      else if (t.startsWith("default=")) {
        const v = t.slice("default=".length);
        if (v === "true") field.default = true;
        else if (v === "false") field.default = false;
        else if (/^-?\d+(\.\d+)?$/.test(v)) field.default = Number(v);
        else field.default = v.replace(/^"|"$/g, "");
      } else if (t === "unique") field.unique = true;
      else if (t === "index") field.index = true;
    }
    fields.push(field);
  }

  if (fields.length === 0) return { ok: false, error: "no fields parsed" };
  return { ok: true, collectionName: entityName.toLowerCase(), fields };
}