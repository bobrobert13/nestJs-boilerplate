
# Patrones de Diseño del Boilerplate

> Migrado desde `BOILERPLATE.md` sección 7. Mantener sincronizado.

Este documento describe los patrones de diseño que todos los módulos de `apps/nominas/src/modules/*` deben seguir.

## 1. Repository Pattern

Separar la lógica de acceso a datos en una clase `*Repository` dedicada. Los services NUNCA tocan `Model<>` directamente.

Inyectar `Model<MiEntidadDocument>` vía `@InjectModel(MiEntidad.name)`. Todos los métodos retornan tipo público `*Public` (sin campos internos de Mongoose).

Beneficio: cambiar de Mongoose a Prisma solo requiere reescribir el repository.

## 2. Service Layer

El service contiene la lógica de negocio (validaciones, composición de múltiples repos). No toca el modelo directamente.

Tareas típicas:
- Validar duplicados / reglas de negocio antes de persistir.
- Orquestar múltiples repositorios.
- Lanzar excepciones HTTP (NotFoundException, ConflictException, etc.).

## 3. DTO Pattern

Inputs y outputs tipados, separados de las entidades Mongoose:

- **Create*Dto**: validación de payload de POST (con `class-validator`).
- **Update*Dto**: `PartialType(CreateDto)` para PATCH.
- **\*Public**: tipo de retorno (campos públicos, sin `_id`, `__v`, `passwordHash`, etc.).

Los `*Public` se construyen siempre via `toPublic(doc)` dentro del repository.

## 4. Soft Delete (Opcional)

Si se quiere evitar pérdida de datos:
1. Agregar `@Prop() deletedAt?: Date` al schema.
2. Filtrar en `find()`: `this.model.find({ deletedAt: null })`.
3. En `remove()`: `findByIdAndUpdate(id, { deletedAt: new Date() })`.

## 5. Module Organization

Cada módulo sigue esta estructura:

    mi-modulo/
    ├── dto/                      # CreateMiModuloDto, UpdateMiModuloDto
    ├── interfaces/               # MiModuloPublic, MiModuloQuery
    ├── schemas/                  # mi-modulo.schema.ts
    ├── mi-modulo.controller.ts
    ├── mi-modulo.module.ts
    ├── mi-modulo.repository.ts
    ├── mi-modulo.service.ts
    ├── README.md                 # (este cambio lo agrega)
    └── .llm-context.md           # (auto-generado)

## 6. Swagger / OpenAPI

Todas las controllers usan decorators Swagger:
- `@ApiTags(nombre-modulo)` en la clase controller.
- `@ApiOperation({ summary })` en cada endpoint.
- `@ApiResponse({ status, description })` para cada respuesta posible.
- `@ApiProperty({ example, description, required })` en cada campo de DTO/Schema.

## 7. Error Handling

Jerarquía de errores:

1. Validación de payload → excepciones automáticas vía `ValidationPipe` global.
2. Lógica de negocio → excepciones nativas de NestJS (`NotFoundException`, `ConflictException`, `BadRequestException`).
3. Errores externos (MongoDB, APIs externas) → `DatabaseExceptionFilter` global de `@common/common`.

Para errores personalizados usar `HttpError` de `@common/common` (status, message, url, data).

## 8. Logging

Cada service/repository/controller tiene `private readonly logger = new Logger(NombreClase.name)`. Mensajes clave deben loguearse:
- Cambios de estado (create/update/remove).
- Operaciones costosas con duración.
- Errores capturados.

## 9. Cross-cutting Concerns (para LLM)

- Cada módulo nuevo debe tener `README.md` y `.llm-context.md` adyacentes.
- JSDoc obligatorio en TODOS los métodos públicos (regla ESLint `ai-readiness/require-public-jsdoc`).
- Spec OpenSpec en `openspec/specs/<nombre-modulo>/spec.md` SI el módulo expone lógica reutilizable.
- Validar con `npm run audit:docs` que la cobertura JSDoc >= 80%.
