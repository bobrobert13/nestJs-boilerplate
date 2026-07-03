import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { assertCanModifyOtherRoles } from '@common/auth';
import { UsuariosRepository } from './usuarios.repository';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioRole } from './enums/usuario-role.enum';

export interface UsuarioPublic {
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
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(private readonly repository: UsuariosRepository) {}

  async create(createDto: CreateUsuarioDto): Promise<UsuarioPublic> {
    this.logger.log('Creating new usuario');

    const existing = await this.repository.findByEmail(createDto.email);
    if (existing) {
      throw new ConflictException(
        `Usuario with email ${createDto.email} already exists`,
      );
    }

    // Default role on create. Callers can override by passing `roles` in
    // the DTO, but for the public self-service registration flow (the only
    // entry point today) the role is always ['user'].
    const dtoWithRoles = {
      ...createDto,
      roles:
        createDto.roles && createDto.roles.length > 0
          ? createDto.roles
          : [UsuarioRole.User],
    };

    return this.repository.create(dtoWithRoles);
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
    return this.repository.update(id, updateDto);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing usuario: ${id}`);
    await this.repository.remove(id);
  }

  /**
   * Replaces a user's roles. Rejects self-modification (defense in depth).
   *
   * @description The `RolesGuard` has already verified that the requester
   * holds the `admin` role. The self-modification check lives here — not in
   * the guard — because the role-change payload lives in the request body
   * and guards do not have a clean, content-type-agnostic way to read it
   * (see ADR-2 in the design document).
   *
   * **Known limitation**: a role change does NOT reflect in the affected
   * user's JWT until their next login. This is a follow-up change to wire
   * `AuthService` to read roles from the `usuarios` collection.
   */
  async assignRoles(
    id: string,
    roles: UsuarioRole[],
    requesterId: string,
  ): Promise<UsuarioPublic> {
    // findOne throws NotFoundException when the target does not exist.
    const target = await this.repository.findOne(id);

    // Throws ForbiddenException when requester.id === target.id. After this
    // call we know requester is a different user.
    assertCanModifyOtherRoles(
      { id: requesterId },
      { id: target.id },
      { roles },
    );

    this.logger.log(
      `Roles updated for ${id} by ${requesterId}: [${roles.join(', ')}]`,
    );
    return this.repository.updateRoles(id, roles as string[]);
  }

  /**
   * Grants the `admin` role to a user identified by email (idempotent).
   *
   * @description Used by `UsuariosModule.onApplicationBootstrap` to seed
   * the first administrator from the `ADMIN_EMAIL` env var. No-op when:
   * - The user does not exist (logs a warning so ops can fix the env var).
   * - The user already holds the `admin` role (MongoDB `$addToSet` is
   *   idempotent, but we short-circuit to avoid a useless write + log noise).
   *
   * Other existing roles are preserved — we add, never replace, so this
   * never strips `manager` or `user` from someone who was already promoted.
   */
  async grantAdminByEmail(email: string): Promise<void> {
    const user = await this.repository.findRawByEmail(email);
    if (!user) {
      this.logger.warn(
        `ADMIN_EMAIL=${email} but no user with that email exists — bootstrap skipped. ` +
          `Create the user first (e.g. via POST /usuarios), then redeploy.`,
      );
      return;
    }

    const currentRoles: string[] = (user as any).roles ?? [];
    if (currentRoles.includes(UsuarioRole.Admin)) {
      this.logger.log(
        `ADMIN_EMAIL=${email}: user already has admin role — bootstrap no-op.`,
      );
      return;
    }

    await this.repository.addRole(
      (user as any)._id.toString(),
      UsuarioRole.Admin,
    );
    this.logger.log(
      `ADMIN_EMAIL=${email}: granted admin role to user ${(user as any)._id}.`,
    );
  }
}
