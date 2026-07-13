/**
 * Identifies the origin of a generated schema. Used by the dynamic-schema module
 * for observability metrics and provenance tracking. Mirrors @common/ai SchemaSource.
 */
export enum SchemaSource {
  Text = "text",
  Image = "image",
  Document = "document",
  Manual = "manual",
  JsonSchema = "json-schema",
  Dsl = "dsl",
  Inference = "inference",
}

export const ALL_SCHEMA_SOURCES: SchemaSource[] = [
  SchemaSource.Text,
  SchemaSource.Image,
  SchemaSource.Document,
  SchemaSource.Manual,
  SchemaSource.JsonSchema,
  SchemaSource.Dsl,
  SchemaSource.Inference,
];
