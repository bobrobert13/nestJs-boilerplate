import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AssignRolesDto } from '../dto/assign-roles.dto';
import { UsuarioRole } from '../enums/usuario-role.enum';

/**
 * Helper: run the same validation pipeline as the global ValidationPipe.
 * `plainToInstance` + `validateOrReject` mirrors the pipe's behavior
 * (transform → validate → reject), without needing the NestJS container.
 */
async function runValidation(plain: unknown): Promise<AssignRolesDto> {
  const instance = plainToInstance(AssignRolesDto, plain);
  await validateOrReject(instance);
  return instance;
}

async function runValidationExpectingFailure(
  plain: unknown,
): Promise<unknown[]> {
  const instance = plainToInstance(AssignRolesDto, plain);
  try {
    await validateOrReject(instance);
    throw new Error('expected validateOrReject to reject, but it resolved');
  } catch (errors) {
    return Array.isArray(errors) ? errors : [errors];
  }
}

describe('AssignRolesDto', () => {
  describe('valid input', () => {
    it('accepts roles: [UsuarioRole.Manager]', async () => {
      // The happy path: a single known role passes all three constraints.
      const dto = await runValidation({ roles: [UsuarioRole.Manager] });
      expect(dto.roles).toEqual([UsuarioRole.Manager]);
    });

    it('accepts a multi-role array of known values', async () => {
      // Multiple roles are allowed — the DTO is a complete replacement
      // set, not an additive patch.
      const dto = await runValidation({
        roles: [UsuarioRole.Admin, UsuarioRole.Manager],
      });
      expect(dto.roles).toEqual([UsuarioRole.Admin, UsuarioRole.Manager]);
    });
  });

  describe('invalid input', () => {
    it('rejects roles: [] with the ArrayMinSize constraint', async () => {
      // An empty array cannot describe a valid user — every account must
      // have at least one role. ArrayMinSize(1) is the guard.
      const errors = await runValidationExpectingFailure({ roles: [] });
      const flat = JSON.stringify(errors);
      expect(flat).toMatch(/arrayMinSize|minItems|arrayMin/i);
    });

    it('rejects an unknown role with the IsEnum constraint', async () => {
      // 'superuser' is not in UsuarioRole — class-validator's IsEnum
      // catches it and rejects the body. The 400 from the global pipe
      // is the user-facing symptom of this.
      const errors = await runValidationExpectingFailure({
        roles: ['superuser'],
      });
      const flat = JSON.stringify(errors);
      // class-validator's IsEnum failure surfaces with `isEnum` in the
      // constraint name (or `isIn` for newer releases).
      expect(flat).toMatch(/isEnum|isIn/i);
    });

    it('rejects a non-array value (e.g., roles: "admin") with the IsArray constraint', async () => {
      // The DTO expects an array — a bare string must be rejected by
      // IsArray before any other constraint runs.
      const errors = await runValidationExpectingFailure({
        roles: 'admin' as any,
      });
      const flat = JSON.stringify(errors);
      expect(flat).toMatch(/isArray|isarray/i);
    });
  });
});
