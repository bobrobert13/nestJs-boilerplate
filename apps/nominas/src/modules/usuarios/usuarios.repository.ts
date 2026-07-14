import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';

interface UsuarioPublic {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UsuariosRepository {
  private readonly logger = new Logger(UsuariosRepository.name);

  constructor(
    @InjectModel(Usuario.name)
    /* eslint-disable-next-line no-unused-vars -- used via this.model in methods */
    private readonly model: Model<UsuarioDocument>,
  ) {}

  async create(createDto: any): Promise<UsuarioPublic> {
    const usuario = new this.model(createDto);
    const saved = await usuario.save();
    this.logger.log(`Usuario created: ${saved._id}`);
    return this.toPublic(saved);
  }

  async findAll(): Promise<UsuarioPublic[]> {
    const usuarios = await this.model.find().exec();
    return usuarios.map((u) => this.toPublic(u));
  }

  async findOne(id: string): Promise<UsuarioPublic> {
    const usuario = await this.model.findById(id).exec();
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} not found`);
    }
    return this.toPublic(usuario);
  }

  async findByEmail(email: string): Promise<UsuarioPublic | null> {
    const usuario = await this.model.findOne({ email }).exec();
    return usuario ? this.toPublic(usuario) : null;
  }

  /**
   * Same as {@link findByEmail} but returns the full document including the
   * password hash.  Only intended for auth-layer consumption (login).
   */
  async findByEmailWithPassword(
    email: string,
  ): Promise<UsuarioDocument | null> {
    return this.model.findOne({ email }).exec();
  }

  async update(id: string, updateDto: any): Promise<UsuarioPublic> {
    const usuario = await this.model
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} not found`);
    }
    this.logger.log(`Usuario updated: ${id}`);
    return this.toPublic(usuario);
  }

  async remove(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Usuario ${id} not found`);
    }
    this.logger.log(`Usuario deleted: ${id}`);
  }

  private toPublic(doc: Document): UsuarioPublic {
    const docAny = doc as any;
    return {
      id: docAny._id.toString(),
      nombre: docAny.nombre,
      apellido: docAny.apellido,
      email: docAny.email,
      telefono: docAny.telefono,
      activo: docAny.activo,
      createdAt: docAny.createdAt,
      updatedAt: docAny.updatedAt,
    };
  }
}
