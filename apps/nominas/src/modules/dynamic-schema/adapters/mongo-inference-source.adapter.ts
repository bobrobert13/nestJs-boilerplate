import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GeneratedSchema, SchemaFieldDefinition, SchemaFieldType } from '@common/ai';
import { SchemaSource } from '../interfaces/schema-source.enum';
import { SourceAdapter, AdapterContext, AdapterValidation } from './source-adapter.interface';

export interface MongoInferenceInput {
  collectionName: string;
  sampleSize?: number;
}

const ISO_8601_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

@Injectable()
export class MongoInferenceSourceAdapter implements SourceAdapter<MongoInferenceInput> {
  readonly source = SchemaSource.Inference;
  constructor(@InjectConnection() private readonly connection: Connection) {}

  validate(input: MongoInferenceInput): AdapterValidation {
    const errors: string[] = [];
    if (!input?.collectionName || typeof input.collectionName !== "string") {
      errors.push("collectionName is required");
    }
    return { valid: errors.length === 0, errors };
  }

  async convert(input: MongoInferenceInput, _context: AdapterContext): Promise<GeneratedSchema> {
    const v = this.validate(input);
    if (!v.valid) throw new Error("SCHEMA_VALIDATION_ERROR: " + v.errors.join("; "));
    const db = this.connection.db;
    if (!db) throw new Error("INFERENCE_ERROR: no active Mongo db connection");
    const collections = await db.listCollections({ name: input.collectionName }).toArray();
    if (collections.length === 0) throw new Error("COLLECTION_NOT_FOUND: " + input.collectionName);
    const sampleSize = Math.max(1, Math.min(input.sampleSize ?? 50, 200));
    const docs = await db.collection(input.collectionName).find({}).limit(sampleSize).toArray();
    if (docs.length === 0) throw new Error("INFERENCE_ERROR: collection " + input.collectionName + " has no documents");
    const fields = inferFields(docs);
    return { fields, collectionName: input.collectionName, source: SchemaSource.Inference, metadata: { sampleSize: docs.length, sampledFrom: input.collectionName } };
  }
}
function inferFields(docs: Record<string, unknown>[]): SchemaFieldDefinition[] {
  const total = docs.length;
  const counter = new Map<string, { count: number; types: Set<string>; samples: unknown[] }>();
  for (const doc of docs) {
    for (const [k, v] of Object.entries(doc)) {
      if (k === "_id") continue;
      if (v === undefined || v === null) continue;
      const type = inferType(v);
      let entry = counter.get(k);
      if (!entry) {
        entry = { count: 0, types: new Set<string>(), samples: [] };
        counter.set(k, entry);
      }
      entry.count++;
      entry.types.add(type);
      if (entry.samples.length < 5) entry.samples.push(v);
    }
  }
  const fields: SchemaFieldDefinition[] = [];
  for (const [name, entry] of counter.entries()) {
    const mostCommonType = pickMostCommonType(entry.types);
    const required = entry.count / total > 0.9;
    const field: SchemaFieldDefinition = { name, type: mostCommonType };
    if (required) field.required = true;
    if (mostCommonType === "array") {
      const sampleArr = entry.samples.find((s) => Array.isArray(s)) as unknown[] | undefined;
      if (sampleArr && sampleArr.length > 0) {
        field.items = { name: "item", type: inferType(sampleArr[0]) };
      } else {
        field.items = { name: "item", type: "string" };
      }
    }
    if (mostCommonType === "object") {
      const sampleObj = entry.samples.find((s) => typeof s === "object" && s !== null && !Array.isArray(s)) as Record<string, unknown> | undefined;
      if (sampleObj) {
        const inferred = inferFields([sampleObj]);
        field.properties = Object.fromEntries(inferred.map((f) => [f.name, f]));
      } else {
        field.properties = {};
      }
    }
    fields.push(field);
  }
  return fields;
}

function inferType(v: unknown): SchemaFieldType {
  if (v === null) return "string";
  if (Array.isArray(v)) return "array";
  if (v instanceof Date) return "date";
  if (typeof v === "string") {
    if (OBJECT_ID_RE.test(v)) return "objectId";
    if (ISO_8601_RE.test(v)) return "date";
    if (NUMERIC_RE.test(v)) return "number";
    return "string";
  }
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "object") return "object";
  return "mixed";
}

function pickMostCommonType(types: Set<string>): SchemaFieldType {
  const order: SchemaFieldType[] = ["string", "number", "boolean", "date", "array", "object", "mixed", "objectId"];
  for (const t of order) if (types.has(t)) return t;
  return "mixed";
}