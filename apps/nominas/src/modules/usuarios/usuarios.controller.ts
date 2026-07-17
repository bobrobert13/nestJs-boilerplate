import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public, Roles } from '@common/auth';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FindUsuariosDto } from './dto/find-usuarios.dto';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /** Public — anyone can register. PR5 / M3: response shape is the same
   *  whether or not the email already exists (no enumeration). */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new usuario (public registration)',
    description:
      'Returns the same HTTP 201 response shape regardless of email existence to prevent email enumeration.',
  })
  @ApiResponse({ status: 201, description: 'Usuario registration result' })
  /** create (see class JSDoc for context). */
  create(@Body() createDto: CreateUsuarioDto) {
    return this.usuariosService.create(createDto);
  }

  /**
   * M2 / hardening-medium-low — paginated list. Returns
   * `{ data, total, page, limit }`. The legacy `GET /usuarios`
   * array endpoint above is preserved for one minor release per
   * REQ-pagination-4.
   */
  @Roles('admin')
  @Get('page')
  @ApiOperation({ summary: 'Get paginated usuarios (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of usuarios (data, total, page, limit)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires admin role' })
  @ApiResponse({ status: 400, description: 'Invalid page/limit' })
  /** findAllPaged (see class JSDoc for context). */
  findAllPaged(@Query() query: FindUsuariosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    return this.usuariosService.findAllPaged(skip, limit);
  }

  /** Admin-only CRUD operations. */
  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Get all usuarios (admin, deprecated)' })
  @ApiResponse({ status: 200, description: 'List of usuarios' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires admin role' })
  /** findAll (see class JSDoc for context). */
  findAll() {
    return this.usuariosService.findAll();
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get a usuario by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Usuario found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires admin role' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  /** findOne (see class JSDoc for context). */
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a usuario (admin)' })
  @ApiResponse({ status: 200, description: 'Usuario updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires admin role' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  /** update (see class JSDoc for context). */
  update(@Param('id') id: string, @Body() updateDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateDto);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a usuario (admin)' })
  @ApiResponse({ status: 204, description: 'Usuario deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires admin role' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  /** remove (see class JSDoc for context). */
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}
