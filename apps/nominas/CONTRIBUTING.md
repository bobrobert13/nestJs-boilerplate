
# Guia para Contribuir

> Migrado desde `BOILERPLATE.md` sección 6. Mantener sincronizado.

Como agregar un nuevo modulo de negocio a `apps/nominas/src/modules/`.

## Prerrequisitos

- Leer [`PATTERNS.md`](./PATTERNS.md) primero.
- Conocer el dominio (DTOs, validaciones, casos edge).
- Haber escrito los tests ANTES de la implementacion (TDD recomendado).

## Paso a Paso

### Paso 1: Crear el Schema Mongoose

Archivo: `mi-modulo/schemas/mi-modulo.schema.ts`

- Importar `Prop, Schema, SchemaFactory` de `@nestjs/mongoose`.
- Importar `ApiProperty` de `@nestjs/swagger` para cada campo.
- Usar `@Schema({ timestamps: true })` para createdAt/updatedAt automaticos.
- Exportar tipo `MiModuloDocument = MiModulo & Document`.
- Exportar `MiModuloSchema = SchemaFactory.createForClass(MiModulo)`.

### Paso 2: Crear DTOs

Archivo: `mi-modulo/dto/create-mi-modulo.dto.ts`

- Importar `ApiProperty` de `@nestjs/swagger` para documentar en Swagger.
- Importar decoradores de `class-validator` para validacion (`IsString`, `IsEmail`, etc.).
- Cada campo debe tener `example` y `description` en `@ApiProperty`.

Crear tambien `update-mi-modulo.dto.ts` que use `PartialType(CreateMiModuloDto)` de `@nestjs/swagger`.

### Paso 3: Crear el Repository

Archivo: `mi-modulo/mi-modulo.repository.ts`

- Inyectar `@InjectModel(MiModulo.name) private readonly model: Model<MiModuloDocument>`.
- Cada metodo retorna tipo publico `*Public`.
- Implementar metodo privado `toPublic(doc: Document): MiModuloPublic` para mapear Mongoose → DTO publico.
- Lanzar `NotFoundException` desde el repository cuando un ID no existe.

### Paso 4: Crear el Service

Archivo: `mi-modulo/mi-modulo.service.ts`

- Inyectar solo `MiModuloRepository` (no el model).
- Logica de negocio: validacion email duplicado, reglas de dominio.
- Excepciones HTTP via `NotFoundException`, `ConflictException`, `BadRequestException`.

### Paso 5: Crear el Controller

Archivo: `mi-modulo/mi-modulo.controller.ts`

- `@ApiTags(nombre-modulo)` en la clase.
- `@ApiOperation` + `@ApiResponse` en cada metodo.
- `@UsePipes(ValidationPipe)` si no es global.
- Inyectar solo `Service` (no repository directo).

### Paso 6: Registrar en el Module

Archivo: `mi-modulo/mi-modulo.module.ts`

Estructura del decorator `@Module`:

- `imports`: modulos externos necesarios (e.g., `MongooseModule.forFeature`).
- `controllers`: [MiModuloController].
- `providers`: [MiModuloRepository, MiModuloService].
- `exports`: [MiModuloService] si se quiere consumir desde otros modulos.

### Paso 7: Integrar en AppModule

En `apps/nominas/src/app.module.ts`, agregar `MiModuloModule` al array `imports`.

### Paso 8: Tests (TDD)

Crear al menos:

- `mi-modulo.controller.spec.ts` — mockear service, validar endpoints.
- `mi-modulo.repository.spec.ts` — usar mongodb-memory-server.
- `mi-modulo.service.spec.ts` — mockear repository.

### Paso 9: Documentacion

1. Crear `mi-modulo/README.md` con:
   - Proposito del modulo.
   - Lista de endpoints (Swagger tags).
   - Schema Mongoose + DTOs.
   - Convenciones (soft delete?, paginacion?).
2. Crear `mi-modulo/.llm-context.md` (auto via `npm run docs:context`).
3. Agregar JSDoc en metodos publicos (regla ESLint exige).
4. Si aplica, crear spec OpenSpec en `openspec/specs/<nombre-modulo>/spec.md`.

### Paso 10: Validar

Correr antes de commit:

- `npm run build` — verificar TypeScript.
- `npm run lint` — sin warnings nuevos.
- `npm run test -- mi-modulo` — todos los tests pasan.
- `npm run audit:docs` — cobertura JSDoc del modulo >= 80%.

---

## Agregar un campo nuevo a un modulo existente

1. Agregar `@Prop()` en el schema.
2. Agregar el campo a `CreateDto` con `@ApiProperty` + `@IsXxx()`.
3. Si el campo es publico, agregar a `*Public`.
4. Si es opcional, agregar a `UpdateDto` (automatico via `PartialType`).
5. Migracion de datos: ver [`docs/migrations.md`](../../../docs/migrations.md) (si aplica).

## Convenciones de naming

- Files: `kebab-case.ts`
- Classes: `PascalCase` + sufijo `Dto`, `Service`, `Controller`, `Repository`, `Module`, `Schema`, `Interface`
- Constants: `UPPER_SNAKE_CASE`
- Variables: `camelCase`
- Tests: `<archivo>.spec.ts`
