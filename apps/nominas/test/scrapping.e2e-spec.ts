import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ScrappingModule } from '../src/scrapping/scrapping.module';
import { OrchestratorService } from '../src/scrapping/strategies/orchestrator/orchestrator.service';
import { ManhwawebStrategy } from '../src/scrapping/strategies/manhwaweb/manhwaweb.strategy';
import { ManhwawebAdapter } from '../src/common/adapters/manhwaweb.adapter';

describe('Scrapping Service E2E', () => {
  let app: INestApplication;
  let orchestratorService: OrchestratorService;
  let manhwawebStrategy: ManhwawebStrategy;
  let manhwawebAdapter: ManhwawebAdapter;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ScrappingModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    orchestratorService = module.get<OrchestratorService>(OrchestratorService);
    manhwawebStrategy = module.get<ManhwawebStrategy>(ManhwawebStrategy);
    manhwawebAdapter = module.get<ManhwawebAdapter>(ManhwawebAdapter);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET / (Health Check)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('strategies');
          expect(Array.isArray(res.body.strategies)).toBe(true);
        });
    });
  });

  describe('GET /strategies', () => {
    it('should return list of available strategies', () => {
      return request(app.getHttpServer())
        .get('/strategies')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);

          const manhwaweb = res.body.find(
            (s: { name: string }) => s.name === 'manhwaweb',
          );
          expect(manhwaweb).toBeDefined();
          expect(manhwaweb).toHaveProperty('site', 'manhwaweb.com');
          expect(manhwaweb).toHaveProperty('baseUrl', 'https://manhwaweb.com');
        });
    });
  });

  describe('POST /manhwaweb/series', () => {
    it('should return scraping result structure', () => {
      return request(app.getHttpServer())
        .post('/manhwaweb/series')
        .send({ slug: 'test-series' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('metadata');
          expect(res.body.metadata).toHaveProperty('url');
          expect(res.body.metadata).toHaveProperty('timestamp');
          expect(res.body.metadata).toHaveProperty('duration');
        });
    });
  });

  describe('POST /manhwaweb/search', () => {
    it('should return search result structure', () => {
      return request(app.getHttpServer())
        .post('/manhwaweb/search')
        .send({ query: 'test' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('metadata');
          expect(res.body.metadata).toHaveProperty('url');
          expect(res.body.metadata).toHaveProperty('timestamp');
          expect(res.body.metadata).toHaveProperty('duration');
        });
    });
  });

  describe('Service Initialization', () => {
    it('should have ManhwawebStrategy registered', () => {
      expect(orchestratorService.hasStrategy('manhwaweb')).toBe(true);
    });

    it('should have ManhwawebStrategy with correct properties', () => {
      expect(manhwawebStrategy.name).toBe('manhwaweb');
      expect(manhwawebStrategy.site).toBe('manhwaweb.com');
      expect(manhwawebStrategy.baseUrl).toBe('https://manhwaweb.com');
    });

    it('should have ManhwawebAdapter registered', () => {
      expect(manhwawebAdapter.name).toBe('manhwaweb');
    });

    it('should return correct available strategies', () => {
      const strategies = orchestratorService.getAvailableStrategies();
      expect(strategies).toContain('manhwaweb');
    });

    it('should return correct strategy details', () => {
      const details = orchestratorService.getStrategyDetails('manhwaweb');
      expect(details).toEqual({
        name: 'manhwaweb',
        site: 'manhwaweb.com',
        baseUrl: 'https://manhwaweb.com',
      });
    });
  });
});
