/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// controllers/reservations/reservations.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { ReserveRoomService } from '../../providers/reserve-room.service';
import { ReserveCreateDto } from '../../dto/reserve-create.dto';

@Controller('reserve')
@UseGuards(JwtAuthGuard) // Protege TODOS los endpoints del controller
export class ReservationsController {
  constructor(private readonly reserveRoomService: ReserveRoomService) {}

  // crea una reserva
  @Post()
  async create(@Body() dto: ReserveCreateDto, @Req() req: any) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.create(dto, usuarioId);
  }

  // ver todas las reservas de un usuario especifico
  @Get('my')
  getMyReservations(@Req() req: any) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.findByUser(usuarioId);
  }

  @Get('common')
  async getMostFrequentBlock() {
    return this.reserveRoomService.getMostFrequentBlock();
  }

  // detalle de una reserva específica
  @Get(':id')
  async getReservationById(@Param('id') id: string, @Req() req: any) {
    console.log('ID recibido:', id);
    const usuarioId = req.user.id;

    // Usar método privado para validación
    const reserva = await this.reserveRoomService.findEntityById(+id);

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    // Validar usando la entidad
    if (reserva.idUsuario.idUsuario !== usuarioId && req.user.rol !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }

    // Retornar usando el DTO
    return this.reserveRoomService.findById(+id);
  }

  // cancelar una reserva
  @Patch(':id/cancel')
  cancelReservation(
    @Param('id') id: string,
    @Body('motivoCancelacion') motivoCancelacion: string,
    @Req() req: any,
  ) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.cancel(+id, usuarioId, motivoCancelacion);
  }
}
