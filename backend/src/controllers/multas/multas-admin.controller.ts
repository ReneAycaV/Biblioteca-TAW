import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { RolesGuard } from '../../security/guards/roles.guard';
import { Roles } from '../../security/decorators/roles.decorator';
import { MultasService } from '../../providers/multas.service';
import {
  CondonarMultaDto,
  ResolverEstadoLibroDto,
} from '../../dto/multa-admin.dto';

@ApiTags('Admin - Multas')
@ApiBearerAuth()
@Controller('admin/multas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class MultasAdminController {
  constructor(private readonly multasService: MultasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las multas del sistema' })
  findAll() {
    return this.multasService.getTodasMultasAdmin();
  }

  @Patch(':id/resolver')
  @ApiOperation({
    summary: 'Registrar si el libro fue devuelto en buen estado o se perdió',
  })
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverEstadoLibroDto,
  ) {
    return this.multasService.resolverEstadoLibroAdmin(id, dto.estado);
  }

  @Patch(':id/condonar')
  @ApiOperation({ summary: 'Condonar (perdonar) una multa pendiente' })
  condonar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CondonarMultaDto,
  ) {
    return this.multasService.condonarMultaAdmin(id, dto.motivo);
  }
}
