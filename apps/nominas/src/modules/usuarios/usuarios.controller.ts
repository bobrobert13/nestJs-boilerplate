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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new usuario' })
  @ApiResponse({ status: 201, description: 'Usuario created successfully' })
  @ApiResponse({ status: 409, description: 'Usuario already exists' })
  create(@Body() createDto: CreateUsuarioDto) {
    return this.usuariosService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all usuarios' })
  @ApiResponse({ status: 200, description: 'List of usuarios' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a usuario by ID' })
  @ApiResponse({ status: 200, description: 'Usuario found' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a usuario' })
  @ApiResponse({ status: 200, description: 'Usuario updated' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a usuario' })
  @ApiResponse({ status: 204, description: 'Usuario deleted' })
  @ApiResponse({ status: 404, description: 'Usuario not found' })
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}
