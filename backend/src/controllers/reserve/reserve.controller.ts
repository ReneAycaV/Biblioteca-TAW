/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { RolesGuard } from '../../security/guards/roles.guard';
import { ReserveRoomService } from '../../providers/reserve-room.service';
import { ReserveCreateDto } from '../../dto/reserve-create.dto';

@ApiTags('Reservas')
@Controller('reserve')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reserveRoomService: ReserveRoomService) {}

  @Post()
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
  async create(@Body() dto: ReserveCreateDto, @Req() req: any) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.create(dto, usuarioId);
  }

  @Get('my')
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  getMyReservations(@Req() req: any) {
    const usuarioId = req.user.id;
    return this.reserveRoomService.findByUser(usuarioId);
  }

  @Get('salas')
  @ApiOperation({
    summary: 'Listar salas disponibles',
    description: 'Devuelve la lista de salas registradas',
  })
  async getAllSalas() {
    return this.reserveRoomService.getAllSalas();
  }

  @Get('salas/:id')
  @ApiOperation({
    summary: 'Obtener sala por ID',
    description: 'Devuelve los datos de una sala específica',
  })
  async getSalaById(@Param('id') id: string) {
    const parsed = Number(id);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('ID de sala inválido');
    }
    const sala = await this.reserveRoomService.getSalaById(parsed);
    if (!sala) throw new NotFoundException(`Sala con ID ${id} no encontrada`);
    return sala;
  }

  @Get(':id')
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para ver esta reserva',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada',
  })
  async getReservationById(@Param('id') id: string, @Req() req: any) {
    // convierte el string id a numero
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      throw new BadRequestException('ID de reserva inválido');
    }

    // busca en la BD la reserva con el ID
    const reserva = await this.reserveRoomService.findEntityById(parsedId);
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    // ID del usuario autenticado desde el token y valida que el usuario tenga permiso para ver la reserva
    const usuarioId = req.user.id;
    if (reserva.idUsuario.idUsuario !== usuarioId && req.user.rol !== 'ADMIN') {
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }

    // retornar usando el DTO
    return this.reserveRoomService.findById(parsedId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 400,
    description: 'No se puede cancelar (ya cancelada o fecha pasada)',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada',
  })
  cancelReservation(
    @Param('id') id: string,
    @Body('motivoCancelacion') motivoCancelacion: string,
    @Req() req: any,
  ) {
    return this.reserveRoomService.cancel(+id, req.user.id, motivoCancelacion);
  }
}
