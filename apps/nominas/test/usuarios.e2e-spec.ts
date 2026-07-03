import {
  INestApplication,
  Module,
  ValidationPipe,
  Controller,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import * as request from 'supertest';
// Some TypeScript configs need the default import; cast so the call site
// stays clean.
const supertest = (request as any).default ?? request;
import {
  JwtAuthGuard,
  RolesGuard,
  Public,
  Roles,
  RBAC_HIERARCHY,
} from '@common/auth';
import { AssignRolesDto } from '../src/modules/usuarios/dto/assign-roles.dto';
import {
  Usuario,
  UsuarioSchema,
} from '../src/modules/usuarios/schemas/usuario.schema';
import {
  UsuarioRole,
  UsuarioRoleHierarchy,
} from '../src/modules/usuarios/enums/usuario-role.enum';
import { UsuariosRepository } from '../src/modules/usuarios/usuarios.repository';
import { UsuariosService } from '../src/modules/usuarios/usuarios.service';

/**
 * End-to-end test for the global `ValidationPipe` integration.
 *
 * @description The global pipe (wired in `main.ts` lines 18-24) is the
 * one place that enforces `AssignRolesDto` validation at the HTTP
 * boundary. This test re-creates the same `ValidationPipe` instance and
 * proves the 400 response for an unknown role — a contract the DTO unit
 * test cannot cover in isolation.
 *
 * The test uses a stripped-down test module that mirrors the production
 * controller shape: same `AssignRolesDto`, same `@Public()` / `@Roles()`
 * decorators, same guards, same `ValidationPipe` configuration. It
 * bypasses the database by overriding the Mongoose model + connection
 * tokens.
 */
@Controller('usuarios')
class TestUsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Public()
  @Roles(UsuarioRole.Admin)
  @Patch(':id/roles')
  assignRoles(@Param('id') _id: string, @Body() _dto: AssignRolesDto) {
    return { ok: true };
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
  ],
  controllers: [TestUsuariosController],
  providers: [
    UsuariosService,
    UsuariosRepository,
    { provide: RBAC_HIERARCHY, useValue: UsuarioRoleHierarchy },
  ],
})
class TestUsuariosModule {}

describe('UsuariosController (e2e — ValidationPipe)', () => {
  let app: INestApplication;

  const mockModel: any = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
  };

  // A minimal Mongoose connection stub. `MongooseModule.forFeature` only
  // uses the connection to derive model classes; we don't need a real
  // Mongo connection here.
  const mockConnection: any = {
    model: jest.fn().mockReturnValue(mockModel),
    db: {},
  };

  beforeAll(async () => {
    // The trick: register the connection in the providers list so the
    // override actually takes effect (see users.guard.spec.ts / users
    // .module.spec.ts for the same pattern). The MongooseModule.forFeature
    // inside TestUsuariosModule uses the `getConnectionToken()`-named
    // provider to derive model classes; we override that with our stub.
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TestUsuariosModule],
      providers: [
        { provide: getConnectionToken(), useValue: null },
        { provide: getModelToken(Usuario.name), useValue: null },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(getConnectionToken())
      .useValue(mockConnection)
      .overrideProvider(getModelToken(Usuario.name))
      .useValue(mockModel)
      .compile();

    app = moduleRef.createNestApplication();

    // Mirror `main.ts` lines 14-24 exactly:
    // - setGlobalPrefix('api')
    // - useGlobalPipes(new ValidationPipe({whitelist, forbidNonWhitelisted, transform}))
    app.setGlobalPrefix('api', { exclude: ['/api/inngest'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('PATCH /api/usuarios/:id/roles with an unknown role returns 400 (R2.3)', async () => {
    // 'superuser' is not in UsuarioRole — the IsEnum validator fires,
    // the pipe throws BadRequestException, and the response is 400.
    const response = await supertest(app.getHttpServer())
      .patch('/api/usuarios/abc/roles')
      .send({ roles: ['superuser'] });

    expect(response.status).toBe(400);
    // The error message includes the offending field name; the regex
    // is intentionally loose so the test doesn't break on wording
    // changes in class-validator.
    const message = JSON.stringify(response.body);
    expect(message).toMatch(/roles/);
  });
});
