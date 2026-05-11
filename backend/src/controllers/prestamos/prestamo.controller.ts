import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { PrestamoService } from '../../providers/prestamo.service';
import { SolicitarPrestamoDto } from '../../dto/solicitar-prestamo.dto';

@Controller('prestamos')
export class PrestamoController {
  constructor(private readonly prestamoService: PrestamoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('solicitar')
  async solicitarPrestamo(
    @Req() req: any,
    @Body() solicitarPrestamoDto: SolicitarPrestamoDto,
  ) {
    const prestamo = await this.prestamoService.solicitarPrestamo(
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
}
