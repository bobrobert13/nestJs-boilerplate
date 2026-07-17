import { Injectable, Logger } from '@nestjs/common';
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
  roles?: string[];
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
    private readonly repository: UsuariosRepository,

    private readonly authService: AuthService,
  ) {}

  /**
   * IUserService contract — used by AuthService for login.
   * Receives a repository projection that already hides sensitive fields
   * beyond the password hash (L3 / hardening-medium-low).
   */
  /** findByEmail (see class JSDoc for context). */
  async findByEmail(email: string) {
    const doc = await this.repository.findByEmailWithSecrets(email);
    /** if (see class JSDoc for context). */
    if (!doc) return null;
    return {
      id: doc.id,
      email: doc.email,
      password: doc.passwordHash,
      roles: doc.roles,
    };
  }

  /**
   * IUserService contract � used by AuthService.register for persistence.
   * Receives an already-hashed password from AuthService.
   */
  /** createUser (see class JSDoc for context). */
  async createUser(email: string, hashedPassword: string, name?: string) {
    const created = await this.repository.create({
      nombre: name ?? email.split('@')[0],
      apellido: '',
      email,
      password: hashedPassword,
    });
    return {
      id: (created as any).id ?? (created as any)._id?.toString(),
      email: created.email,
      roles: (created as any).roles ?? ['user'],
    };
  }

  /** create (see class JSDoc for context). */
  async create(createDto: CreateUsuarioDto): Promise<UsuarioPublic> {
    this.logger.log('Creating new usuario');

    const existing = await this.repository.findByEmail(createDto.email);
    /** if (see class JSDoc for context). */
    if (existing) {
      // PR5 / M3 / REQ-usuarios-3 — return the same public shape and
      // status as a fresh registration. Email enumeration is prevented.
      return {
        id: existing.id,
        nombre: existing.nombre,
        apellido: existing.apellido,
        email: existing.email,
        telefono: existing.telefono,
        activo: existing.activo,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

    const hashedPassword = await this.authService.hashPassword(
      createDto.password,
    );

    return this.repository.create({
      ...createDto,
      password: hashedPassword,
    });
  }

  /** findAll (see class JSDoc for context). */
  async findAll(): Promise<UsuarioPublic[]> {
    this.logger.log('Finding all usuarios');
    return this.repository.findAll();
  }

  /** findOne (see class JSDoc for context). */
  async findOne(id: string): Promise<UsuarioPublic> {
    this.logger.log(`Finding usuario: ${id}`);
    return this.repository.findOne(id);
  }

  /** update (see class JSDoc for context). */
  async update(
    id: string,
    updateDto: UpdateUsuarioDto,
  ): Promise<UsuarioPublic> {
    this.logger.log(`Updating usuario: ${id}`);

    const data: any = { ...updateDto };

    /** Re-hash password when a new one is provided. */
    /** if (see class JSDoc for context). */
    if (updateDto.password) {
      data.password = await this.authService.hashPassword(updateDto.password);
    }

    return this.repository.update(id, data);
  }

  /** remove (see class JSDoc for context). */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing usuario: ${id}`);
    await this.repository.remove(id);
  }

  /**
   * PR5 / H1 — read the user's roles by id. Used by the audited role
   * update endpoint to capture the "before" state.
   */
  /** getRoles (see class JSDoc for context). */
  async getRoles(id: string): Promise<{ roles: string[] }> {
    const u = await this.repository.findOne(id);
    return { roles: (u as any).roles ?? [] };
  }

  /**
   * PR5 / H1 — atomic role update; validates the allow-list at the DTO
   * layer. Returns the new roles so the caller can audit "after".
   */
  /** setRoles (see class JSDoc for context). */
  async setRoles(id: string, roles: string[]): Promise<{ roles: string[] }> {
    this.logger.log(`Setting roles for usuario ${id}`);
    const updated = await this.repository.update(id, { roles } as any);
    return { roles: (updated as any).roles ?? roles };
  }
}
