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

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  // eslint-disable-next-line no-unused-vars -- NestJS DI parameter property, used via this.usuariosService
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
  create(@Body() createDto: CreateUsuarioDto) {
    return this.usuariosService.create(createDto);
  }

  /** Admin-only CRUD operations. */
  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Get all usuarios (admin)' })
  @ApiResponse({ status: 200, description: 'List of usuarios' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires admin role' })
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
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}
