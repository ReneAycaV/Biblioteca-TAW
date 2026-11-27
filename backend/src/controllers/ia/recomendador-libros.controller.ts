/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
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
import { IaConsultaDto } from '../../dto/ia-consulta.dto';
import { RecomendadorLibrosService } from '../../providers/recomendador-libros.service';

// IMPORTANTE: IaModule se importa antes que LibrosModule en AppModule para que
// GET /libros/recomendaciones no sea capturado por GET /libros/:id
@ApiTags('Recomendador inteligente (IA)')
@Controller('libros')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecomendadorLibrosController {
  constructor(private readonly recomendadorLibros: RecomendadorLibrosService) {}

  @Get('recomendaciones')
  @ApiOperation({
    summary: 'Libros recomendados para el usuario',
    description:
      'A partir de los préstamos del usuario ("Porque pediste X…"). Sin historial devuelve los más pedidos. Excluye libros inactivos.',
  })
  @ApiResponse({ status: 200, description: 'Lista de recomendaciones' })
  recomendaciones(@Req() req: any) {
    return this.recomendadorLibros.recomendaciones(req.user.id);
  }

  @Post('busqueda-inteligente')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Búsqueda de libros por tema en lenguaje natural',
    description:
      'El estudiante describe lo que necesita y obtiene libros relevantes del catálogo, con motivo. El campo "modo" indica si se usó la IA.',
  })
  @ApiResponse({ status: 200, description: 'Libros relevantes ordenados' })
  busqueda(@Body() dto: IaConsultaDto, @Req() req: any) {
    return this.recomendadorLibros.busquedaInteligente(
      dto.consulta.trim(),
      req.user.id,
    );
  }
}
