import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { RolesGuard } from '../../security/guards/roles.guard';
import { Roles } from '../../security/decorators/roles.decorator';
import { UsuariosAdminService } from '../../providers/usuarios-admin.service';
import {
  CreateUsuarioDto,
  UpdateEstadoUsuarioDto,
  UpdateUsuarioDto,
} from '../../dto/usuario-admin.dto';

@ApiTags('Admin - Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsuariosAdminController {
  constructor(private readonly usuariosService: UsuariosAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario (estudiante o administrador)' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar datos de un usuario' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.usuariosService.update(id, dto, req.user.id);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Activar o desactivar un usuario' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoUsuarioDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.usuariosService.cambiarEstado(
      id,
      dto.estadoAcademico,
      req.user.id,
    );
  }
}
