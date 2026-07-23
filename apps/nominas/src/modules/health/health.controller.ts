import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/auth';

/**
 * Lightweight health-check endpoint for orchestrators, load balancers,
 * and container health probes (Docker HEALTHCHECK, Kubernetes liveness).
 *
 * Returns HTTP 200 when the process is alive and accepting requests.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  /** Returns server health status for orchestrators and container probes. */
  @ApiOperation({ summary: 'Health check â€” returns server uptime and status' })
  @ApiResponse({
    status: 200,
    description: 'Server is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600.5 },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
