import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Manga } from './schemas/manga.schema';

@Injectable()
export class MangasRepository {
  constructor(@InjectModel(Manga.name) private readonly model: Model<Manga>) {}

  async create(data: Partial<Manga>): Promise<Manga> {
    return this.model.create(data);
  }

  async findAll(): Promise<Manga[]> {
    return this.model.find().exec();
  }

  async findById(id: string): Promise<Manga | null> {
    return this.model.findById(id).exec();
  }
}