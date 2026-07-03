import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsuariosService } from '../usuarios.service';
import { UsuariosRepository } from '../usuarios.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UsuarioRole } from '../enums/usuario-role.enum';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockRepository: jest.Mocked<UsuariosRepository>;

  const mockUsuario = {
    id: '507f1f77bcf86cd799439011',
    nombre: 'John',
    apellido: 'Doe',
    email: 'john.doe@example.com',
    telefono: '+1234567890',
    activo: true,
    roles: ['user'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByEmail: jest.fn(),
      findRawByEmail: jest.fn(),
      update: jest.fn(),
      updateRoles: jest.fn(),
      addRole: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: UsuariosRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a usuario successfully', async () => {
      const createDto: CreateUsuarioDto = {
        nombre: 'John',
        apellido: 'Doe',
        email: 'john.doe@example.com',
      };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUsuario);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUsuario);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(createDto.email);
      // The service injects the default role before persisting.
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        roles: [UsuarioRole.User],
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const createDto: CreateUsuarioDto = {
        nombre: 'John',
        apellido: 'Doe',
        email: 'john.doe@example.com',
      };
      mockRepository.findByEmail.mockResolvedValue(mockUsuario);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of usuarios', async () => {
      mockRepository.findAll.mockResolvedValue([mockUsuario]);

      const result = await service.findAll();

      expect(result).toEqual([mockUsuario]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a usuario by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUsuario);

      const result = await service.findOne(mockUsuario.id);

      expect(result).toEqual(mockUsuario);
    });

    it('should throw NotFoundException if usuario not found', async () => {
      mockRepository.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a usuario', async () => {
      const updateDto = { nombre: 'Jane' };
      const updatedUsuario = { ...mockUsuario, nombre: 'Jane' };
      mockRepository.update.mockResolvedValue(updatedUsuario);

      const result = await service.update(mockUsuario.id, updateDto);

      expect(result.nombre).toBe('Jane');
    });
  });

  describe('remove', () => {
    it('should remove a usuario', async () => {
      mockRepository.remove.mockResolvedValue();

      await service.remove(mockUsuario.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockUsuario.id);
    });
  });

  describe('assignRoles', () => {
    it('replaces roles for another user and returns the updated public doc', async () => {
      // Happy path: an admin updates someone else's roles.
      mockRepository.findOne.mockResolvedValue({
        ...mockUsuario,
        id: 'target-2',
        roles: ['user'],
      } as any);
      mockRepository.updateRoles.mockResolvedValue({
        ...mockUsuario,
        id: 'target-2',
        roles: ['manager'],
      } as any);

      const result = await service.assignRoles(
        'target-2',
        [UsuarioRole.Manager],
        'request-1',
      );

      expect(result.id).toBe('target-2');
      expect(result.roles).toEqual(['manager']);
    });

    it('throws ForbiddenException when requester.id === target.id (R2.2)', async () => {
      // The service uses assertCanModifyOtherRoles from @common/auth,
      // which throws when the requester IS the target.
      mockRepository.findOne.mockResolvedValue({
        ...mockUsuario,
        id: 'self-1',
        roles: ['admin'],
      } as any);

      await expect(
        service.assignRoles('self-1', [UsuarioRole.Manager], 'self-1'),
      ).rejects.toThrow(ForbiddenException);

      // Defense in depth: the role update must NOT have been attempted.
      expect(mockRepository.updateRoles).not.toHaveBeenCalled();
    });

    it('propagates NotFoundException when the target does not exist (R2.1 partial)', async () => {
      // The repository's findOne throws NotFoundException; the service
      // does not catch it. updateRoles must not be called.
      mockRepository.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.assignRoles('ghost', [UsuarioRole.Manager], 'admin-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.updateRoles).not.toHaveBeenCalled();
    });

    it('passes the target id and the role list to repository.updateRoles', async () => {
      // Call-args contract: the service must pass the user id and the
      // raw role array down to the repository. No re-mapping, no
      // normalization.
      mockRepository.findOne.mockResolvedValue({
        ...mockUsuario,
        id: 'target-3',
        roles: ['user'],
      } as any);
      mockRepository.updateRoles.mockResolvedValue({
        ...mockUsuario,
        id: 'target-3',
        roles: [UsuarioRole.Admin, UsuarioRole.Manager],
      } as any);

      await service.assignRoles(
        'target-3',
        [UsuarioRole.Admin, UsuarioRole.Manager],
        'admin-1',
      );

      expect(mockRepository.updateRoles).toHaveBeenCalledTimes(1);
      expect(mockRepository.updateRoles).toHaveBeenCalledWith('target-3', [
        UsuarioRole.Admin,
        UsuarioRole.Manager,
      ]);
    });
  });

  describe('grantAdminByEmail', () => {
    it('is a no-op when the email argument is undefined (R4.1)', async () => {
      // The module-level guard short-circuits on `undefined`, so this
      // case is defensive. The service still calls `findRawByEmail`
      // (which returns null) and exits without calling `addRole`.
      mockRepository.findRawByEmail.mockResolvedValue(null);

      const result = await service.grantAdminByEmail(undefined as any);

      expect(result).toBeUndefined();
      expect(mockRepository.findRawByEmail).toHaveBeenCalledWith(undefined);
      expect(mockRepository.addRole).not.toHaveBeenCalled();
    });

    it('does nothing when the user does not exist (R4.1)', async () => {
      // The user has not been registered yet — log a warning and exit.
      mockRepository.findRawByEmail.mockResolvedValue(null);

      const result = await service.grantAdminByEmail('missing@example.com');

      expect(result).toBeUndefined();
      expect(mockRepository.addRole).not.toHaveBeenCalled();
    });

    it('grants admin when the user exists and does not yet have admin (R4.2)', async () => {
      // Normal bootstrap path: user exists with `user` role only.
      mockRepository.findRawByEmail.mockResolvedValue({
        _id: { toString: () => 'user-id-1' },
        roles: ['user'],
      } as any);
      mockRepository.addRole.mockResolvedValue(mockUsuario as any);

      await service.grantAdminByEmail('user@example.com');

      expect(mockRepository.addRole).toHaveBeenCalledWith(
        'user-id-1',
        UsuarioRole.Admin,
      );
    });

    it('is a no-op when the user already has admin (R4.3)', async () => {
      // Idempotency: re-running the bootstrap must NOT add a duplicate
      // admin role. We short-circuit BEFORE the addRole call.
      mockRepository.findRawByEmail.mockResolvedValue({
        _id: { toString: () => 'admin-id' },
        roles: ['user', 'admin'],
      } as any);

      await service.grantAdminByEmail('admin@example.com');

      expect(mockRepository.addRole).not.toHaveBeenCalled();
    });
  });

  describe('create default role (R3.1)', () => {
    it('applies roles: ["user"] when the DTO has no roles field', async () => {
      // Public self-service registration — the only entry point today.
      const createDto: CreateUsuarioDto = {
        nombre: 'Jane',
        apellido: 'Doe',
        email: 'jane@example.com',
      };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUsuario);

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        roles: [UsuarioRole.User],
      });
    });

    it('applies roles: ["user"] when the DTO has an empty roles array', async () => {
      // An empty array is treated as "no roles specified" — the default
      // wins. This is the contract: callers cannot accidentally create a
      // user with no roles.
      const createDto = {
        nombre: 'Jane',
        apellido: 'Doe',
        email: 'jane@example.com',
        roles: [] as UsuarioRole[],
      } as CreateUsuarioDto;
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUsuario);

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        roles: [UsuarioRole.User],
      });
    });

    it('passes through explicit roles when provided', async () => {
      // An admin-created user with explicit roles: the DTO value wins
      // over the default.
      const createDto: CreateUsuarioDto = {
        nombre: 'Jane',
        apellido: 'Doe',
        email: 'jane@example.com',
        roles: [UsuarioRole.Admin],
      };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        ...mockUsuario,
        roles: [UsuarioRole.Admin],
      });

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        roles: [UsuarioRole.Admin],
      });
    });
  });
});
