# Inngest Integration - HOLA INNGEST

## ✅ Setup Completado

### Endpoints Disponibles

1. **Inngest Functions** (para sync con el servidor Inngest):
   - URL: `http://localhost:3000/api/inngest`
   - Método: ALL (GET, POST, PUT)
   - Uso: El servidor Inngest self-hosted usa este endpoint para sincronizar las funciones

2. **Enviar Evento HOLA INNGEST**:
   - URL: `http://localhost:3000/api/inngest-events/hola-inngest`
   - Método: POST
   - Body: `{"message": "HOLA INNGEST"}`

### Pasos para Ejecutar

#### 1. Iniciar el Servidor

```bash
npm run start:dev
```

Logs esperados:

```
[Inngest] Functions served at http://localhost:3000/api/inngest
[Inngest] Events endpoint at http://localhost:3000/api/inngest-events/hola-inngest
```

#### 2. Enviar el Evento "HOLA INNGEST"

**Opción A: cURL**

```bash
curl -X POST http://localhost:3000/api/inngest-events/hola-inngest \
  -H "Content-Type: application/json" \
  -d '{"message":"HOLA INNGEST"}'
```

**Opción B: Script Node.js**

```bash
node test-inngest.js
```

**Opción C: Swagger UI**

1. Abre http://localhost:3000/api
2. Busca el endpoint `POST /api/inngest-events/hola-inngest`
3. Click en "Try it out"
4. Click en "Execute"

#### 3. Verificar en Inngest Dashboard

1. Ve a tu instancia self-hosted: https://inngest.treborjs-dev.online/
2. Navega a la sección de **Events**
3. Deberías ver el evento `scrapping/hola-inngest`
4. La función `hola-inngest-function` debería ejecutarse automáticamente

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Event sent to Inngest successfully",
  "event": {
    "name": "scrapping/hola-inngest",
    "data": {
      "message": "HOLA INNGEST",
      "timestamp": "2026-04-22T01:00:00.000Z"
    }
  }
}
```

### Función Inngest Registrada

La función `holaInngest` está definida en:
`apps/nominas/src/common/inngest/functions/index.ts`

```typescript
export const holaInngest = inngest.createFunction(
  {
    id: 'hola-inngest-function',
    name: 'Hola Inngest',
    triggers: [{ event: 'scrapping/hola-inngest' }],
  },
  async ({ event, step }) => {
    // Step 1: Process message
    const message = await step.run('process-message', async () => {
      return {
        received: event.data.message,
        timestamp: event.data.timestamp,
      };
    });

    // Step 2: Log message
    await step.run('log-message', async () => {
      console.log(`[HOLA INNGEST] ${message.received}`);
    });

    return {
      success: true,
      message: message.received,
    };
  },
);
```

### Pipeline en Inngest Dashboard

Cuando el evento se ejecuta, verás:

1. **Event**: `scrapping/hola-inngest`
2. **Function**: `hola-inngest-function`
3. **Steps**:
   - `process-message` - Procesa el mensaje recibido
   - `log-message` - Loguea el mensaje en consola
4. **Output**: `{ success: true, message: "HOLA INNGEST" }`

### Tests

Los tests unitarios y de integración están disponibles:

```bash
# Todos los tests de Inngest
npm run test -- apps/nominas/src/common/inngest/

# Solo tests de integración
npm run test -- --testNamePattern="HOLA INNGEST"
```

### Troubleshooting

**Error: fetch failed**

- Verifica que `INNGEST_BASE_URL` sea accesible
- En desarrollo, el SSL se deshabilita automáticamente

**Error: ECONNREFUSED**

- Asegúrate de que el servidor Inngest self-hosted esté corriendo
- Verifica las keys en `.env`

**La función no se ejecuta**

- Verifica que el endpoint `/api/inngest` esté registrado en tu instancia Inngest
- Revisa los logs del servidor para errores de sincronización

### Variables de Entorno Requeridas

```env
INNGEST_EVENT_KEY=tu_event_key
INNGEST_SIGNING_KEY=tu_signing_key
INNGEST_BASE_URL=https://inngest.treborjs-dev.online/
```

---

**Estado**: ✅ Funcional  
**Última Actualización**: 2026-04-22
