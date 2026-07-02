import {
  Module,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RBAC_HIERARCHY } from '@common/auth';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema';
import { UsuariosRepository } from './usuarios.repository';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UsuarioRoleHierarchy } from './enums/usuario-role.enum';

/**
 * Usuarios module — user directory with RBAC.
 *
 * @description Registers the `Usuario` Mongoose model, wires the RBAC
 * hierarchy provider, and seeds the first administrator from the
 * `ADMIN_EMAIL` env var on application bootstrap (idempotent).
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
  ],
  controllers: [UsuariosController],
  providers: [
    UsuariosRepository,
    UsuariosService,
    // Make the domain hierarchy available to `RolesGuard` via the generic
    // `RBAC_HIERARCHY` DI token. The cast to `RoleHierarchy<string>` is a
    // safe widening: `UsuarioRole` is a `string` subset.
    {
      provide: RBAC_HIERARCHY,
      useValue: UsuarioRoleHierarchy as unknown as Readonly<
        Record<string, number>
      >,
    },
  ],
  exports: [UsuariosService],
})
export class UsuariosModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsuariosModule.name);

  constructor(
    private readonly service: UsuariosService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Seeds the first administrator from `ADMIN_EMAIL` if set.
   *
   * @description Runs once after all modules have initialized (Mongoose
   * connection is up, `UsuariosService` is wired). Idempotent: re-running
   * on every deploy is safe. No-op when the env var is unset — a warning
   * is logged so ops notice the missing config in dev.
   */
  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL');
    if (!email) {
      this.logger.warn(
        'ADMIN_EMAIL env var is not set — admin bootstrap skipped. ' +
          'Set it to the email of a user that should be granted the admin role on boot.',
      );
      return;
    }

    this.logger.log(`ADMIN_EMAIL=${email}: running admin bootstrap...`);
    await this.service.grantAdminByEmail(email);
  }
}
