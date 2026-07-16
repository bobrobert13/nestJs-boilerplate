import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsuariosService } from '../usuarios.service';
import { UsuariosRepository } from '../usuarios.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { AuthService } from '@common/auth';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockRepository: jest.Mocked<UsuariosRepository>;
  let mockAuthService: jest.Mocked<Partial<AuthService>>;

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

  const mockDoc = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    email: 'john.doe@example.com',
    password: '$argon2id$...',
    roles: ['user'],
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    mockAuthService = {
      hashPassword: jest.fn().mockResolvedValue('$argon2id$hashed'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: UsuariosRepository, useValue: mockRepository },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail (IUserService)', () => {
    it('should return user data for auth when found', async () => {
      mockRepository.findByEmailWithPassword.mockResolvedValue(mockDoc as any);

      const result = await service.findByEmail('john.doe@example.com');

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        email: 'john.doe@example.com',
        password: '$argon2id$...',
        roles: ['user'],
      });
    });

    it('should return null when user not found', async () => {
      mockRepository.findByEmailWithPassword.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a usuario with hashed password', async () => {
      const createDto: CreateUsuarioDto = {
        nombre: 'John',
        apellido: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePass123',
      };
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUsuario);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUsuario);
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith(
        'securePass123',
      );
      expect(mockRepository.create).toHaveBeenCalledWith({
        nombre: 'John',
        apellido: 'Doe',
        email: 'john.doe@example.com',
        password: '$argon2id$hashed',
      });
    });

    it('returns the same public shape for an existing email (M3 / no enumeration)', async () => {
      const createDto: CreateUsuarioDto = {
        nombre: 'John',
        apellido: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePass123',
      };
      mockRepository.findByEmail.mockResolvedValue(mockUsuario);

      const result = await service.create(createDto);
      expect(result).toEqual(mockUsuario);
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
    it('should update a usuario without rehashing', async () => {
      const updateDto = { nombre: 'Jane' };
      const updatedUsuario = { ...mockUsuario, nombre: 'Jane' };
      mockRepository.update.mockResolvedValue(updatedUsuario);

      const result = await service.update(mockUsuario.id, updateDto);

      expect(result.nombre).toBe('Jane');
      expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
    });

    it('should rehash password when provided', async () => {
      mockAuthService.hashPassword.mockResolvedValue('$argon2id$newhash');
      const updateDto = { password: 'newPass456' };
      mockRepository.update.mockResolvedValue(mockUsuario);

      await service.update(mockUsuario.id, updateDto);

      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('newPass456');
      expect(mockRepository.update).toHaveBeenCalledWith(mockUsuario.id, {
        password: '$argon2id$newhash',
      });
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
