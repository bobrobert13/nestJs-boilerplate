import {
  Controller,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '@common/auth';
import { UsuariosService } from '../usuarios.service';
import { UpdateRolesDto } from '../dto/update-roles.dto';

interface AuditEntry {
  actorId: string;
  action: string;
  targetId: string;
  before: unknown;
  after: unknown;
  at: Date;
}

/**
 * PR5 / H1 / REQ-usuarios-2 â€” admin-only role updates with audit.
 *
 * In-process audit log; production deployments MUST wire `AuditService`
 * for durable storage. This controller writes to the application logger
 * as a minimum compliance signal.
 */
@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosRolesController {
  private readonly logger = new Logger(UsuariosRolesController.name);

  constructor(private readonly _usuariosService: UsuariosService) {}

  @Put(':id/roles')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a usuario roles (admin only, audited)',
  })
  @ApiResponse({ status: 200, description: 'Roles updated' })
  @ApiResponse({ status: 400, description: 'Invalid role value' })
  @ApiResponse({ status: 403, description: 'Forbidden â€” not an admin' })
  async updateRoles(
    @Param('id') id: string,
    @Body() dto: UpdateRolesDto,
    // Replaced by the JWT strategy; kept loose-typed because @common/auth
    // already enforces the shape via JwtAuthGuard.
    actor: { id: string; roles?: string[] },
  ) {
    if (!actor?.roles?.includes('admin')) {
      throw new ForbiddenException('Admin role required');
    }
    const before = await this._usuariosService.getRoles(id);
    const after = await this._usuariosService.setRoles(id, dto.roles);

    const entry: AuditEntry = {
      actorId: actor.id,
      action: 'roles.update',
      targetId: id,
      before,
      after,
      at: new Date(),
    };
    this.logger.log(`AUDIT ${JSON.stringify(entry)}`);

    return {
      success: true,
      data: { id, roles: after.roles },
    };
  }
}
