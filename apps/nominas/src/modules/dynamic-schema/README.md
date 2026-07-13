<!-- apps/nominas/src/modules/dynamic-schema — status: complete -->

# Modulo Dynamic Schema

Modulo de generacion dinamica de schemas Mongoose usando AI multi-provider. Pipeline end-to-end: extraer texto de un documento (PDF/DOCX) → generar schema con LLM → compilar y registrar el modelo Mongoose.

## Proposito

Permitir crear definiciones de entidades (schema Mongoose) automaticamente a partir de:

- Texto en lenguaje natural (descripcion de la entidad)
- Imagen (datos de formulario / captura)
- Documento PDF o DOCX (extrayendo texto primero)

Esto evita escribir manualmente schemas para casos repetitivos (e.g., formularios recurrentes de nominas, recibos, contratos).

## Arquitectura

```
Controller (5 endpoints POST)
       │
       ▼
DynamicSchemaService (orquesta)
       │
       ├─→ DocumentProcessorService (@common/documents)
       ├─→ AiService (@common/ai)
       └─→ SchemaCompilerService (compila + registra)
              │
              ▼
       MongoDB (Mongoose)
```

## Endpoints (Swagger: tag `dynamic-schema`)

Todos los endpoints son POST con `@HttpCode(200)` (no usan 201 por conveniencia de cliente).

### 1. `POST /api/dynamic-schema/extract`

Extrae texto de un documento PDF o DOCX enviado como base64.

Request body:
- `document: string` — documento en base64
- `format: 'pdf' | 'docx'` — formato

Response 200:
```
{ "success": true, "text": "...", "pageCount": 5, "images": [], "format": "pdf" }
```

Response 400: BaseRequestException si el formato no es soportado o el documento es corrupto.

### 2. `POST /api/dynamic-schema/generate-from-text`

Genera un schema Mongoose a partir de texto libre.

Request body:
- `text: string` — descripcion de la entidad (e.g., "Empleado con nombre, apellido, fecha de ingreso")
- `provider?: string` — proveedor AI (default: `openai`)
- `temperature?: number` — creatividad (0-1, default ~0.3 para schemas)

Response 200:
```
{ "schema": {...}, "collectionName": "empleados" }
```

### 3. `POST /api/dynamic-schema/generate-from-image`

Como el anterior pero desde una imagen (OCR + AI para inferir campos).

### 4. `POST /api/dynamic-schema/compile`

Compila y registra un `GeneratedSchema` en Mongoose.

Request body:
- `schema: GeneratedSchema` — schema generado por AI
- `collectionName: string` — nombre de la coleccion

### 5. `POST /api/dynamic-schema/pipeline`

Pipeline completo: extract + generate + compile en una sola llamada.

Request body:
- `document: string` — base64
- `format: 'pdf' | 'docx'`
- `provider?: string`
- `temperature?: number`

## Servicios Internos

### `DynamicSchemaService` (orquestador)

Coordina los tres sub-servicios. Cada metodo retorna `{ success: boolean, error?: string, ...payload }`. En el controller, si `success === false` se lanza `BadRequestException`.

### `SchemaCompilerService`

Toma un `GeneratedSchema` (de `@common/ai`) y compila a un schema Mongoose, lo registra en la conexion MongoDB activa y devuelve el modelo listo para uso.

### `DynamicSchemaRepository`

Persistencia de metadata de schemas generados (e.g., para auditoria o reproducibilidad).

### `DynamicSchemaModule`

```typescript
@Module({
  imports: [AiModule, DocumentsModule],
  controllers: [DynamicSchemaController],
  providers: [DynamicSchemaService, DynamicSchemaRepository, SchemaCompilerService],
  exports: [DynamicSchemaService],
})
export class DynamicSchemaModule {}

## Dependencias Externas

- `@common/ai` — `AiService.generateSchema()` (OpenAI/Anthropic/Gemini)
- `@common/documents` — `DocumentProcessorService.extract()`
- MongoDB activo (la conexion la provee `@common/database` via `MongooseModule.forRoot` en `AppModule`)

## Configuracion Requerida

Variables de entorno (provider por defecto `openai`):

- `OPENAI_API_KEY` (o el provider que se use)
- `MONGODB_URI` con replica set si se quiere atomicidad en `pipeline`

## Errores Comunes

| Status | Causa |
|--------|-------|
| 400 BadRequest | Provider AI no configurado, documento corrupto, formato no soportado |
| 500 Internal | Error inesperado en AI o MongoDB |
| 503 ServiceUnavailable | MongoDB down (capturado por DatabaseExceptionFilter) |

## Status

- **Documentacion**: complete
- **JSDoc**: pending (Fase 3)
- **Tests**: sin tests (recomendado agregar en sprint posterior)
