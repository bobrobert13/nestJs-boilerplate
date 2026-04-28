import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsuariosService } from '../usuarios.service';
import { UsuariosRepository } from '../usuarios.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';

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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
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
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
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
});
