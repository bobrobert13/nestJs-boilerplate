import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum } from 'class-validator';
import { UsuarioRole } from '../enums/usuario-role.enum';

/**
 * Body for `PATCH /usuarios/:id/roles` (admin-only).
 *
 * @description Replaces the target user's roles with the provided array.
 * Validated at the request boundary:
 * - `IsArray` rejects non-array bodies.
 * - `ArrayMinSize(1)` rejects empty arrays (a user without roles cannot
 *   authenticate against any protected endpoint).
 * - `IsEnum(UsuarioRole, { each: true })` rejects unknown role strings;
 *   class-validator throws `BadRequestException` (400) natively, matching
 *   the spec's "Invalid role is rejected" scenario.
 *
 * The self-modification rule is enforced in the SERVICE layer via
 * `assertCanModifyOtherRoles` from `@common/auth` (data concern, not guard).
 */
export class AssignRolesDto {
  @ApiProperty({
    enum: UsuarioRole,
    isArray: true,
    example: [UsuarioRole.Manager],
    description: 'Complete replacement set of roles for the target user',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(UsuarioRole, { each: true })
  roles: UsuarioRole[];
}
