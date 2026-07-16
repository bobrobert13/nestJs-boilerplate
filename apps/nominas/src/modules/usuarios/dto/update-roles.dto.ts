import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsIn } from 'class-validator';

/**
 * PR5 / H1 / REQ-usuarios-2 — body for `PUT /usuarios/:id/roles`.
 * Each role MUST be from the allow-list; the entire update is rejected on
 * any unsupported value (no partial write).
 */
export class UpdateRolesDto {
  @ApiProperty({
    example: ['user', 'admin'],
    description: 'User roles (must be from the allow-list)',
  })
  @ArrayNotEmpty()
  @IsIn(['user', 'admin'], { each: true })
  roles!: ('user' | 'admin')[];
}
