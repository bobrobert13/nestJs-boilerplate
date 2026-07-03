import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  Public,
  Roles,
  RolesGuard,
  AuthenticatedUser,
} from '@common/auth';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UsuarioRole } from './enums/usuario-role.enum';

/**
 * Minimal shape of an authenticated Express request.
 *
 * @description `JwtAuthGuard` (via `JwtStrategy.validate`) attaches a
 * `req.user` with at least `{ id, email, roles }`. Express augments
 * `Request` with this property at runtime; this interface narrows the
 * type for the controller without a global declaration merge.
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Controller for the user directory (`/usuarios`).
 *
 * @description All routes require authentication by default
 * (`@UseGuards(JwtAuthGuard, RolesGuard)` at class level). The single
 * exception is `POST /usuarios`, marked `@Public()` for self-service
 * registration. Role checks are per-endpoint via `@Roles(...)`; the
 * hierarchy-aware `RolesGuard` admits any role whose rank is >= the
 * listed role (see `UsuarioRoleHierarchy`).
 */
@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new usuario (self-service registration)' })
  @ApiResponse({
    status: 201,
    description: 'Usuario created with default role [user]',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createDto: CreateUsuarioDto) {
    return this.usuariosService.create(createDto);
  }

  @Get()
  @Roles(UsuarioRole.Admin, UsuarioRole.Manager)
  @ApiOperation({ summary: 'List all usuarios (admin or manager)' })
  @ApiResponse({ status: 200, description: 'List of usuarios' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — requires admin or manager',
  })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @Roles(UsuarioRole.User)
  @ApiOperation({ summary: 'Get a usuario by ID (any authenticated user)' })
  @ApiResponse({ status: 200, description: 'Usuario found' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UsuarioRole.User)
  @ApiOperation({ summary: 'Update a usuario (any authenticated user)' })
  @ApiResponse({ status: 200, description: 'Usuario updated' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UsuarioRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a usuario (admin only)' })
  @ApiResponse({ status: 204, description: 'Usuario deleted' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }

  @Patch(':id/roles')
  @Roles(UsuarioRole.Admin)
  @ApiOperation({
    summary: 'Replace a usuario roles (admin only, cannot target self)',
  })
  @ApiResponse({ status: 200, description: 'Roles updated' })
  @ApiResponse({ status: 400, description: 'Invalid role in payload' })
  @ApiResponse({ status: 403, description: 'Self-modification forbidden' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usuariosService.assignRoles(id, dto.roles, req.user.id);
  }
}
