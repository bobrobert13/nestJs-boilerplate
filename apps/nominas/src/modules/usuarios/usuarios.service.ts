import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

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
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(private readonly repository: UsuariosRepository) {}

  async create(createDto: CreateUsuarioDto): Promise<UsuarioPublic> {
    this.logger.log('Creating new usuario');

    const existing = await this.repository.findByEmail(createDto.email);
    if (existing) {
      throw new ConflictException(`Usuario with email ${createDto.email} already exists`);
    }

    return this.repository.create(createDto);
  }

  async findAll(): Promise<UsuarioPublic[]> {
    this.logger.log('Finding all usuarios');
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<UsuarioPublic> {
    this.logger.log(`Finding usuario: ${id}`);
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateUsuarioDto): Promise<UsuarioPublic> {
    this.logger.log(`Updating usuario: ${id}`);
    return this.repository.update(id, updateDto);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing usuario: ${id}`);
    await this.repository.remove(id);
  }
}