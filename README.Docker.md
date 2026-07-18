# Docker Setup — NestJS Boilerplate Service

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Imagen de producción multi-stage (Node.js 22.18.0-slim) |
| `docker-compose.yml` | Orquestación con MongoDB + Boilerplate Service (ReplicaSet `rs0`) |
| `docker-compose.dev.yml` | Override para desarrollo (hot-reload) |
| `docker-compose.test.yml` | Override para tests efímeros (Mongo sin auth, URI sin credenciales) |
| `.dockerignore` | Exclusiones para el contexto del build |
| `.gitattributes` | Fuerza LF en scripts/configs (evita shebang `\r\n` roto) |
| `docker-test.sh` | Wrapper de `docker compose` que arma stack, hace health-check, espera y baja |
| `docker-test-ubuntu.sh` | Wrapper Ubuntu: `apt install` de docker + compose plugin si faltan |
| `README.Docker.md` | Esta documentación |

## Comandos Rápidos

### Build de Imagen

```bash
# Build manual
docker build -t boilerplate-service .

# Build con docker compose (v2)
docker compose build

# Build + up + test + cleanup automático
./docker-test.sh
```

### Test Automático (recomendado antes de subir cambios)

```bash
./docker-test.sh              # full cycle: build, up, health, 60s wait, down -v
./docker-test.sh keep         # deja contenedores arriba con logs en vivo (Ctrl+C baja)
./docker-test.sh --keep       # alias
./docker-test.sh -k           # alias
```

Overrides por env var:

```bash
APP_PORT=4000 MONGO_PORT=28018 HEALTH_TIMEOUT=120 ./docker-test.sh
```

`docker-test-ubuntu.sh` ofrece la misma API pero auto-instala `docker.io` +
`docker-compose-plugin` con apt si no están (solo en Ubuntu):

```bash
./docker-test-ubuntu.sh              # auto-bootstrap + test
./docker-test-ubuntu.sh keep         # igual con keep
```

**Qué hace el script internamente:**

1. Pre-flight checks (docker daemon, compose plugin, presencia de `Dockerfile` + compose files).
2. Auto-bump de `APP_PORT` / `MONGO_PORT` si ya están ocupados por otro stack.
3. `docker compose build` + `up -d mongodb`.
4. `rs.initiate({_id:"rs0",members:[{_id:0,host:"<rs_host>:<port>"}]})` vía
   `docker exec` — necesario porque `docker-compose.yml` arranca mongod con
   `--replSet rs0` pero no ejecuta la inicialización. El host del miembro se
   pasa como `mongodb` (nombre del servicio) para que los clientes que hacen
   discovery del RS no terminen apuntando a su propio loopback.
5. `docker compose up -d boilerplate-service`.
6. Polling al endpoint `GET /api/health` (timeout por defecto 90s).
7. Espera 60s con cuenta regresiva, o stream de logs en modo `keep`.
8. `down -v` para borrar volúmenes y evitar que el siguiente run herede un
   estado de replica set con `localhost:27017` stale.

### Ejecutar con Docker Compose

```bash
# Iniciar todos los servicios (producción)
docker compose up -d

# Ver logs
docker compose logs -f boilerplate-service

# Detener
docker compose down

# Detener y eliminar volúmenes (reset completo)
docker compose down -v
```

> El `docker compose up` a secas asume que tu `.env` define las credenciales
> de Mongo. Para un test local sin auth usá `./docker-test.sh` (que aplica
> `docker-compose.test.yml` automáticamente).

### Ejecutar Solo el Contenedor de la App

Para correr la app aislada (Mongo en otro lado), la URI **debe** llevar
`?replicaSet=rs0` o la app falla con `MongoServerSelectionError`:

```bash
docker run -d \
  --name boilerplate-service \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI='mongodb://mongodb:27017/boilerplate_db?replicaSet=rs0' \
  boilerplate-service

# O con archivo .env
docker run -d \
  --name boilerplate-service \
  --env-file .env \
  -p 3000:3000 \
  boilerplate-service
```

## Variables de Entorno

Crea un archivo `.env` en la raíz (compose lo lee automáticamente):

```env
# ── MongoDB ──
MONGO_USER=admin
MONGO_PASSWORD=admin123
MONGO_PORT=27017

# ── Application ──
APP_PORT=3000
```

## Endpoints

- **API**: <http://localhost:3000/api>
- **Swagger UI**: <http://localhost:3000/api>
- **Health**: <http://localhost:3000/api/health>  ← usado por el Dockerfile `HEALTHCHECK` y por `docker-test.sh`

## Desarrollo

### Modo Desarrollo (Hot-Reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f boilerplate-service
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
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
│   ├── database/             # MongoDB module
│   └── playwright/           # Browser automation
└── apps/
    └── nominas/
        └── src/
            ├── main.ts                 # Entry point
            ├── app.module.ts           # Root module
            └── modules/                # Business modules
                └── health/             # GET /api/health
```

## Troubleshooting

### `exec /usr/local/bin/entrypoint.sh: no such file or directory` al arrancar

El shebang del entrypoint quedó con CRLF (Windows line endings) y el kernel
resuelve `#!/bin/sh\r` como "no such file". **Fix:** ya está aplicado en
`apps/nominas/entrypoint.sh` y blindado por `.gitattributes` (`*.sh text eol=lf`).
Si vuelve a aparecer tras un merge conflict, corré
`sed -i 's/\r$//' apps/nominas/entrypoint.sh` y reconstruí.

### `npm ci` falla con `EUSAGE: ... lockfileVersion >= 1`

El `.dockerignore` original excluía `package-lock.json`. **Fix:** ya está
aplicado (línea comentada en `.dockerignore`).

### Mongo nunca queda `Healthy`

Dos causas conocidas:

1. **Auth + replica set sin keyFile** — `docker-compose.yml` define
   `MONGO_INITDB_ROOT_USERNAME/PASSWORD` y `--replSet rs0` pero sin `keyFile`.
   Mongo 7 rechaza arrancar. Para producción real, agregá un volumen con
   `keyFile` montado a `/etc/mongo-keyfile`. Para tests, `docker-test.sh`
   aplica `docker-compose.test.yml` que deshabilita la auth.
2. **`rs.initiate()` nunca se ejecuta** — `docker-compose.yml` arranca mongod
   con `--replSet rs0` pero no corre el initiate. El healthcheck de Mongo
   asume que el RS ya existe. `docker-test.sh` lo arregla vía `docker exec`.

### Cliente conecta a `127.0.0.1:27017` y rebota

El host del miembro del RS debe ser el nombre del servicio de compose
(`mongodb`), no `localhost`. Si ves este error, probablemente arrancaste
Mongo con `--replSet rs0` pero el initiate usó `localhost`. `docker-test.sh`
lo pasa explícitamente; si arrancás a mano, usá:

```bash
docker exec boilerplate-mongodb mongosh --quiet --eval \
  'rs.initiate({_id:"rs0",members:[{_id:0,host:"mongodb:27017"}]})'
```

### Playwright en el contenedor

La imagen incluye Chromium pre-instalado en `/opt/playwright/browsers`. El
entrypoint fija permisos y `PLAYWRIGHT_BROWSERS_PATH` automáticamente.

```bash
docker exec boilerplate-service npx playwright --version
docker exec boilerplate-service ls /opt/playwright/browsers
docker exec -it boilerplate-service sh
```

### Puerto ya en uso

`docker-test.sh` auto-bumpea `APP_PORT` y `MONGO_PORT` si están ocupados.
Para `docker compose` a secas, cambiá en `.env`:

```env
APP_PORT=3001
MONGO_PORT=27018
```

## Limpieza

```bash
# Bajar el stack
docker compose down -v

# Eliminar imagen
docker rmi boilerplate-service

# Eliminar volúmenes nombrados manualmente (si los creaste con docker run)
docker volume rm boilerplate-service_mongodb_data
```

## Notas

- **Node.js**: 22.18.0
- **Base**: Debian Bookworm (slim)
- **Tamaño**: ~3.2 GB (incluye Chromium para Playwright)
- **Usuario**: `nodejs` (non-root, UID 1001)
- **MongoDB**: ReplicaSet `rs0` requerido (la app usa transacciones)
