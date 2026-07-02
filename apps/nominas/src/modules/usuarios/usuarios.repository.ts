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
  roles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UsuariosRepository {
  private readonly logger = new Logger(UsuariosRepository.name);

  constructor(
    @InjectModel(Usuario.name)
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
   * Returns the raw user record for a given email without `toPublic` transformation.
   *
   * @description Used by `UsuariosService.grantAdminByEmail` so the bootstrap
   * path can read `roles` directly off the document (avoiding the public
   * projection and keeping the operation idempotent and allocation-free).
   */
  async findRawByEmail(email: string): Promise<UsuarioDocument | null> {
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

  /**
   * Replaces the target user's roles atomically.
   *
   * @description Uses `findByIdAndUpdate` with `{ new: true }` so the returned
   * document reflects the post-update state. The caller is expected to have
   * already validated the role set and rejected self-modification.
   */
  async updateRoles(id: string, roles: string[]): Promise<UsuarioPublic> {
    const usuario = await this.model
      .findByIdAndUpdate(id, { roles }, { new: true })
      .exec();
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} not found`);
    }
    this.logger.log(`Usuario roles updated: ${id} -> [${roles.join(', ')}]`);
    return this.toPublic(usuario);
  }

  /**
   * Adds a role to the user's roles array idempotently (`$addToSet`).
   *
   * @description Used by the `ADMIN_EMAIL` bootstrap to grant the `admin`
   * role without overwriting any other roles the user might already hold.
   * No-op if the role is already present (MongoDB `$addToSet` semantics).
   */
  async addRole(id: string, role: string): Promise<UsuarioPublic> {
    const usuario = await this.model
      .findByIdAndUpdate(id, { $addToSet: { roles: role } }, { new: true })
      .exec();
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} not found`);
    }
    this.logger.log(`Usuario role added: ${id} -> ${role}`);
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
      // Normalize legacy documents (written before the `roles` field
      // existed) to the current default so consumers always see a value.
      roles: docAny.roles && docAny.roles.length > 0 ? docAny.roles : ['user'],
      createdAt: docAny.createdAt,
      updatedAt: docAny.updatedAt,
    };
  }
}
