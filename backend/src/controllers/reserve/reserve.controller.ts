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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { ReserveRoomService } from '../../providers/reserve-room.service';
import { ReserveCreateDto } from '../../dto/reserve-create.dto';
import { ReserveResponseDto } from '../../dto/reserve-response.dto';

@ApiTags('Reservas')
@Controller('reserve')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reserveRoomService: ReserveRoomService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva reserva',
    description: 'Crea una reserva de sala para el usuario autenticado',
  })
  @ApiBody({ type: ReserveCreateDto })
  @ApiResponse({
    status: 201,
    description: 'Reserva creada exitosamente',
    type: ReserveResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos (fecha pasada, horario incorrecto)',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado (token inválido o ausente)',
  })
  @ApiResponse({
    status: 403,
    description:
      'Acción prohibida (usuario inactivo, multa impaga, sala no disponible o conflicto de horario)',
  })
  @ApiResponse({ status: 404, description: 'Sala no encontrada' })
  async create(@Body() dto: ReserveCreateDto, @Req() req: any) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.create(dto, usuarioId);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Obtener todas mis reservas',
    description: 'Lista todas las reservas del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de reservas del usuario',
    type: [ReserveResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getMyReservations(@Req() req: any) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.findByUser(usuarioId);
  }

  @Get('common')
  @ApiOperation({
    summary: 'Obtener el bloque horario más frecuente',
    description: 'Devuelve el bloque horario que más se reserva en general',
  })
  @ApiResponse({
    status: 200,
    description: 'Bloque horario más frecuente',
    schema: {
      example: { bloqueHorario: '10:00-12:00', totalReservas: 15 },
    },
  })
  async getMostFrequentBlock() {
    return this.reserveRoomService.getMostFrequentBlock();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una reserva por ID',
    description:
      'Devuelve el detalle de una reserva específica (solo si pertenece al usuario o es ADMIN)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la reserva',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la reserva',
    type: ReserveResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para ver esta reserva',
  })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
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

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar una reserva',
    description:
      'Cancela una reserva activa (solo si pertenece al usuario o es ADMIN)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la reserva a cancelar',
    example: 1,
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        motivoCancelacion: {
          type: 'string',
          description: 'Motivo de la cancelación (opcional)',
          example: 'Cambio de planes',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva cancelada exitosamente',
    schema: {
      example: {
        message: 'Reserva cancelada exitosamente',
        idReserva: 1,
        estado: 'Cancelada',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede cancelar (ya cancelada o fecha pasada)',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'No puedes cancelar reservas de otro usuario',
  })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  cancelReservation(
    @Param('id') id: string,
    @Body('motivoCancelacion') motivoCancelacion: string,
    @Req() req: any,
  ) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.cancel(+id, usuarioId, motivoCancelacion);
  }
}
