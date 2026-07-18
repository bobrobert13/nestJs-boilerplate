import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DynamicSchemaController } from './dynamic-schema.controller';
import { DynamicSchemaService } from './services/dynamic-schema.service';
import { SchemaRegistryService } from './services/schema-registry.service';
import { JwtAuthGuard } from '@common/auth';
import { RolesGuard } from '@common/auth';
import { CompileSchemaDto } from './dto/generate-schema.dto';

/**
 * L9 / hardening-medium-low — explicit authorization coverage.
 *
 * REQ-dynschema-1: class-level @Roles('admin') on DynamicSchemaController.
 * AC-dynschema-2: admin-only routes return 403 for non-admin JWTs.
 *
 * The controller is wired under (JwtAuthGuard, RolesGuard) at class level.
 * For this unit test we replace JwtAuthGuard with a passthrough and use the
 * real RolesGuard (with a real Reflector) so the @Roles metadata is enforced.
 */
describe('DynamicSchemaController — authorization (L9)', () => {
  function buildContext(
    user: { id: string; roles: string[] },
    handler: Function,
  ) {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => handler,
      getClass: () => DynamicSchemaController,
    } as unknown as ExecutionContext;
  }

  let moduleRef: TestingModule;
  let controller: DynamicSchemaController;
  let rolesGuard: RolesGuard;
  let dynamicSchemaService: jest.Mocked<DynamicSchemaService>;
  let registryService: jest.Mocked<SchemaRegistryService>;

  beforeEach(async () => {
    dynamicSchemaService = {
      compileSchema: jest.fn().mockResolvedValue({
        success: true,
        collectionName: 'test_coll',
      }),
    } as any;
    registryService = {
      list: jest.fn().mockResolvedValue([]),
      unregister: jest.fn().mockResolvedValue({ ok: true }),
    } as any;

    moduleRef = await Test.createTestingModule({
      controllers: [DynamicSchemaController],
      providers: [
        { provide: DynamicSchemaService, useValue: dynamicSchemaService },
        { provide: SchemaRegistryService, useValue: registryService },
        Reflector,
      ],
    })
      // Replace the JWT guard with a passthrough so the test only exercises
      // the RolesGuard behavior against the controller's @Roles metadata.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(DynamicSchemaController);
    rolesGuard = moduleRef.get(RolesGuard);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('returns 403 for a non-admin POST to /dynamic-schema/compile', () => {
    const ctx = buildContext(
      { id: 'u-1', roles: ['user'] },
      controller.compileSchema,
    );
    // RolesGuard returns false for non-admin → NestJS converts to HTTP 403.
    expect(rolesGuard.canActivate(ctx)).toBe(false);
  });

  it('allows an admin to pass the RolesGuard for /dynamic-schema/compile', () => {
    const ctx = buildContext(
      { id: 'u-2', roles: ['admin'] },
      controller.compileSchema,
    );
    expect(rolesGuard.canActivate(ctx)).toBe(true);
  });

  it('controller method delegates to DynamicSchemaService.compileSchema for an admin request', async () => {
    const dto: CompileSchemaDto = {
      schema: {
        collectionName: 'test_coll',
        fields: [{ name: 'foo', type: 'string' }],
      } as any,
      collectionName: 'test_coll',
    };
    const result = await controller.compileSchema(dto);
    expect(result).toEqual({
      collectionName: 'test_coll',
      success: true,
    });
    expect(dynamicSchemaService.compileSchema).toHaveBeenCalledWith(
      dto.schema,
      dto.collectionName,
    );
  });
});
