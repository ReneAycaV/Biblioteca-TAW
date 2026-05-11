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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const usuarioId = req.user.id; // El ID viene del token JWT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.reserveRoomService.create(dto, usuarioId);
  }

  // ver mis reservas
  @Get('my')
  getMyReservations(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const usuarioId = req.user.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.reserveRoomService.findByUser(usuarioId);
  }

  // detalle de una reserva específica
  @Get(':id')
  async getReservationById(@Param('id') id: string, @Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const usuarioId = req.user.id;
    const reserva = await this.reserveRoomService.findById(+id);

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    // verificar que la reserva pertenezca al usuario
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (reserva.usuario.idUsuario !== usuarioId && req.user.rol !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }
    return reserva;
  }

  // cancelar una reserva
  @Patch(':id/cancel')
  cancelReservation(@Param('id') id: string, @Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const usuarioId = req.user.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.reserveRoomService.cancel(+id, usuarioId);
  }
}
