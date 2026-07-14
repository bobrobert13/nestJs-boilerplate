import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UsuariosController } from '../usuarios.controller';
import { UsuariosService } from '../usuarios.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';

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
      expect(mockService.update).toHaveBeenCalledWith(
        mockUsuario.id,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      mockService.remove.mockResolvedValue();

      await controller.remove(mockUsuario.id);

      expect(mockService.remove).toHaveBeenCalledWith(mockUsuario.id);
    });
  });
});
