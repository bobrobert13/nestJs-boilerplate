# Docker Setup - NestJS Boilerplate Service

## Archivos

- **Dockerfile** - Imagen de producción multi-stage (Node.js 22.18.0-slim)
- **docker-compose.yml** - Orquestación con MongoDB y Boilerplate Service
- **docker-compose.dev.yml** - Override para desarrollo (hot-reload)
- **.dockerignore** - Exclusiones para el build
- **.env.docker** - Template de variables de entorno
- **docker-test.sh** - Script de prueba de build
- **README.Docker.md** - Esta documentación

## Comandos Rápidos

### Build de Imagen

```bash
# Build manual
docker build -t boilerplate-service .

# Build con docker-compose
docker-compose build

# Build y test automático
./docker-test.sh
```

### Test Automático

El script `docker-test.sh` construye, prueba y limpia automáticamente:

```bash
# Ejecutar test completo (espera 60 segundos antes de limpiar)
./docker-test.sh

# Ejecutar y mantener contenedor hasta Ctrl+C
./docker-test.sh keep

# Opciones
./docker-test.sh --keep    # Mismo que 'keep'
./docker-test.sh -k        # Mismo que 'keep'
```

**Características del script:**

- ✅ Build automático de la imagen
- ✅ Health check del endpoint `/api/usuarios`
- ✅ Muestra logs en vivo
- ✅ Limpieza automática al finalizar
- ✅ Opción de mantener contenedor para debugging

### Ejecutar con Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f boilerplate-service

# Detener
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Ejecutar Solo Contenedor

```bash
# Con variables de entorno por defecto
docker run -d \
  --name boilerplate-service \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://localhost:27017/boilerplate_db \
  boilerplate-service

# Con archivo .env
docker run -d \
  --name boilerplate-service \
  --env-file .env \
  -p 3000:3000 \
  boilerplate-service
```

## Variables de Entorno

### App + MongoDB

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `PORT` | `3000` | No | Puerto del servicio |
| `MONGODB_URI` | *(ver compose)* | Sí | URI MongoDB con replicaSet=rs0 |
| `NODE_ENV` | `production` | No | production / development / test |

Compose genera `MONGODB_URI` automáticamente desde `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_PORT`.

### Auth — JWT

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `JWT_SECRET` | `change-me-in-production-min-32-chars` | **Sí** | Secreto HMAC (min 32 chars) |
| `JWT_ACCESS_TOKEN_TTL` | `900` | No | Access token TTL en segundos |
| `JWT_REFRESH_TOKEN_TTL` | `604800` | No | Refresh token TTL en segundos |
| `JWT_ISSUER` | `api-nominas` | No | Issuer claim |
| `JWT_AUDIENCE` | `api-nominas` | No | Audience claim |

### Auth — Argon2

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `ARGON2_TYPE` | `2` | No | Tipo Argon2 (2 = Argon2id) |
| `ARGON2_MEMORY_COST` | `65536` | No | Memoria en KB |
| `ARGON2_TIME_COST` | `3` | No | Iteraciones |
| `ARGON2_PARALLELISM` | `4` | No | Paralelismo |

### Auth — 2FA / TOTP

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `TWO_FACTOR_ISSUER` | `MyApp` | No | Issuer en autenticador |
| `TWO_FACTOR_ALGORITHM` | `SHA1` | No | Algoritmo HMAC |
| `TWO_FACTOR_DIGITS` | `6` | No | Dígitos del código |
| `TWO_FACTOR_PERIOD` | `30` | No | Período en segundos |
| `TWO_FACTOR_BACKUP_CODES_COUNT` | `10` | No | Cantidad de backup codes |
| `TWO_FACTOR_BACKUP_CODES_LENGTH` | `10` | No | Largo de cada backup code |

### Auth — Passkeys / WebAuthn

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `PASSKEYS_RP_ID` | `localhost` | No | Relying Party ID (dominio) |
| `PASSKEYS_RP_NAME` | `MyApp` | No | Relying Party name |
| `PASSKEYS_RP_ORIGIN` | `http://localhost:3000` | No | Origen permitido |

### Auth — Magic Link

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `MAGIC_LINK_ENABLED` | `true` | No | Habilitar magic link |
| `MAGIC_LINK_TOKEN_TTL` | `300` | No | Token TTL en segundos |

### Resend (Email)

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `RESEND_API_KEY` | — | **Sí** | API key de Resend |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | No | Remitente |
| `RESEND_FROM_NAME` | `My App` | No | Nombre del remitente |
| `RESEND_REPLY_TO` | — | No | Reply-To |

### Playwright

| Variable | Default | Required | Descripción |
|----------|---------|----------|-------------|
| `PLAYWRIGHT_HEADLESS` | `true` | No | Modo headless |
| `PLAYWRIGHT_TIMEOUT` | `30000` | No | Timeout por operación (ms) |
| `PLAYWRIGHT_RETRIES` | `3` | No | Reintentos por operación |

> El template `.env.docker` contiene solo las vars mínimas para desarrollo.

## Dependencias Externas

El servicio depende de estos servicios externos (no incluidos en docker-compose):

| Servicio | Tipo | Env Key | Puerto |
|----------|------|---------|--------|
| **Resend API** | Externo (SaaS) | `RESEND_API_KEY` | — |
| **AI Providers** | Externo (OpenAI, Anthropic, Gemini) | Config via `@common/ai` | — |

Cada uno requiere API keys configuradas fuera del Docker host. Sin ellas, las funciones correspondientes fallan con error de autenticación.

## Endpoints

- **API**: http://localhost:3000/api
- **Swagger**: http://localhost:3000/api
- **Health**: http://localhost:3000/api/usuarios

## Desarrollo

### Modo Desarrollo (Hot-Reload)

```bash
# Iniciar con docker-compose (RECOMENDADO)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ver logs en tiempo real
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f boilerplate-service

# Detener
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### Ejecutar contenedor dev manualmente

```bash
# Ejecutar con volúmenes para hot-reload
docker run -d \
  --name boilerplate-dev \
  -p 3000:3000 \
  -p 9229:9229 \
  -e NODE_ENV=development \
  -e PLAYWRIGHT_HEADLESS=false \
  --env-file .env.docker \
  -v $(pwd):/app \
  -v /app/node_modules \
  boilerplate-service
```

### Entrypoint

El contenedor arranca via `apps/nominas/entrypoint.sh`:

1. Valida que `dist/apps/nominas/main` exista (build)
2. Configura `PLAYWRIGHT_BROWSERS_PATH` (default `/opt/playwright/browsers`)
3. Verifica browsers instalados, corrige permisos si necesario
4. Ejecuta `exec "$@"` → CMD (`node dist/apps/nominas/main`)

```bash
# Ver entrada en caliente
docker exec boilerplate-service cat /usr/local/bin/entrypoint.sh

# Debug permisos Playwright
docker exec boilerplate-service ls -la /opt/playwright/browsers
```

Playwright browsers se instalan en `/opt/playwright/browsers` (no `/root/.cache/ms-playwright/`). El usuario `nodejs` (UID 1001, non-root) tiene permisos.

### Diferencias Dev vs Prod

| Característica | Dev                          | Prod                           |
| -------------- | ---------------------------- | ------------------------------ |
| **Target Stage** | `development` (multi-stage) | `production` (default)        |
| **Hot Reload** | ✅ Activado                  | ❌ Desactivado                 |
| **Debug Port** | ✅ 9229                      | ❌ Cerrado                     |
| **Entrypoint** | `npm run start:dev`          | `entrypoint.sh` + `node dist/...` |
| **Playwright** | Headless=false               | Headless=true                  |
| **Logs**       | Verbose                      | Minimal                        |
| **Source**     | Volúmenes montados           | Copiado en build               |

> `docker-compose.dev.yml` usa `target: development` para hot-reload. Sin override, build apunta a stage production.

## Estructura del Proyecto en Docker

```
boilerplate-service/
├── packages/                 # Shared packages (@common/*)
│   ├── common/             # Utilities, BaseAdapter, HttpError
│   ├── database/           # MongoDB + transactions
│   ├── auth/               # JWT, 2FA, Passkeys, Magic Link
│   ├── ai/                 # Multi-provider AI (OpenAI, Anthropic, Gemini...)
│   ├── http/               # HTTP client + image download
│   ├── inngest/            # Task queue (próxima eliminación)
│   ├── playwright/         # Browser automation
│   ├── resend/             # Email + Newsletter
│   ├── documents/          # PDF/DOCX extraction
│   └── serve-static/       # EJS templates + TailwindCSS
└── apps/
    └── nominas/
        └── src/
            ├── main.ts                 # Entry point
            ├── app.module.ts          # Root module
            └── modules/               # Business modules
                ├── usuarios/          # Example CRUD
                └── dynamic-schema/    # AI schema generator
```

> Los packages se resuelven via `nest-cli.json` y `tsconfig.json` paths. No requieren instalación separada.

## Troubleshooting

### Playwright en el Servidor

Playwright funciona dentro del contenedor. Chromium pre-instalado en `/opt/playwright/browsers` (no `/root/.cache/ms-playwright/`).

```bash
# Verificar Playwright
docker exec boilerplate-service npx playwright --version

# Ver browsers instalados
docker exec boilerplate-service ls /opt/playwright/browsers

# Shell interactivo
docker exec -it boilerplate-service sh

# Corregir permisos si falla
docker exec boilerplate-service find /opt/playwright -name "chrome-headless-shell" -type f -exec chmod +x {} \;
```

### Resend no envía emails

`RESEND_API_KEY` no configurada o inválida.

```bash
# Verificar que la variable existe
docker exec boilerplate-service env | grep RESEND

# Log de error típico: "Resend API key is not configured"
docker logs boilerplate-service | grep Resend
```

### MongoDB connection failed

```bash
docker-compose ps
docker-compose logs mongodb
```

### Puerto ya en uso

```env
APP_PORT=3001
```

### Auth no funciona (stub demo)

Auth usa stub hardcodeado `demo@example.com` / `demo123`. No reemplaza sin UserService real. En producción, reemplazar `@common/auth` con implementación real.

### Imagen muy grande (~3.2GB)

Chromium (Playwright) agrega ~1.5GB. Si no usas Playwright, puedes:

1. Eliminar stage de instalación de Chromium del Dockerfile
2. Comentar línea `npx playwright install chromium`
3. Imagen baja a ~1.5GB

## Limpieza

```bash
# Eliminar contenedores
docker-compose down

# Eliminar imagen
docker rmi boilerplate-service

# Eliminar volúmenes
docker volume rm boilerplate-service_mongodb_data
```

## Notas

- **Node.js**: 22.18.0
- **Base**: Debian Bookworm (slim)
- **Tamaño**: ~3.2GB (incluye Chromium para Playwright)
- **Usuario**: nodejs (non-root, UID 1001)