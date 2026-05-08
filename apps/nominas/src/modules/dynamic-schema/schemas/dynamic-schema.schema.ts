import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DynamicSchema extends Document {
  @Prop({ required: true })
  collectionName: string;

  @Prop({ type: String, required: true })
  schemaDefinition: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const DynamicSchemaSchema = SchemaFactory.createForClass(DynamicSchema);
