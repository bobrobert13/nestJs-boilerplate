import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { AuthService, IUserService } from '@common/auth';
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

/**
 * Business-logic service for {@link Usuario} CRUD.
 *
 * Implements {@link IUserService} so the reusable {@link AuthService}
 * can delegate real credential lookups to this module instead of using
 * its built-in demo stub.
 */
@Injectable()
export class UsuariosService implements IUserService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    /* eslint-disable-next-line no-unused-vars -- NestJS DI, used via this.repository */
    private readonly repository: UsuariosRepository,
    /* eslint-disable-next-line no-unused-vars -- NestJS DI, used via this.authService */
    private readonly authService: AuthService,
  ) {}

  /**
   * IUserService contract — used by AuthService for login.
   * Returns the full user document (including password hash) or null.
   */
  async findByEmail(email: string) {
    const doc = await this.repository.findByEmailWithPassword(email);
    if (!doc) return null;
    return {
      id: (doc as any)._id.toString(),
      email: doc.email,
      password: doc.password,
      roles: doc.roles,
    };
  }

  async create(createDto: CreateUsuarioDto): Promise<UsuarioPublic> {
    this.logger.log('Creating new usuario');

    const existing = await this.repository.findByEmail(createDto.email);
    if (existing) {
      throw new ConflictException(
        `Usuario with email ${createDto.email} already exists`,
      );
    }

    const hashedPassword = await this.authService.hashPassword(
      createDto.password,
    );

    return this.repository.create({
      ...createDto,
      password: hashedPassword,
    });
  }

  async findAll(): Promise<UsuarioPublic[]> {
    this.logger.log('Finding all usuarios');
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<UsuarioPublic> {
    this.logger.log(`Finding usuario: ${id}`);
    return this.repository.findOne(id);
  }

  async update(
    id: string,
    updateDto: UpdateUsuarioDto,
  ): Promise<UsuarioPublic> {
    this.logger.log(`Updating usuario: ${id}`);

    const data: any = { ...updateDto };

    /** Re-hash password when a new one is provided. */
    if (updateDto.password) {
      data.password = await this.authService.hashPassword(updateDto.password);
    }

    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing usuario: ${id}`);
    await this.repository.remove(id);
  }
}
