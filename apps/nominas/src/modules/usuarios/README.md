<!-- apps/nominas/src/modules/usuarios — status: complete -->

# Modulo Usuarios

Modulo CRUD de ejemplo para la gestion de usuarios en `apps/nominas/`. Implementa el patron Repository + Service + Controller de NestJS con persistencia en MongoDB.

## Proposito

Proveer operaciones basicas de alta, lectura, modificacion y baja de usuarios con validacion de unicidad por email y manejo de errores HTTP estandar.

## Estructura del Modulo

```
usuarios/
├── dto/
│   ├── create-usuario.dto.ts     # Validacion de payload de creacion
│   └── update-usuario.dto.ts     # Validacion de payload de actualizacion
├── interfaces/
│   └── usuario.interface.ts      # Interfaces del modulo
├── schemas/
│   └── usuario.schema.ts         # Schema Mongoose + Swagger @ApiProperty
├── usuarios.controller.ts        # Endpoints REST + Swagger decorators
├── usuarios.module.ts            # Wiring NestJS
├── usuarios.repository.ts        # Persistencia (Model<UsuarioDocument>)
├── usuarios.service.ts           # Logica de negocio
└── __tests__/
    ├── usuarios.controller.spec.ts
    ├── usuarios.repository.spec.ts
    └── usuarios.service.spec.ts
```

## Endpoints (Swagger: tag `usuarios`)

| Metodo | Ruta | Descripcion | Respuestas |
|--------|------|-------------|------------|
| `POST` | `/api/usuarios` | Crear nuevo usuario | 201, 409 (email duplicado) |
| `GET` | `/api/usuarios` | Listar todos | 200 |
| `GET` | `/api/usuarios/:id` | Obtener por ID | 200, 404 |
| `PATCH` | `/api/usuarios/:id` | Actualizar parcial | 200, 404 |
| `DELETE` | `/api/usuarios/:id` | Eliminar | 204, 404 |

## Schema Mongoose (`Usuario`)

```typescript
@Schema({ timestamps: true })
export class Usuario {
  nombre: string;        // required, max 100
  apellido: string;      // required, max 100
  email: string;         // required, unique, valid email format
  telefono?: string;     // optional
  activo: boolean;       // default true
}
```

`UsuarioDocument = Usuario & Document` con `createdAt`/`updatedAt` automaticos (`timestamps: true`).

## DTOs

### `CreateUsuarioDto` (entrada de POST)

- `nombre: string` — requerido, max 100 chars
- `apellido: string` — requerido, max 100 chars
- `email: string` — requerido, formato email valido
- `telefono?: string` — opcional

### `UpdateUsuarioDto` (entrada de PATCH)

- Todos los campos opcionales (PartialType). Mismas validaciones que Create.

## Logica de Negocio (`UsuariosService`)

- `create(dto)`: valida email duplicado, lanza `ConflictException(409)` si existe, persiste via repository.
- `findAll()`: lista completa sin paginacion (ejemplo).
- `findOne(id)`: busqueda por ObjectId.
- `update(id, dto)`: actualizacion parcial.
- `remove(id)`: eliminacion definitiva (no soft-delete en esta version).

## Capa de Persistencia (`UsuariosRepository`)

Inyecta `Model<UsuarioDocument>` via `@InjectModel(Usuario.name)`. Metodos:

- `create(dto): Promise<UsuarioPublic>`
- `findAll(): Promise<UsuarioPublic[]>`
- `findOne(id): Promise<UsuarioPublic>` — lanza `NotFoundException(404)`
- `findByEmail(email): Promise<UsuarioPublic \\| null>`
- `update(id, dto): Promise<UsuarioPublic>` — lanza `NotFoundException(404)`
- `remove(id): Promise<void>` — lanza `NotFoundException(404)`

Todos retornan tipo publico `UsuarioPublic` (sin campos internos de Mongoose). Conversor privado `toPublic(doc)` mapea el documento a la forma publica.

## Manejo de Errores

El modulo **no** usa `@common/common` `HttpError` directamente — usa excepciones nativas de NestJS:

- `ConflictException` → HTTP 409 (email duplicado)
- `NotFoundException` → HTTP 404 (ID inexistente)

El `DatabaseExceptionFilter` global de `@common/common` captura errores restantes de MongoDB.

## Convenciones del Modulo

- Repository Pattern: TODA persistencia esta en `UsuariosRepository`.
- Validacion: DTOs con `class-validator`, no se valida en el service.
- Soft-delete: NO implementado. Para soft-delete, agregar campo `deletedAt: Date` al schema + filter `find({ deletedAt: null })`.
- Logging: NestJS `Logger` en Service y Repository (`new Logger(NombreClase.name)`).
- IDs: ObjectId de MongoDB convertidos a string en `toPublic`.

## Uso desde otro Modulo

```typescript
import { UsuariosService } from 'apps/nominas/src/modules/usuarios/usuarios.service';

@Module({
  imports: [UsuariosModule],
})
export class OtroModule {}
```

## Tests

Cobertura Jest disponible en `__tests__/` (3 archivos spec). Para correr:

```bash
npm run test -- usuarios
```

## Status

- **Documentacion**: complete
- **JSDoc**: pending (Fase 3 del change `documentation-llm-readiness-audit`)
- **Tests**: 3 specs (controller, repository, service)
