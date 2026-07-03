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

  describe('updateRoles', () => {
    it('replaces the roles array atomically and returns the public doc', async () => {
      // The call shape is critical: the repository must pass `{ new: true }`
      // so the returned doc reflects the post-update state.
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockUsuario,
          roles: ['manager'],
        }),
      });

      const result = await repository.updateRoles('id-1', ['manager']);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        { roles: ['manager'] },
        { new: true },
      );
      expect(result.roles).toEqual(['manager']);
    });

    it('throws NotFoundException when the target does not exist', async () => {
      // Same pattern as findOne — a null result from Mongoose means
      // the document was not found.
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        repository.updateRoles('ghost', ['manager']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addRole', () => {
    it('uses $addToSet for idempotent role addition', async () => {
      // `$addToSet` is critical: it makes the operation idempotent at the
      // database level. A second call with the same role is a no-op.
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockUsuario,
          roles: ['user', 'admin'],
        }),
      });

      const result = await repository.addRole('id-1', 'admin');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id-1',
        { $addToSet: { roles: 'admin' } },
        { new: true },
      );
      expect(result.roles).toContain('admin');
    });

    it('throws NotFoundException when the target does not exist', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        repository.addRole('ghost', 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRawByEmail', () => {
    it('returns the raw Mongoose document (no toPublic transformation)', async () => {
      // The whole point of this method: skip the public projection so
      // `grantAdminByEmail` can read `roles` and `_id` directly.
      const rawDoc = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'admin@example.com',
        roles: ['user'],
      };
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(rawDoc),
      });

      const result = await repository.findRawByEmail('admin@example.com');

      // The result must be the raw doc, not a `toPublic`-transformed one.
      // Key signal: the raw doc has `_id` (with a `toString` method), not
      // a string `id`.
      expect(result).toBe(rawDoc);
      expect((result as any)._id).toBe(rawDoc._id);
    });

    it('returns null when the user does not exist', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findRawByEmail('ghost@example.com');

      expect(result).toBeNull();
    });
  });

  describe('toPublic legacy normalization (R3.2)', () => {
    it('returns roles: ["user"] when the raw document has no roles field', async () => {
      // Legacy documents written before the `roles` field existed must
      // be normalized to the current default on read.
      const legacyDoc: any = {
        _id: '507f1f77bcf86cd799439011',
        nombre: 'Legacy',
        apellido: 'Doc',
        email: 'legacy@example.com',
        activo: true,
        // no `roles` field
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(legacyDoc),
      });

      const result = await repository.findOne('507f1f77bcf86cd799439011');

      expect(result.roles).toEqual(['user']);
    });

    it('returns roles as-is when the raw document has the field', async () => {
      // Modern documents with the `roles` field are passed through.
      const modernDoc: any = {
        _id: '507f1f77bcf86cd799439011',
        nombre: 'Modern',
        apellido: 'Doc',
        email: 'modern@example.com',
        activo: true,
        roles: ['manager'],
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(modernDoc),
      });

      const result = await repository.findOne('507f1f77bcf86cd799439011');

      expect(result.roles).toEqual(['manager']);
    });
  });
});
