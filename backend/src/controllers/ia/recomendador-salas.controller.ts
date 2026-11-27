/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { RolesGuard } from '../../security/guards/roles.guard';
import { Roles } from '../../security/decorators/roles.decorator';
import { IaConsultaDto } from '../../dto/ia-consulta.dto';
import { RecomendadorSalasService } from '../../providers/recomendador-salas.service';

@ApiTags('Recomendador inteligente (IA)')
@Controller('reserve')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RecomendadorSalasController {
  constructor(private readonly recomendadorSalas: RecomendadorSalasService) {}

  @Post('recomendar')
  @HttpCode(200)
  @Roles('ESTUDIANTE')
  @ApiOperation({
    summary: 'Recomendar salas a partir de lenguaje natural',
    description:
      'Interpreta la consulta (IA o reglas de respaldo), filtra salas libres hoy y devuelve el top 3 con puntaje y motivo. El campo "modo" indica si se usó la IA.',
  })
  @ApiResponse({ status: 200, description: 'Top 3 de salas recomendadas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Usuario sin estado académico activo o con multas impagas',
  })
  recomendar(@Body() dto: IaConsultaDto, @Req() req: any) {
    return this.recomendadorSalas.recomendar(dto.consulta.trim(), req.user.id);
  }
}
