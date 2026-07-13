import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DynamicSchemaEntity,
  DynamicSchemaDocument,
} from './schemas/dynamic-schema.schema';

export interface DynamicSchemaMetadata {
  collectionName: string;
  schemaDefinition: string;
  fieldsHash: string;
  source: string;
  provider?: string;
  model?: string;
  registeredAt: Date;
  registeredBy?: string;
  options?: Record<string, unknown>;
}

@Injectable()
export class DynamicSchemaRepository {
  /**
   * Injected dependencies.
   */
  constructor(
    @InjectModel(DynamicSchemaEntity.name)
    private readonly _model: Model<DynamicSchemaDocument>,
  ) {}

  /**
   * findAll method.
   */
  async findAll(): Promise<DynamicSchemaMetadata[]> {
    const docs = await this._model
      .find()
      .sort({ registeredAt: -1 })
      .lean()
      .exec();
    return docs.map(toMetadata);
  }

  /**
   * findByCollectionName method.
   */
  async findByCollectionName(
    collectionName: string,
  ): Promise<DynamicSchemaMetadata | null> {
    const doc = await this._model.findOne({ collectionName }).lean().exec();
    return doc ? toMetadata(doc) : null;
  }

  /**
   * create method.
   */
  async create(
    data: Omit<DynamicSchemaMetadata, 'registeredAt'>,
  ): Promise<DynamicSchemaMetadata> {
    const doc: unknown = await this._model.create({
      ...data,
      registeredAt: new Date(),
    });
    return toMetadata(doc);
  }

  /**
   * remove method.
   */
  async remove(collectionName: string): Promise<boolean> {
    const result = await this._model.deleteOne({ collectionName }).exec();
    return result.deletedCount > 0;
  }

  /**
   * upsert method.
   */
  async upsert(
    data: Omit<DynamicSchemaMetadata, 'registeredAt'>,
  ): Promise<DynamicSchemaMetadata> {
    const doc = await this._model
      .findOneAndUpdate(
        { collectionName: data.collectionName },
        { ...data, registeredAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean()
      .exec();
    return toMetadata(doc as unknown as Record<string, unknown>);
  }
}

function toMetadata(doc: unknown): DynamicSchemaMetadata {
  const d = doc as Record<string, unknown>;
  return {
    collectionName: String(d.collectionName),
    schemaDefinition: String(d.schemaDefinition),
    fieldsHash: String(d.fieldsHash),
    source: String(d.source),
    provider: (d.provider as string | undefined) ?? undefined,
    model: (d.model as string | undefined) ?? undefined,
    registeredAt: (d.registeredAt as Date | undefined) ?? new Date(),
    registeredBy: (d.registeredBy as string | undefined) ?? undefined,
    options: (d.options as Record<string, unknown> | undefined) ?? undefined,
  };
}
