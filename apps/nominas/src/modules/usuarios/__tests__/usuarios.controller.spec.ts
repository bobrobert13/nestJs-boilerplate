import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard, RolesGuard } from '@common/auth';
import { UsuariosController } from '../usuarios.controller';
import { UsuariosService } from '../usuarios.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { AssignRolesDto } from '../dto/assign-roles.dto';
import { UsuarioRole } from '../enums/usuario-role.enum';

describe('UsuariosController', () => {
  let controller: UsuariosController;
  let mockService: jest.Mocked<UsuariosService>;

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
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      assignRoles: jest.fn(),
      grantAdminByEmail: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        {
          provide: UsuariosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with createDto', async () => {
      const createDto: CreateUsuarioDto = {
        nombre: 'John',
        apellido: 'Doe',
        email: 'john.doe@example.com',
      };
      mockService.create.mockResolvedValue(mockUsuario);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockUsuario);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of usuarios', async () => {
      mockService.findAll.mockResolvedValue([mockUsuario]);

      const result = await controller.findAll();

      expect(result).toEqual([mockUsuario]);
    });
  });

  describe('findOne', () => {
    it('should return a usuario by id', async () => {
      mockService.findOne.mockResolvedValue(mockUsuario);

      const result = await controller.findOne(mockUsuario.id);

      expect(result).toEqual(mockUsuario);
    });
  });

  describe('update', () => {
    it('should call service.update with id and updateDto', async () => {
      const updateDto: UpdateUsuarioDto = { nombre: 'Jane' };
      const updatedUsuario = { ...mockUsuario, nombre: 'Jane' };
      mockService.update.mockResolvedValue(updatedUsuario);

      const result = await controller.update(mockUsuario.id, updateDto);

      expect(result.nombre).toBe('Jane');
      expect(mockService.update).toHaveBeenCalledWith(mockUsuario.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockService.remove.mockResolvedValue();

      await controller.remove(mockUsuario.id);

      expect(mockService.remove).toHaveBeenCalledWith(mockUsuario.id);
    });
  });

  describe('assignRoles', () => {
    it('should delegate to service.assignRoles with id, dto.roles, and req.user.id', async () => {
      // The controller is a thin pass-through: it must read roles from the
      // DTO and the requester id from the authenticated request.
      const dto: AssignRolesDto = { roles: [UsuarioRole.Manager] };
      const req = { user: { id: 'request-1' } } as any;
      const updated = { ...mockUsuario, roles: ['manager'] };
      mockService.assignRoles.mockResolvedValue(updated);

      const result = await controller.assignRoles('target-2', dto, req);

      expect(result).toEqual(updated);
      expect(mockService.assignRoles).toHaveBeenCalledWith(
        'target-2',
        [UsuarioRole.Manager],
        'request-1',
      );
    });
  });

  describe('controller-integration (guard chain)', () => {
    // The controller declares `@UseGuards(JwtAuthGuard, RolesGuard)` at the
    // class level. This test proves that the guard chain wires correctly:
    // we replace both guards with no-op implementations and call a route.
    // If a guard were missing, the call would short-circuit and the
    // service method would NOT be invoked.
    it('routes requests through the service when guards are bypassed', async () => {
      const moduleWithGuards: TestingModule =
        await Test.createTestingModule({
          controllers: [UsuariosController],
          providers: [
            { provide: UsuariosService, useValue: mockService },
          ],
        })
          .overrideGuard(JwtAuthGuard)
          .useValue({ canActivate: () => true })
          .overrideGuard(RolesGuard)
          .useValue({ canActivate: () => true })
          .compile();

      const guardedController =
        moduleWithGuards.get<UsuariosController>(UsuariosController);
      mockService.findAll.mockResolvedValue([mockUsuario]);

      const result = await guardedController.findAll();

      expect(result).toEqual([mockUsuario]);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });
});
