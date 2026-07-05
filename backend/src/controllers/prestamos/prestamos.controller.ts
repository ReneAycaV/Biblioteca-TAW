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

import { PrestamosService } from '../../providers/prestamos.service';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { RolesGuard } from '../../security/guards/roles.guard';
import { Roles } from '../../security/decorators/roles.decorator';
import { SolicitarPrestamoDto } from '../../dto/solicitar-prestamo.dto';

@Controller('prestamos')
@UseGuards(JwtAuthGuard)
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.prestamosService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('atrasados')
  listarAtrasados() {
    return this.prestamosService.listarAtrasados();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('actualizar-atrasados')
  marcarAtrasados() {
    return this.prestamosService.marcarAtrasados();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prestamosService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/fechas')
  obtenerFechas(@Param('id', ParseIntPipe) id: number) {
    return this.prestamosService.obtenerFechas(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/entregar')
  marcarComoEntregado(@Param('id', ParseIntPipe) id: number) {
    return this.prestamosService.marcarComoEntregado(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/finalizar')
  finalizarPrestamo(@Param('id', ParseIntPipe) id: number) {
    return this.prestamosService.finalizarPrestamo(id);
  }

  @Post('solicitar')
  async solicitarPrestamo(
    @Req() req: any,
    @Body() solicitarPrestamoDto: SolicitarPrestamoDto,
  ) {
    const prestamo = await this.prestamosService.solicitarPrestamo(
      req.user.id,
      solicitarPrestamoDto.idLibro,
    );

    return {
      message: 'Préstamo solicitado exitosamente',
      prestamo: {
        idPrestamo: prestamo.idPrestamo,
        fechaPrestamo: prestamo.fechaPrestamo,
        fechaDevolucionEsperada: prestamo.fechaDevolucionEsperada,
        estado: prestamo.estado,
      },
    };
  }

  @Post(':id/devolver')
  async devolverPrestamo(
    @Req() req: any,
    @Param('id', ParseIntPipe) idPrestamo: number,
  ) {
    const prestamo = await this.prestamosService.devolverPrestamo(
      req.user.id,
      idPrestamo,
    );

    return {
      message: 'Libro devuelto exitosamente',
      prestamo: {
        idPrestamo: prestamo.idPrestamo,
        fechaDevolucionReal: prestamo.fechaDevolucionReal,
        estado: prestamo.estado,
      },
    };
  }
}
