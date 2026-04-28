import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Manga extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ type: [{ title: String, link: String, images: [String] }], default: [] })
  chapters: { title: string; link: string; images?: string[] }[];
}

export const MangaSchema = SchemaFactory.createForClass(Manga);