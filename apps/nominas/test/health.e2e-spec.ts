import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, teardownTestApp } from './utils';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  }, 120_000);

  afterAll(async () => {
    await teardownTestApp(app);
  }, 60_000);

  it('GET /api/health → 200 with status ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok' });
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('uptime');
  });

  it('GET /api/health is public — no JWT required', async () => {
    // No Authorization header: the global JwtAuthGuard must skip @Public() routes.
    const res = await request(app.getHttpServer()).get('/api/health');

    expect(res.status).toBe(200);
  });
});
