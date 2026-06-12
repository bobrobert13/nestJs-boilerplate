# BOILERPLATE.md - NestJS Boilerplate Service

> Boilerplate para servicios NestJS con MongoDB, Inngest, Playwright y patrones extensible.

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Packages Compartidos](#4-packages-compartidos)
5. [Módulo de Ejemplo: Usuarios](#5-módulo-de-ejemplo-usuarios)
6. [Cómo Crear un Nuevo Módulo](#6-cómo-crear-un-nuevo-módulo)
7. [Patrones de Diseño](#7-patrones-de-diseño)
8. [Configuración](#8-configuración)
9. [Scripts y Comandos](#9-scripts-y-comandos)
10. [Extracción de Packages](#10-extracción-de-packages)

---

## 1. Descripción General

Este boilerplate proporciona una base sólida para construir servicios NestJS con:

- **MongoDB** para persistencia de datos
- **Inngest** para tareas en background y eventos
- **Playwright** para automatización web
- **Patrones estratégicos** para lógica de negocio extensible

El proyecto sigue una arquitectura **monorepo** con **packages** que permite separar servicios reutilizables de la lógica de negocio.

---

## 2. Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11.x | Framework principal |
| TypeScript | 5.7.x | Tipado estático |
| MongoDB/Mongoose | 9.4.x | Base de datos |
| Inngest | 4.2.x | Cola de tareas |
| Playwright | 1.59.x | Automatización web |
| Swagger | 11.3.x | Documentación API |

---

## 3. Estructura del Proyecto

```
nestJs-boilerplate/
├── packages/                    # Paquetes reutilizables
│   ├── ai/                      # Wrapper de proveedores AI (OpenAI, Anthropic, Gemini, etc.)
│   │   └── src/
│   │       ├── ai.module.ts
│   │       ├── ai.service.ts
│   │       ├── types/
│   │       │   └── ai.types.ts
│   │       ├── interfaces/
│   │       │   └── provider.interface.ts
│   │       └── providers/
│   │           └── openai-compatible.provider.ts
│   ├── auth/                    # Módulo de autenticación (JWT, 2FA, Passkeys, Magic Link)
│   │   └── src/
│   │       ├── auth.module.ts
│   │       ├── auth.service.ts
│   │       ├── magic-link.service.ts
│   │       ├── strategies/
│   │       │   ├── jwt.strategy.ts
│   │       │   └── local.strategy.ts
│   │       ├── guards/
│   │       │   ├── jwt-auth.guard.ts
│   │       │   └── roles.guard.ts
│   │       ├── decorators/
│   │       │   ├── public.decorator.ts
│   │       │   └── roles.decorator.ts
│   │       ├── two-factor/
│   │       └── passkeys/
│   ├── common/                  # Utilidades comunes
│   │   ├── src/
│   │   │   ├── base-adapter.interface.ts
│   │   │   ├── database-exception.filter.ts
│   │   │   └── http-error.handler.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── database/                # Módulo MongoDB
│   │   ├── src/
│   │   │   ├── database.module.ts
│   │   │   ├── database.service.ts
│   │   │   ├── config/database.config.ts
│   │   │   └── transaction/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── documents/              # Extracción de texto de PDF y DOCX
│   │   ├── src/
│   │   │   ├── document.module.ts
│   │   │   ├── services/
│   │   │   │   ├── pdf.service.ts
│   │   │   │   ├── docx.service.ts
│   │   │   │   └── document-processor.service.ts
│   │   │   └── interfaces/
│   │   │       └── parser.interface.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── http/                   # Cliente HTTP con soporte para descarga de imágenes
│   │   ├── src/
│   │   │   ├── http.module.ts
│   │   │   └── services/
│   │   │       ├── http.service.ts
│   │   │       └── download.service.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── inngest/                # Módulo Inngest
│   │   ├── src/
│   │   │   ├── inngest.module.ts
│   │   │   ├── inngest.service.ts
│   │   │   ├── functions/
│   │   │   └── serve/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── playwright/             # Módulo Playwright
│   │   ├── src/
│   │   │   ├── playwright.module.ts
│   │   │   ├── playwright.service.ts
│   │   │   ├── constants/
│   │   │   └── interfaces/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── resend/                 # Módulo de email via Resend API
│   │   ├── src/
│   │   │   ├── resend.module.ts
│   │   │   ├── resend.service.ts
│   │   │   ├── config/resend.config.ts
│   │   │   └── modules/newsletter/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── serve-static/            # Servido de archivos estáticos con plantillas EJS
│       ├── src/
│       │   ├── serve-static.module.ts
│       │   ├── serve-static.service.ts
│       │   └── index.ts
│       └── templates/
│
├── apps/
│   └── nominas/      # Aplicación principal
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           └── modules/
│               └── usuarios/  # Ejemplo CRUD
│
├── Dockerfile
├── docker-compose.yml
├── nest-cli.json
└── tsconfig.json
```

---

## 4. Packages Compartidos

Los packages en `packages/` son **autocontenidos y reutilizables**. Cada uno tiene su propio `package.json`, `tsconfig.json` y exports públicos.

### Usando los Packages

```typescript
// En tu AppModule
import { DatabaseModule } from '@common/database';
import { InngestModule } from '@common/inngest';
import { PlaywrightModule } from '@common/playwright';
import { DatabaseExceptionFilter } from '@common/common';
```

### 4.1 @common/database

Conexión global a MongoDB con reintentos automáticos.

```typescript
// Configuración (.env)
MONGODB_URI=mongodb://localhost:27017/mi_database
```

### 4.2 @common/inngest

Módulo global para el sistema de eventos/tareas en background.

**Endpoints:**
- `/api/inngest` - Sync de funciones Inngest
- `/api/inngest-events/hola-inngest` - Endpoint de prueba

```typescript
// Uso
constructor(private readonly inngest: InngestService) {}

async triggerJob() {
  await this.inngest.sendEvent({
    name: 'mi-servicio/job',
    data: { /* payload */ },
  });
}
```

### 4.3 @common/playwright

Servicio de navegador para automatización web.

```typescript
// Uso
constructor(private readonly playwright: PlaywrightService) {}

async scrape(url: string) {
  const page = await this.playwright.createPage(url);
  return content;
}
```

### 4.4 @common/common

Contiene filtros y adaptadores genéricos.

- `DatabaseExceptionFilter` - Maneja errores de MongoDB globalmente
- `HttpError` - Jerarquía de errores HTTP personalizada
- `BaseAdapter<T>` - Interfaz para adapters de mapeo de datos

### 4.5 @common/ai

Wrapper de proveedores AI (OpenAI, Anthropic, Gemini, Moonshot, MiniMax).

```typescript
const response = await aiService.generateText('openai', 'Hello', 'You are helpful');
```

### 4.6 @common/auth

Módulo completo de autenticación: JWT, Magic Links, OAuth, 2FA y Passkeys.

```typescript
import { AuthModule, JwtAuthGuard, Public } from '@common/auth';
```

### 4.7 @common/http

Cliente HTTP con descarga de imágenes optimizada via sharp.

```typescript
constructor(private readonly http: HttpService) {}
const image = await http.downloadImage(url);
```

### 4.8 @common/documents

Extracción de texto de PDFs y DOCXs.

```typescript
constructor(private readonly docs: DocumentProcessorService) {}
const text = await docs.extract(buffer, 'pdf');
```

### 4.9 @common/resend

Servicio de email via Resend API con módulo de newsletter.

```typescript
await resendService.sendEmail({ to: 'user@example.com', subject: 'Hi', html: '<h1>Hello</h1>' });
```

### 4.10 @common/serve-static

Servido de archivos estáticos con motor de plantillas EJS y TailwindCSS CDN.

```typescript
const html = await serveStatic.render('home', { title: 'Home', layout: 'main' });
```

---

## 5. Módulo de Ejemplo: Usuarios

El módulo `usuarios` demuestra las mejores prácticas:

```
apps/nominas/src/modules/usuarios/
├── dto/
│   ├── create-usuario.dto.ts
│   └── update-usuario.dto.ts
├── interfaces/
│   └── usuario.interface.ts
├── schemas/
│   └── usuario.schema.ts
├── usuarios.controller.ts
├── usuarios.module.ts
├── usuarios.repository.ts
└── usuarios.service.ts
```

### API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/usuarios` | Crear usuario |
| GET | `/api/usuarios` | Listar usuarios |
| GET | `/api/usuarios/:id` | Obtener usuario |
| PATCH | `/api/usuarios/:id` | Actualizar usuario |
| DELETE | `/api/usuarios/:id` | Eliminar usuario |

---

## 6. Cómo Crear un Nuevo Módulo

### Paso 1: Crear estructura de directorios

```
apps/nominas/src/modules/mi-modulo/
├── dto/
├── interfaces/
├── schemas/
├── mi-modulo.controller.ts
├── mi-modulo.module.ts
├── mi-modulo.repository.ts
└── mi-modulo.service.ts
```

### Paso 2: Definir el Schema

```typescript
@Schema({ timestamps: true })
export class MiEntidad {
  @Prop({ required: true })
  nombre: string;
}

export const MiEntidadSchema = SchemaFactory.createForClass(MiEntidad);
export type MiEntidadDocument = MiEntidad & Document;
```

### Paso 3: Crear Repository

```typescript
@Injectable()
export class MiEntidadRepository {
  constructor(
    @InjectModel(MiEntidad.name)
    private readonly model: Model<MiEntidadDocument>,
  ) {}
}
```

### Paso 4: Crear Service

```typescript
@Injectable()
export class MiEntidadService {
  constructor(private readonly repository: MiEntidadRepository) {}
}
```

### Paso 5: Crear Controller

```typescript
@ApiTags('mi-entidad')
@Controller('mi-entidad')
export class MiEntidadController {
  constructor(private readonly service: MiEntidadService) {}
}
```

### Paso 6: Registrar en Module

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: MiEntidad.name, schema: MiEntidadSchema }])],
  controllers: [MiEntidadController],
  providers: [MiEntidadRepository, MiEntidadService],
  exports: [MiEntidadService],
})
export class MiEntidadModule {}
```

---

## 7. Patrones de Diseño

### 7.1 Repository Pattern

Separa la lógica de acceso a datos.

### 7.2 Adapter Pattern

```typescript
// packages/common/src/base-adapter.interface.ts
export interface BaseAdapter<TOutput> {
  adapt(rawData: unknown): TOutput | TOutput[];
  mapFields(rawData: Record<string, unknown>, mappings: DataMapping[]): Partial<TOutput>;
  readonly name: string;
}
```

---

## 8. Configuración

### Variables de Entorno (.env)

```env
MONGODB_URI=mongodb://localhost:27017/mi_database
PORT=3000
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key
INNGEST_BASE_URL=https://inngest.treborjs-dev.online/
```

---

## 9. Scripts y Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar todo (apps + packages) |
| `npm run start:dev` | Iniciar en modo desarrollo |
| `npm run start:prod` | Iniciar en producción |
| `npm run lint` | ESLint con auto-fix |
| `npm run format` | Prettier formatting |
| `npm run test` | Ejecutar tests |
| `npm run test:e2e` | Tests E2E |

---

## 10. Extracción de Packages

Los packages en `packages/` están diseñados para ser **extraídos fácilmente** a otros proyectos.

### Para extraer un package a otro proyecto:

1. Copia la carpeta del package (ej: `packages/database/`)
2. En tu nuevo proyecto, configura el `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@common/database": ["path/to/packages/database/src/index.ts"]
    }
  }
}
```

3. Instala las dependencias del package:

```bash
cd packages/database && npm install
```

4. Importa en tu AppModule:

```typescript
import { DatabaseModule } from '@common/database';
```

### Estructura autocontenida

Cada package incluye:
- `package.json` con dependencias y exports
- `tsconfig.json` con configuración de compilación
- `src/index.ts` como punto de entrada público
- Código fuente en `src/`

---

## Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [Mongoose Docs](https://mongoosejs.com)
- [Inngest Docs](https://inngest.com/docs)
- [Playwright Docs](https://playwright.dev)
- [AGENTS.md](./AGENTS.md) - Guía para agentes

---

**Última actualización:** 2026-04-26