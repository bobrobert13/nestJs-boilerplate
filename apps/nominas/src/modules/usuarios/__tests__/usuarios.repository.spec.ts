import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { UsuariosRepository } from '../usuarios.repository';
import { Usuario } from '../schemas/usuario.schema';

describe('UsuariosRepository', () => {
  let repository: UsuariosRepository;
  let mockModel: any;

  const mockUsuario = {
    _id: '507f1f77bcf86cd799439011',
    nombre: 'John',
    apellido: 'Doe',
    email: 'john.doe@example.com',
    telefono: '+1234567890',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockModel = {
      new: jest.fn(),
      constructor: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosRepository,
        {
          provide: getModelToken(Usuario.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<UsuariosRepository>(UsuariosRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of usuarios', async () => {
      const usuario = {
        _id: '507f1f77bcf86cd799439011',
        nombre: 'John',
        apellido: 'Doe',
        email: 'john.doe@example.com',
        telefono: '+1234567890',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([usuario]) });

      const result = await repository.findAll();

      expect(result[0].id).toBe('507f1f77bcf86cd799439011');
      expect(result[0].nombre).toBe('John');
    });
  });

  describe('findOne', () => {
    it('should return a usuario by id', async () => {
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUsuario) });

      const result = await repository.findOne(mockUsuario._id.toString());

      expect(result.id).toBe(mockUsuario._id.toString());
    });

    it('should throw NotFoundException if not found', async () => {
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(repository.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a usuario by email', async () => {
      mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUsuario) });

      const result = await repository.findByEmail(mockUsuario.email);

      expect(result.email).toBe(mockUsuario.email);
    });

    it('should return null if not found', async () => {
      mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});