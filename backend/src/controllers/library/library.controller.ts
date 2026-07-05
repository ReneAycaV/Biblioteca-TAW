/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { RolesGuard } from '../../security/guards/roles.guard';
import { Roles } from '../../security/decorators/roles.decorator';
import { LibraryAccessService } from '../../providers/library-access.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryAccessService: LibraryAccessService) {}

  @UseGuards(JwtAuthGuard)
  @Get('validate-loan')
  async validateLoan(@Req() req: any) {
    await this.libraryAccessService.validateAcademicStatus(req.user.id);

    return {
      message: 'Usuario habilitado para solicitar préstamo',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate-room-reservation')
  async validateRoomReservation(@Req() req: any) {
    await this.libraryAccessService.validateNoPendingFines(req.user.id);

    return {
      message: 'Usuario habilitado para reservar sala',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('books')
  async searchBooks(@Query() query: Record<string, string | undefined>) {
    return this.libraryAccessService.searchBooks(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('reservations/:id/cancel')
  async cancelReservation(
    @Param('id', ParseIntPipe) idReserva: number,
    @Body('motivoCancelacion') motivoCancelacion?: string,
  ) {
    const reserva = await this.libraryAccessService.cancelReservation(
      idReserva,
      motivoCancelacion,
    );

    return {
      message: 'Reserva cancelada exitosamente',
      reserva: {
        idReserva: reserva.idReserva,
        estado: reserva.estado,
        motivoCancelacion: reserva.motivoCancelacion,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('books/:id')
  async getBookDetail(@Param('id', ParseIntPipe) idLibro: number) {
    const libro = await this.libraryAccessService.getBookDetail(idLibro);

    return { libro };
  }
}
