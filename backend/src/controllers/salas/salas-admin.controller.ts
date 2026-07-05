import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { RolesGuard } from '../../security/guards/roles.guard';
import { Roles } from '../../security/decorators/roles.decorator';
import { SalasAdminService } from '../../providers/salas-admin.service';
import { UpdateSalaEstadoDto } from '../../dto/update-sala-estado.dto';

@ApiTags('Admin - Salas')
@ApiBearerAuth()
@Controller('salas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SalasAdminController {
  constructor(private readonly salasAdminService: SalasAdminService) {}

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado de sala' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateSalaEstadoDto) {
    return this.salasAdminService.updateEstado(+id, dto.estado);
  }
}
