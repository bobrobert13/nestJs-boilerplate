# Commands, Scripts & Deployment

> Everyday commands, Docker workflows, and production deployment references.

---

## Quick Commands

| Task | Comando |
|------|---------|
| Dev Server | `npm run start:dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test Unit | `npm run test` |
| Test Single | `npm run test -- path/to/file.spec.ts` |
| Test E2E | `npm run test:e2e` |
| Test Coverage | `npm run test:cov` |
| Format | `npm run format` |
| Prod Start | `npm run start:prod` |

---

## Docker

```bash
# Build + Run
docker build -t boilerplate-service .
docker-compose up -d

# Dev con hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Test automático
./docker-test.sh
```

**Ver:** [`README.Docker.md`](../README.Docker.md) para documentación completa.

---

## Deployment Endpoints

| Endpoint | URL |
|----------|-----|
| API Base | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/api` |
| Health Check | `http://localhost:3000/api/usuarios` |


---

## Production Checklist

- [ ] `JWT_SECRET` configurado con valor seguro (min 32 chars)
- [ ] MongoDB connection string con credenciales
- [ ] `RESEND_API_KEY` configurada (si se usa email)
- [ ] `npm run build` exitoso
- [ ] `npm run lint` sin errores
- [ ] `npm run test` sin fallos
- [ ] Swagger accesible en `/api`
- [ ] Health check responde 200
- [ ] Docker image build exitoso
- [ ] Playwright browsers instalados en la imagen
- [ ] Reemplazar auth stub (`demo@example.com`) si está en producción

---

## Production Notes

- **Playwright:** Chromium instalado en `/opt/playwright/browsers` dentro del contenedor Docker
- **MongoDB:** Requiere ReplicaSet (`rs0`) para transacciones. El docker-compose lo configura automáticamente
- **Auth:** El módulo `@common/auth` actualmente tiene un stub de demo. NO usar en producción sin implementar un `UserService` real
- **Usuario:** La imagen Docker corre como `nodejs` (non-root, UID 1001)
