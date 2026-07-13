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

Crea un archivo `.env` en la raíz:

```env
# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=admin123
MONGO_PORT=27017

# Application
APP_PORT=3000

```

## Endpoints

- **API**: http://localhost:3000/api
- **Swagger**: http://localhost:3000/api/docs
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

### Diferencias Dev vs Prod

| Característica | Dev                | Prod             |
| -------------- | ------------------ | ---------------- |
| **Hot Reload** | ✅ Activado        | ❌ Desactivado   |
| **Debug Port** | ✅ 9229            | ❌ Cerrado       |
| **Playwright** | Headless=false     | Headless=true    |
| **Logs**       | Verbose            | Minimal          |
| **Source**     | Volúmenes montados | Copiado en build |

## Estructura del Proyecto en Docker

```
boilerplate-service/
├── packages/                 # Shared packages (@common/*)
│   ├── database/           # MongoDB module
│   └── playwright/         # Browser automation
└── apps/
    └── nominas/
        └── src/
            ├── main.ts                 # Entry point
            ├── app.module.ts          # Root module
            └── modules/               # Business modules
                └── usuarios/          # Example CRUD module
```

## Troubleshooting

### Playwright en el Servidor

**Sí, Playwright se ejecuta fácilmente desde el contenedor.** La imagen incluye Chromium pre-instalado.

#### Comandos útiles:

```bash
# Verificar Playwright instalado
docker exec boilerplate-service npx playwright --version

# Ver browsers instalados
docker exec boilerplate-service ls /root/.cache/ms-playwright/

# Ejecutar en modo interactivo (dev)
docker exec -it boilerplate-service sh
```

### MongoDB connection failed

Verifica que MongoDB esté healthy:

```bash
docker-compose ps
docker-compose logs mongodb
```

### Puerto ya en uso

Cambia el puerto en `.env`:

```env
APP_PORT=3001
```

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