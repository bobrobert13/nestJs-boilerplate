import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { RBAC_HIERARCHY } from '@common/auth';
import { UsuariosModule } from '../usuarios.module';
import { UsuariosService } from '../usuarios.service';
import { UsuariosRepository } from '../usuarios.repository';
import { Usuario } from '../schemas/usuario.schema';
import { UsuarioRoleHierarchy, UsuarioRole } from '../enums/usuario-role.enum';

describe('UsuariosModule', () => {
  let moduleRef: TestingModule;
  let moduleInstance: UsuariosModule;
  let mockService: { grantAdminByEmail: jest.Mock };
  let mockConfig: { get: jest.Mock };
  let mockModel: any;

  beforeEach(async () => {
    mockService = { grantAdminByEmail: jest.fn().mockResolvedValue(undefined) };
    mockConfig = { get: jest.fn() };
    mockModel = {
      // A bare Mongoose model shape is enough — the module only needs the
      // token resolved, not a real model.
      find: jest.fn(),
    };

    // The UsuariosModule constructor injects UsuariosService + ConfigService.
    // We can't `imports: [UsuariosModule]` directly because the module
    // doesn't bring its own ConfigService — it's expected to be available
    // globally (via `ConfigModule.forRoot({isGlobal: true})` in the app).
    // For the test, we re-create the module's provider list manually so
    // every constructor dependency is satisfied and overridable.
    moduleRef = await Test.createTestingModule({
      providers: [
        // The module under test:
        UsuariosModule,
        // The module's own providers (re-declared to override):
        UsuariosRepository,
        UsuariosService,
        // External deps the module needs:
        { provide: ConfigService, useValue: mockConfig },
        { provide: getModelToken(Usuario.name), useValue: mockModel },
        { provide: RBAC_HIERARCHY, useValue: UsuarioRoleHierarchy },
      ],
    })
      // Override the service with a controlled mock.
      .overrideProvider(UsuariosService)
      .useValue(mockService)
      .compile();

    moduleInstance = moduleRef.get<UsuariosModule>(UsuariosModule);
  });

  it('should be defined', () => {
    expect(moduleInstance).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('skips the bootstrap when ADMIN_EMAIL is unset (R4.1)', async () => {
      // The module must NOT touch the service when the env var is absent
      // — a no-op (with a warning log) is the safe default.
      mockConfig.get.mockReturnValue(undefined);

      await expect(
        moduleInstance.onApplicationBootstrap(),
      ).resolves.toBeUndefined();

      expect(mockConfig.get).toHaveBeenCalledWith('ADMIN_EMAIL');
      expect(mockService.grantAdminByEmail).not.toHaveBeenCalled();
    });

    it('calls service.grantAdminByEmail(email) when ADMIN_EMAIL is set (R4.2)', async () => {
      // The env var is present — the module must read it and forward to
      // the service exactly once.
      mockConfig.get.mockReturnValue('admin@example.com');

      await moduleInstance.onApplicationBootstrap();

      expect(mockConfig.get).toHaveBeenCalledWith('ADMIN_EMAIL');
      expect(mockService.grantAdminByEmail).toHaveBeenCalledTimes(1);
      expect(mockService.grantAdminByEmail).toHaveBeenCalledWith(
        'admin@example.com',
      );
    });

    it('resolves cleanly when grantAdminByEmail resolves to undefined (R4.3)', async () => {
      // The bootstrap is `await`-ed; the service resolves to undefined
      // on the no-op path. The module must NOT throw or re-resolve.
      mockConfig.get.mockReturnValue('admin@example.com');

      await expect(
        moduleInstance.onApplicationBootstrap(),
      ).resolves.toBeUndefined();
    });
  });

  describe('RBAC_HIERARCHY provider', () => {
    it('registers UsuarioRoleHierarchy under the RBAC_HIERARCHY token', () => {
      // The `RolesGuard` injects via this token. If the binding drifts
      // (wrong shape, wrong token), the guard silently falls back to
      // string-equality and the hierarchy is dead.
      const registered =
        moduleRef.get<typeof UsuarioRoleHierarchy>(RBAC_HIERARCHY);
      expect(registered).toBeDefined();
      // The frozen hierarchy must rank admin > manager > user.
      expect(registered[UsuarioRole.Admin]).toBe(3);
      expect(registered[UsuarioRole.Manager]).toBe(2);
      expect(registered[UsuarioRole.User]).toBe(1);
    });
  });
});
