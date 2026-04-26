# Inngest Service

Implementación unificada de Inngest para el nominas con soporte self-hosted.

## Configuración

### Variables de Entorno

```env
INNGEST_EVENT_KEY=tu_event_key
INNGEST_SIGNING_KEY=tu_signing_key
INNGEST_BASE_URL=https://inngest.treborjs-dev.online/
```

## Uso

### Enviar Eventos

```typescript
import { InngestService } from '../common/inngest/inngest.service';

constructor(private readonly inngest: InngestService) {}

async example() {
  await this.inngest.sendEvent(
    this.inngest.createJobStartedPayload('job-123', 'manhwaweb')
  );
}
```

### Métodos Disponibles

- `sendEvent(payload)` - Enviar un evento individual tipado
- `sendEvents(payloads)` - Enviar múltiples eventos en batch
- `sendEventRaw(name, data, id?)` - Enviar evento genérico sin tipado
- `serveHandler` - Handler para servir funciones en endpoint HTTP
- `createJobStartedPayload(jobId, strategyName)` - Crear payload de inicio
- `createJobCompletedPayload(jobId, strategyName, resultCount?)` - Crear payload de completado
- `createJobFailedPayload(jobId, strategyName, error)` - Crear payload de fallo
- `createChapterProcessedPayload(jobId, chapterId, chapterTitle, pagesScraped)` - Crear payload de capítulo procesado
- `sendHolaInngest(message?)` - Enviar evento de prueba HOLA INNGEST

## Funciones Registradas

Las funciones están definidas en `functions/index.ts`:

1. **scrapping-job-monitor** - Monitorea jobs iniciados
2. **scrapping-completion-handler** - Maneja completación de jobs
3. **scrapping-failure-handler** - Maneja fallos de jobs
4. **daily-scrapping-report** - Reporte diario (cron: 9 AM)
5. **hola-inngest-function** - Función de prueba HOLA INNGEST

## Registro de Funciones en Producción

El endpoint `/api/inngest` ya está configurado para servir las funciones automáticamente.

## Endpoints

| Endpoint                           | Método | Descripción                |
| ---------------------------------- | ------ | -------------------------- |
| `/api/inngest`                     | ALL    | Sync de funciones Inngest  |
| `/api/inngest-events/hola-inngest` | POST   | Enviar evento HOLA INNGEST |

## Eventos Disponibles

- `scrapping/job.started` - Job iniciado
- `scrapping/job.completed` - Job completado exitosamente
- `scrapping/job.failed` - Job falló
- `scrapping/chapter.processed` - Capítulo procesado
- `scrapping/hola-inngest` - Evento de prueba

## Arquitectura

El servicio es unificado y global:

- **InngestService**: Único servicio para toda la lógica de Inngest
- **InngestModule**: Módulo global que exporta el servicio
- **InngestServeModule**: Módulo que importa InngestModule y registra controllers

```typescript
// En tu módulo principal
import { InngestModule } from './common/inngest/inngest.module';

@Module({
  imports: [InngestModule],
})
export class AppModule {}
```
