import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Persisted metadata for a dynamically compiled schema. Allows the module
 * to rehydrate registered models on startup.
 */
@Schema({ timestamps: true, collection: 'dynamic_schemas' })
export class DynamicSchemaEntity {
  @Prop({ required: true, unique: true, index: true })
  collectionName: string;

  @Prop({ type: String, required: true })
  schemaDefinition: string;

  @Prop({ type: String, required: true, index: true })
  fieldsHash: string;

  @Prop({ type: String, required: true })
  source: string;

  @Prop({ type: String })
  provider?: string;

  @Prop({ type: String })
  model?: string;

  @Prop({ type: String })
  registeredBy?: string;

  @Prop({ type: Object })
  options?: Record<string, unknown>;

  @Prop({ type: Date })
  registeredAt?: Date;
}

export type DynamicSchemaDocument = DynamicSchemaEntity & Document;
export const DynamicSchemaSchema =
  SchemaFactory.createForClass(DynamicSchemaEntity);
/**
 * Backwards-compatible alias: some existing modules import the symbol as
 * DynamicSchema. Keep both names available.
 */
export { DynamicSchemaEntity as DynamicSchema };
