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

  /**
   * M2 / hardening-medium-low â€” paginated findAll. Returns
   * `{ data, total, page, limit }` per REQ-pagination-2. The legacy
   * `findAll()` array endpoint remains as a deprecated convenience
   * for one minor release (REQ-pagination-4).
   */
  async findAllPaged(
    skip: number,
    limit: number,
  ): Promise<{
    data: UsuarioPublic[];
    total: number;
    page: number;
    limit: number;
  }> {
    const safeSkip = Math.max(0, skip);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const [rows, total] = await Promise.all([
      this.model.find().skip(safeSkip).limit(safeLimit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return {
      data: rows.map((u) => this.toPublic(u)),
      total,
      page: Math.floor(safeSkip / safeLimit) + 1,
      limit: safeLimit,
    };
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
   * L3 / hardening-medium-low â€” return only the safe credential-projection
   * fields. The repository NEVER returns the raw Mongoose document so the
   * `password` argon2 hash cannot leak across the service boundary.
   *
   * Repositories of this name exist precisely so callers can distinguish
   * "needs the hash for login" from "just needs the public shape".
   */
  async findByEmailWithSecrets(email: string): Promise<{
    id: string;
    email: string;
    passwordHash: string;
    roles: string[];
    activo: boolean;
  } | null> {
    const doc = await this.model.findOne({ email }).exec();
    if (!doc) return null;
    const d = doc as any;
    return {
      id: d._id.toString(),
      email: d.email,
      passwordHash: d.password,
      roles: d.roles ?? [],
      activo: d.activo ?? true,
    };
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
